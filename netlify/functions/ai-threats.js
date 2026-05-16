const {
  callOpenAi,
  parseJsonResponse,
  jsonResponse,
  errorResponse,
  handleOptions,
} = require("./utils/openai");
const { fetchRecentRequests } = require("./utils/supabaseAdmin");

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_KEY = "ai-threats:v1";

const URGENCY_LEVELS = ["critical", "high", "medium", "low"];
const CATEGORY_LABELS = [
  "natural-disaster",
  "medical",
  "rescue",
  "shelter",
  "food-water",
  "security",
  "infrastructure",
  "other",
];

// Process at most this many requests per OpenAI call. Multiple chunks run
// in parallel via Promise.allSettled. Keeps each call fast and avoids the
// model truncating large JSON outputs.
const CHUNK_SIZE = 8;
// Token ceiling per chunk. ~120 output tokens per analysis × 8 = 960; the
// extra headroom guards against the model padding fields.
const MAX_TOKENS_PER_CHUNK = 1100;

/** Module-level cache; Netlify keeps the warm container alive for a few minutes. */
const cache = new Map();

const SYSTEM_PROMPT = `You are CrisisIQ's coordinator AI. Read each request's description (free text from a person in distress) and output strict JSON.

Schema:
{"analyses":[{"id":"<copy>","ai_urgency":"critical|high|medium|low","ai_category":"natural-disaster|medical|rescue|shelter|food-water|security|infrastructure|other","ai_summary":"1 sentence, <=140 chars","ai_actions":["1-3 short verb-led recommendations"],"ai_confidence":0.0-1.0}]}

Rules:
- One analysis per input, id verbatim. No extras, no skips.
- ai_urgency: critical only for life-threat (trapped, drowning, severe bleeding, collapse, cardiac). May differ from user-supplied urgency.
- ai_category: pick the broadest accurate label.
- ai_summary: neutral, factual, no speculation. If unintelligible, say so.
- ai_actions: 1-3 short verb-led commands ("Dispatch ambulance", "Send rescue team").
- ai_confidence < 0.4 when description is too short/unintelligible.
- No markdown, no commentary outside JSON.`;

function nowIso() {
  return new Date().toISOString();
}

/**
 * Validates a single AI analysis returned by the model. Returns `null` if
 * unusable. The caller will then leave that threat without an `ai` block.
 */
function coerceAnalysis(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;

  const urgency = URGENCY_LEVELS.includes(raw.ai_urgency)
    ? raw.ai_urgency
    : null;
  const category = CATEGORY_LABELS.includes(raw.ai_category)
    ? raw.ai_category
    : "other";
  const summary =
    typeof raw.ai_summary === "string" ? raw.ai_summary.trim() : "";
  const actions = Array.isArray(raw.ai_actions)
    ? raw.ai_actions
        .filter((s) => typeof s === "string" && s.trim().length > 0)
        .slice(0, 3)
        .map((s) => s.trim())
    : [];
  const conf = Number(raw.ai_confidence);
  const confidence =
    Number.isFinite(conf) && conf >= 0 && conf <= 1 ? conf : 0.5;

  if (!urgency || !summary) return null;

  return {
    id,
    analysis: {
      ai_urgency: urgency,
      ai_category: category,
      ai_summary: summary,
      ai_actions: actions,
      ai_confidence: confidence,
    },
  };
}

/**
 * Builds the compact prompt payload. We strip server-side metadata to
 * keep the prompt size small and avoid leaking personal contact details
 * to the model.
 */
function buildAiPayload(rows) {
  return rows.map((r) => ({
    id: r.id,
    need_type: r.need_type,
    urgency_user: r.urgency,
    location_text: r.location_text,
    description: r.description,
  }));
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function runChunk(rows) {
  const userPrompt = `Analyse these ${rows.length} requests. Return the analyses JSON now.\n${JSON.stringify(
    buildAiPayload(rows),
    null,
    0,
  )}`;

  const text = await callOpenAi(SYSTEM_PROMPT, userPrompt, {
    json: true,
    maxTokens: MAX_TOKENS_PER_CHUNK,
  });
  const parsed = parseJsonResponse(text);
  return Array.isArray(parsed?.analyses) ? parsed.analyses : [];
}

/**
 * Splits rows into CHUNK_SIZE-row batches, sends them to OpenAI in parallel
 * via Promise.allSettled, and merges the results. A failing chunk is logged
 * but does not break the others — those threats just won't carry an `ai`
 * block (the UI degrades gracefully to the raw description).
 */
async function runAiAnalysis(rows) {
  if (rows.length === 0) return new Map();
  const chunks = chunk(rows, CHUNK_SIZE);

  const settled = await Promise.allSettled(chunks.map(runChunk));

  const out = new Map();
  for (let i = 0; i < settled.length; i += 1) {
    const result = settled[i];
    if (result.status !== "fulfilled") {
      console.error(
        `[ai-threats] chunk ${i + 1}/${chunks.length} failed:`,
        result.reason instanceof Error ? result.reason.message : result.reason,
      );
      continue;
    }
    for (const raw of result.value) {
      const coerced = coerceAnalysis(raw);
      if (coerced) out.set(coerced.id, coerced.analysis);
    }
  }
  return out;
}

async function generateThreats({ skipAi }) {
  const rows = await fetchRecentRequests({
    limit: 40,
    windowHours: 168, // last 7 days
    includeResolved: false,
  });

  const generated_at = nowIso();
  const next_refresh_at = new Date(Date.now() + CACHE_TTL_MS).toISOString();

  if (rows.length === 0) {
    return { threats: [], ai_enabled: false, generated_at, next_refresh_at };
  }

  const analyses = skipAi ? new Map() : await runAiAnalysis(rows);

  const threats = rows.map((row) => {
    const ai = analyses.get(row.id);
    return ai ? { ...row, ai } : { ...row };
  });

  return {
    threats,
    ai_enabled: analyses.size > 0,
    generated_at,
    next_refresh_at,
  };
}

function readCache() {
  const entry = cache.get(CACHE_KEY);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(CACHE_KEY);
    return null;
  }
  return entry.payload;
}

function writeCache(payload) {
  cache.set(CACHE_KEY, {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const qs = event.queryStringParameters || {};
  const force = qs.force === "1" || qs.force === "true";
  const skipAi = qs.ai === "0" || qs.ai === "false";

  if (!force && !skipAi) {
    const cached = readCache();
    if (cached) {
      return jsonResponse(200, cached);
    }
  }

  try {
    const payload = await generateThreats({ skipAi });
    if (!skipAi) {
      writeCache(payload);
    }
    return jsonResponse(200, payload);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
};
