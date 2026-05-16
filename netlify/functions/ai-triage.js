const {
  callOpenAi,
  parseJsonResponse,
  jsonResponse,
  errorResponse,
  handleOptions,
} = require("./utils/openai");

const SYSTEM_PROMPT = `You are a disaster response coordinator AI. Analyse the incoming need and available volunteers.
Respond with ONLY valid JSON — no markdown, no explanation, no code blocks.
Rate urgency 1-5 (5=life threatening, immediate risk, 4=urgent needs help within 1hr,
3=needs help today, 2=can wait 24hr, 1=low priority).
Write a 2-sentence coordinator brief (what to do first, what to watch for).
From the available volunteer skills, list which skills are needed.
Available skills: medical, driving, cooking, rescue, translation, logistics.
JSON format exactly: {"urgency_ai":3,"ai_brief":"...","ai_matched_skills":["medical"]}`;

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

function coerceTriageResult(parsed, fallbackUrgency) {
  const urgency = Number(parsed && parsed.urgency_ai);
  const brief = typeof parsed?.ai_brief === "string" ? parsed.ai_brief : "";
  const matched = Array.isArray(parsed?.ai_matched_skills)
    ? parsed.ai_matched_skills.filter((s) => typeof s === "string")
    : [];

  return {
    urgency_ai:
      Number.isFinite(urgency) && urgency >= 1 && urgency <= 5
        ? Math.round(urgency)
        : fallbackUrgency,
    ai_brief: brief || "Coordinator review required.",
    ai_matched_skills: matched,
  };
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

    const { needDescription, needType, urgencySelf, availableVolunteers } = body;
    const availableSkills = getAvailableSkills(availableVolunteers);
    const userMessage = `Need type: ${needType}. Submitted urgency: ${urgencySelf}/5. Description: ${needDescription}. Available volunteer skills nearby: ${JSON.stringify(availableSkills)}`;

    const text = await callOpenAi(SYSTEM_PROMPT, userMessage, {
      json: true,
      maxTokens: 500,
    });

    const parsed = parseJsonResponse(text);
    const triageResult = coerceTriageResult(parsed, urgencySelf);

    return jsonResponse(200, triageResult);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500,
    );
  }
};
