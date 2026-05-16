const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};
const SYSTEM_PROMPT = `You are a disaster response coordinator AI. Analyse the incoming need and available volunteers.
    Respond with ONLY valid JSON — no markdown, no explanation, no code blocks.
    Rate urgency 1-5 (5=life threatening, immediate risk, 4=urgent needs help within 1hr,
    3=needs help today, 2=can wait 24hr, 1=low priority). 
    Write a 2-sentence coordinator brief (what to do first, what to watch for).
    From the available volunteer skills, list which skills are needed.
    Available skills: medical, driving, cooking, rescue, translation, logistics.
    JSON format exactly: {"urgency_ai":3,"ai_brief":"...","ai_matched_skills":["medical"]}`;

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

  if (!body.needDescription || typeof body.needDescription !== "string") {
    return "needDescription is required";
  }

  if (!body.needType || typeof body.needType !== "string") {
    return "needType is required";
  }

  if (typeof body.urgencySelf !== "number") {
    return "urgencySelf is required";
  }

  if (!Array.isArray(body.availableVolunteers)) {
    return "availableVolunteers is required";
  }

  for (const volunteer of body.availableVolunteers) {
    if (
      !volunteer ||
      typeof volunteer.name !== "string" ||
      !Array.isArray(volunteer.skills) ||
      typeof volunteer.lat !== "number" ||
      typeof volunteer.lng !== "number"
    ) {
      return "Each available volunteer must include name, skills, lat, and lng";
    }
  }

  return null;
}

function getAvailableSkills(availableVolunteers) {
  const skills = new Set();

  for (const volunteer of availableVolunteers) {
    if (Array.isArray(volunteer.skills)) {
      for (const skill of volunteer.skills) {
        skills.add(skill);
      }
    }
  }

  return Array.from(skills);
}

function parseClaudeJson(text) {
  return JSON.parse(text.trim());
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

    const { needDescription, needType, urgencySelf, availableVolunteers } = body;
    const availableSkills = getAvailableSkills(availableVolunteers);
    const userMessage = `Need type: ${needType}. Submitted urgency: ${urgencySelf}/5. Description: ${needDescription}. Available volunteer skills nearby: ${JSON.stringify(availableSkills)}`;

    const response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
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
    const triageResult = parseClaudeJson(data.content[0].text);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(triageResult),
    };
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
