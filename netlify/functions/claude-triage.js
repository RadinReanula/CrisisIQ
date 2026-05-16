import {
  handleOptions,
  jsonResponse,
  errorResponse,
  callClaude,
  parseJsonResponse,
} from "./utils/anthropic.js";

const SYSTEM_PROMPT = `You are a disaster response coordinator AI. Analyse the incoming need and respond with ONLY valid JSON.
Assess urgency 1-5 (5=life threatening). Write a 2-sentence coordinator brief.
List the skills needed from: medical, driving, cooking, rescue, translation, logistics.
Response format: {"urgency_ai":N,"ai_brief":"...","ai_matched_skills":["..."]}`;

const VALID_NEED_TYPES = ["food", "medical", "rescue", "shelter", "other"];
const VALID_SKILLS = ["medical", "driving", "cooking", "rescue", "translation", "logistics"];

function validateInput(body) {
  const { needDescription, needType, urgencySelf } = body;

  if (!needDescription || typeof needDescription !== "string") {
    return "needDescription is required and must be a string";
  }
  if (!needType || !VALID_NEED_TYPES.includes(needType)) {
    return `needType must be one of: ${VALID_NEED_TYPES.join(", ")}`;
  }
  if (urgencySelf === undefined || urgencySelf < 1 || urgencySelf > 5) {
    return "urgencySelf must be a number between 1 and 5";
  }
  return null;
}

function validateTriageResult(result) {
  if (typeof result.urgency_ai !== "number" || result.urgency_ai < 1 || result.urgency_ai > 5) {
    return false;
  }
  if (typeof result.ai_brief !== "string" || result.ai_brief.length === 0) {
    return false;
  }
  if (!Array.isArray(result.ai_matched_skills)) {
    return false;
  }
  const validSkills = result.ai_matched_skills.every((s) => VALID_SKILLS.includes(s));
  if (!validSkills) {
    return false;
  }
  return true;
}

function buildUserPrompt(body) {
  const { needDescription, needType, urgencySelf, availableVolunteers } = body;

  let prompt = `INCOMING NEED:
Type: ${needType}
Self-rated urgency: ${urgencySelf}/5
Description: ${needDescription}`;

  if (availableVolunteers && availableVolunteers.length > 0) {
    prompt += `\n\nAVAILABLE VOLUNTEERS (${availableVolunteers.length}):`;
    for (const v of availableVolunteers.slice(0, 20)) {
      prompt += `\n- ${v.name}: skills=[${v.skills.join(",")}], distance ~${v.lat ? "nearby" : "unknown"}`;
    }
  } else {
    prompt += "\n\nNo volunteers currently available in the area.";
  }

  return prompt;
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
    const triageResult = parseJsonResponse(rawResponse);

    if (!validateTriageResult(triageResult)) {
      return errorResponse(
        "AI returned an invalid response format. Please retry.",
        502,
        "Response validation failed"
      );
    }

    return jsonResponse({
      urgency_ai: triageResult.urgency_ai,
      ai_brief: triageResult.ai_brief,
      ai_matched_skills: triageResult.ai_matched_skills,
    });
  } catch (error) {
    console.error("Claude triage error:", error);

    if (error.status === 401) {
      return errorResponse("AI service authentication failed", 503);
    }
    if (error.status === 429) {
      return errorResponse("AI service rate limited. Please retry in a moment.", 503);
    }

    return errorResponse(
      "AI triage service unavailable",
      503,
      error.message
    );
  }
}
