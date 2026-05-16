const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};
const SYSTEM_PROMPT = "You are a disaster response AI. Generate a concise situation report (sitrep) for incident commanders. Be factual, brief, and prioritise actionable insights. Use plain English, no jargon.";

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

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
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    };
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
    const pending = needs.filter((need) => need.status === "pending").length;
    const assigned = needs.filter((need) => need.status === "assigned" || need.status === "in_progress").length;
    const resolved = needs.filter((need) => need.status === "resolved").length;
    const criticalList = buildCriticalList(needs);
    const activeCount = volunteers.filter((volunteer) => volunteer.available !== false).length;
    const userMessage = `Event: ${eventName}. Total needs: ${total}. Pending: ${pending}. Assigned: ${assigned}. Resolved: ${resolved}. Critical needs (urgency 4-5): ${JSON.stringify(criticalList)}. Active volunteers: ${activeCount}. Generate a 5-sentence sitrep with current status, critical priorities, resource gaps, and recommended next actions.`;

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const sitrep = data.content[0].text;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ sitrep }),
    };
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
