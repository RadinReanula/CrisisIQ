const OpenAI = require("openai").default;

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DEFAULT_NEWS_MODEL = process.env.OPENAI_NEWS_MODEL || "gpt-4o-mini";

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

function corsHeaders() {
  return { ...CORS_HEADERS };
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

function errorResponse(message, statusCode = 500, details = null) {
  const body = { error: message };
  if (details) body.details = details;
  return jsonResponse(statusCode, body);
}

function handleOptions() {
  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: "",
  };
}

/**
 * Calls OpenAI Chat Completions with a system + user prompt.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ json?: boolean, model?: string, maxTokens?: number }} [opts]
 * @returns {Promise<string>} Raw assistant text content.
 */
async function callOpenAi(systemPrompt, userPrompt, opts = {}) {
  const { json = false, model = DEFAULT_MODEL, maxTokens } = opts;
  const client = getClient();

  const completion = await client.chat.completions.create({
    model,
    response_format: json ? { type: "json_object" } : undefined,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error("OpenAI returned an empty response");
  }
  return content;
}

/**
 * Calls the Responses API with the web_search_preview tool enabled.
 * Returns the consolidated output text (model's final message).
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ model?: string, json?: boolean }} [opts]
 * @returns {Promise<string>} Raw assistant output text.
 */
async function callOpenAiWithWebSearch(systemPrompt, userPrompt, opts = {}) {
  const { model = DEFAULT_NEWS_MODEL, json = true } = opts;
  const client = getClient();

  const response = await client.responses.create({
    model,
    tools: [{ type: "web_search" }],
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: json
      ? { format: { type: "json_object" } }
      : undefined,
  });

  if (typeof response.output_text === "string" && response.output_text.length > 0) {
    return response.output_text;
  }

  if (Array.isArray(response.output)) {
    for (const item of response.output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        for (const part of item.content) {
          if (part.type === "output_text" && typeof part.text === "string") {
            return part.text;
          }
        }
      }
    }
  }

  throw new Error("OpenAI Responses API returned no text content");
}

/**
 * Parses JSON returned by the model, tolerating fenced code blocks.
 * @param {string} text
 */
function parseJsonResponse(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const raw = fenced ? fenced[1] : trimmed;
  return JSON.parse(raw);
}

module.exports = {
  callOpenAi,
  callOpenAiWithWebSearch,
  parseJsonResponse,
  corsHeaders,
  jsonResponse,
  errorResponse,
  handleOptions,
};
