import {
  handleOptions,
  jsonResponse,
  errorResponse,
  callClaude,
  parseJsonResponse,
} from "./utils/anthropic.js";

const SYSTEM_PROMPT = `You are a disaster response coordinator AI. Produce a concise situation report for the operations team.
Respond with ONLY valid JSON in this format:
{
  "sitrep": "A 3-4 sentence summary of the overall situation status, key developments, and critical concerns.",
  "stats": { "total": N, "pending": N, "assigned": N, "resolved": N },
  "recommendations": ["action item 1", "action item 2", "action item 3"]
}
Provide exactly 3-5 actionable recommendations prioritized by urgency. The sitrep should be written in clear, professional emergency-management language.`;

function validateInput(body) {
  const { eventName, needs } = body;

  if (!eventName || typeof eventName !== "string") {
    return "eventName is required and must be a string";
  }
  if (!Array.isArray(needs)) {
    return "needs must be an array";
  }
  return null;
}

function buildUserPrompt(body) {
  const { eventName, needs, assignments, volunteers } = body;

  const stats = {
    total: needs.length,
    pending: needs.filter((n) => n.status === "pending").length,
    assigned: needs.filter((n) => n.status === "assigned" || n.status === "in_progress").length,
    resolved: needs.filter((n) => n.status === "resolved").length,
  };

  const criticalNeeds = needs
    .filter((n) => (n.urgency_ai || n.urgency_self) >= 4 && n.status === "pending")
    .slice(0, 5);

  const availableVolunteers = (volunteers || []).filter((v) => v.available);
  const activeAssignments = (assignments || []).filter((a) => a.status !== "completed");

  let prompt = `EVENT: ${eventName}

STATISTICS:
- Total needs reported: ${stats.total}
- Pending (unassigned): ${stats.pending}
- Assigned/In-progress: ${stats.assigned}
- Resolved: ${stats.resolved}
- Available volunteers: ${availableVolunteers.length}
- Active assignments: ${activeAssignments.length}`;

  if (criticalNeeds.length > 0) {
    prompt += `\n\nCRITICAL UNRESOLVED NEEDS:`;
    for (const n of criticalNeeds) {
      prompt += `\n- [${n.need_type.toUpperCase()}] Urgency ${n.urgency_ai || n.urgency_self}/5: ${n.description.slice(0, 100)}`;
    }
  }

  const skillPool = {};
  for (const v of availableVolunteers) {
    for (const skill of v.skills || []) {
      skillPool[skill] = (skillPool[skill] || 0) + 1;
    }
  }
  if (Object.keys(skillPool).length > 0) {
    prompt += `\n\nAVAILABLE SKILL POOL: ${JSON.stringify(skillPool)}`;
  }

  return prompt;
}

function validateSitrepResult(result) {
  if (typeof result.sitrep !== "string" || result.sitrep.length === 0) {
    return false;
  }
  if (!result.stats || typeof result.stats.total !== "number") {
    return false;
  }
  if (!Array.isArray(result.recommendations) || result.recommendations.length === 0) {
    return false;
  }
  return true;
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }

  if (event.httpMethod !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return errorResponse("Invalid JSON in request body", 400);
  }

  const validationError = validateInput(body);
  if (validationError) {
    return errorResponse(validationError, 400);
  }

  try {
    const userPrompt = buildUserPrompt(body);
    const rawResponse = await callClaude(SYSTEM_PROMPT, userPrompt);
    const sitrepResult = parseJsonResponse(rawResponse);

    if (!validateSitrepResult(sitrepResult)) {
      return errorResponse(
        "AI returned an invalid response format. Please retry.",
        502,
        "Sitrep response validation failed"
      );
    }

    return jsonResponse({
      sitrep: sitrepResult.sitrep,
      stats: sitrepResult.stats,
      recommendations: sitrepResult.recommendations,
    });
  } catch (error) {
    console.error("Claude sitrep error:", error);

    if (error.status === 401) {
      return errorResponse("AI service authentication failed", 503);
    }
    if (error.status === 429) {
      return errorResponse("AI service rate limited. Please retry in a moment.", 503);
    }

    return errorResponse(
      "AI sitrep service unavailable",
      503,
      error.message
    );
  }
}
