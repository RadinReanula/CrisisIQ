const {
  callOpenAi,
  jsonResponse,
  errorResponse,
  handleOptions,
} = require("./utils/openai");

const SYSTEM_PROMPT =
  "You are a disaster response AI. Generate a concise situation report (sitrep) for incident commanders. Be factual, brief, and prioritise actionable insights. Use plain English, no jargon.";

function validateBody(body) {
  if (!body || typeof body !== "object") {
    return "Request body is required";
  }
  if (!Array.isArray(body.needs)) {
    return "needs is required";
  }
  if (!Array.isArray(body.assignments)) {
    return "assignments is required";
  }
  if (!Array.isArray(body.volunteers)) {
    return "volunteers is required";
  }
  if (!body.eventName || typeof body.eventName !== "string") {
    return "eventName is required";
  }
  return null;
}

function getUrgency(need) {
  return need.urgency_ai || need.urgency_self || 0;
}

function buildCriticalList(needs) {
  return needs
    .filter((need) => getUrgency(need) >= 4)
    .map((need) => ({
      type: need.need_type,
      urgency: getUrgency(need),
      status: need.status,
      description: need.description,
    }));
}

exports.handler = async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const validationError = validateBody(body);
    if (validationError) {
      return jsonResponse(400, { error: validationError });
    }

    const { needs, volunteers, eventName } = body;
    const total = needs.length;
    const pending = needs.filter((n) => n.status === "pending").length;
    const assigned = needs.filter(
      (n) => n.status === "assigned" || n.status === "in_progress",
    ).length;
    const resolved = needs.filter((n) => n.status === "resolved").length;
    const criticalList = buildCriticalList(needs);
    const activeCount = volunteers.filter((v) => v.available !== false).length;

    const userMessage = `Event: ${eventName}. Total needs: ${total}. Pending: ${pending}. Assigned: ${assigned}. Resolved: ${resolved}. Critical needs (urgency 4-5): ${JSON.stringify(criticalList)}. Active volunteers: ${activeCount}. Generate a 5-sentence sitrep with current status, critical priorities, resource gaps, and recommended next actions.`;

    const sitrep = await callOpenAi(SYSTEM_PROMPT, userMessage, {
      maxTokens: 700,
    });

    return jsonResponse(200, { sitrep: sitrep.trim() });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
};
