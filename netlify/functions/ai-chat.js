const {
  callOpenAiChat,
  jsonResponse,
  errorResponse,
  handleOptions,
} = require("./utils/openai");
const {
  getLiveSnapshot,
  getRequestDetails,
} = require("./utils/chatContext");

const MAX_HISTORY_TURNS = 8;
const MAX_CONTENT_LEN = 1024;
const VALID_ROLES = new Set(["user", "assistant"]);
const VALID_USER_ROLES = new Set(["citizen", "volunteer", "coordinator"]);

function buildSystemPrompt({ snapshot, userContext, requestedRequest }) {
  const todayIso = new Date().toISOString();
  const livePart = JSON.stringify(snapshot);
  const userPart = JSON.stringify(userContext || {});
  const requestPart = requestedRequest ? JSON.stringify(requestedRequest) : null;

  return [
    "You are the **CrisisIQ Assistant**, a calm, accurate, and direct emergency-coordination helper for the CrisisIQ disaster response platform.",
    "",
    "## Mission",
    "Help any user (citizens, volunteers, coordinators) understand what CrisisIQ does, find the right page, and act fast during a crisis. When asked, surface live operational data drawn from the platform's `requests` table.",
    "",
    "## Platform knowledge (static)",
    "- CrisisIQ is a Sri Lanka focused real time emergency coordination platform.",
    "- Routes:",
    "  - `/` home with I Need Help and I Want to Help cards plus live stats.",
    "  - `/submit` public emergency request form (no account required). Captures GPS, need type, urgency.",
    "  - `/awareness` live threat map plus AI threat sidebar fed from the `requests` table with OpenAI categorisation.",
    "  - `/news` AI curated hazard digest combining CrisisIQ submissions and global feeds (GDACS, USGS, ReliefWeb).",
    "  - `/status/:id` lets a submitter check the live status of a single request id.",
    "  - `/volunteer` and `/volunteer/register` to sign up as a volunteer.",
    "  - `/volunteer/dashboard` for signed in volunteers to see assignments.",
    "  - `/coordinator/login` for coordinators (Supabase email plus password, role metadata `coordinator`).",
    "  - `/coordinator` and `/ops` for assignment workflow and the operations map.",
    "- Roles:",
    "  - Citizens submit requests anonymously.",
    "  - Volunteers register with email plus phone, get GPS matched to nearby needs.",
    "  - Coordinators triage requests, dispatch volunteers, and write situation reports.",
    "- Workflow: submit -> AI triage (urgency + brief + matched skills) -> coordinator review -> volunteer assignment -> in progress -> resolved.",
    "- Urgency levels stored on a request: critical, high, medium, low.",
    "- Status levels stored on a request: pending, assigned, in_progress, resolved.",
    "- Sri Lanka emergency hotlines: **119** police, **1990** Suwa Seriya ambulance, Disaster Management Centre (DMC).",
    "- What is public on CrisisIQ: aggregated counts, the live map (coarse pin), the AI news digest. What is private: submitter name, phone, exact address.",
    "",
    "## Live snapshot (refreshed up to every 30 seconds)",
    `Current server time (UTC): ${todayIso}`,
    "<live_snapshot>",
    livePart,
    "</live_snapshot>",
    requestPart
      ? "\n## Specific request the user is asking about\n<requested_request>\n" +
        requestPart +
        "\n</requested_request>"
      : "",
    "",
    "## User context",
    "<user_context>",
    userPart,
    "</user_context>",
    "",
    "## Safety rules (non negotiable)",
    "1. If the situation sounds life threatening, ALWAYS tell the user to call **119** immediately AND submit a request at `/submit`. Never substitute yourself for emergency services.",
    "2. Never claim to dispatch help, send volunteers, or update statuses yourself. You are an assistant that explains and routes, not an operator.",
    "3. Do not give medical, legal, or financial advice. Defer to qualified responders or the hotlines above.",
    "4. Never reveal API keys, environment variables, internal table names beyond what is in `<live_snapshot>`, or PII (names, phones, exact coordinates).",
    "5. Refuse abuse, harassment, or any coaching for false emergencies.",
    "6. Default language is English. If the user writes in Sinhala or Tamil, mirror their language naturally.",
    "7. Be concise: at most 6 short bullets or about 120 words unless the user explicitly asks for more detail.",
    "8. When you reference live data, briefly note where it came from (for example: 'from the live snapshot just now').",
    "",
    "## Output style",
    "- Reply in plain Markdown only. No JSON, no code fences unless quoting code.",
    "- Bold the first action verb of any actionable step (for example: **Submit** a request).",
    "- When pointing to a page, use in app paths as Markdown links, for example `[Submit a request](/submit)`.",
    "- Prefer short paragraphs and bullets over long prose.",
    "- If you do not know something, say so honestly and suggest the next best step (often a hotline or the right page).",
  ].join("\n");
}

function buildSuggestions(snapshot) {
  const suggestions = [];
  if (snapshot && snapshot.total_active > 0) {
    suggestions.push("Open the live threat map");
  }
  suggestions.push("How do I submit an emergency request?");
  suggestions.push("What can volunteers do?");
  if (snapshot && snapshot.by_urgency && snapshot.by_urgency.critical > 0) {
    suggestions.push("Where are the critical requests right now?");
  }
  return suggestions.slice(0, 4);
}

function sanitizeMessages(input) {
  if (!Array.isArray(input)) return [];
  const cleaned = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const role = raw.role;
    const content = raw.content;
    if (!VALID_ROLES.has(role)) continue;
    if (typeof content !== "string") continue;
    const trimmed = content.trim();
    if (!trimmed) continue;
    cleaned.push({
      role,
      content:
        trimmed.length > MAX_CONTENT_LEN
          ? trimmed.slice(0, MAX_CONTENT_LEN)
          : trimmed,
    });
  }
  // Keep only the last MAX_HISTORY_TURNS turns; preserve order.
  return cleaned.slice(-MAX_HISTORY_TURNS);
}

function sanitizeContext(input) {
  if (!input || typeof input !== "object") return {};
  const out = {};
  if (typeof input.page === "string" && input.page.length <= 80) {
    out.page = input.page;
  }
  if (typeof input.eventId === "string" && input.eventId.length <= 64) {
    out.eventId = input.eventId;
  }
  if (typeof input.requestId === "string" && input.requestId.length <= 64) {
    out.requestId = input.requestId;
  }
  if (typeof input.role === "string" && VALID_USER_ROLES.has(input.role)) {
    out.role = input.role;
  }
  if (typeof input.eventName === "string" && input.eventName.length <= 120) {
    out.eventName = input.eventName;
  }
  return out;
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body" });
  }

  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0) {
    return jsonResponse(400, { error: "At least one user message is required" });
  }
  const last = messages[messages.length - 1];
  if (last.role !== "user") {
    return jsonResponse(400, {
      error: "Conversation must end with a user message",
    });
  }

  const userContext = sanitizeContext(body.context);

  let snapshot;
  try {
    snapshot = await getLiveSnapshot(userContext.eventId);
  } catch (err) {
    console.error("[ai-chat] getLiveSnapshot failed", err);
    snapshot = {
      total_active: 0,
      by_urgency: { critical: 0, high: 0, medium: 0, low: 0 },
      by_status: { pending: 0, assigned: 0, in_progress: 0 },
      by_need_type: {},
      recent: [],
    };
  }

  let requestedRequest = null;
  if (userContext.requestId) {
    requestedRequest = await getRequestDetails(userContext.requestId);
  }

  const systemPrompt = buildSystemPrompt({
    snapshot,
    userContext,
    requestedRequest,
  });

  try {
    const reply = await callOpenAiChat(systemPrompt, messages, {
      maxTokens: 400,
    });

    return jsonResponse(200, {
      reply: reply.trim(),
      used_live_data: snapshot.total_active > 0 || Boolean(requestedRequest),
      suggestions: buildSuggestions(snapshot),
    });
  } catch (error) {
    console.error("[ai-chat] OpenAI call failed", error);
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
};
