import Anthropic from "@anthropic-ai/sdk";

let client = null;

export function getAnthropicClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export function jsonResponse(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

export function errorResponse(message, statusCode = 500, details = null) {
  const body = { error: message };
  if (details) body.details = details;
  return jsonResponse(body, statusCode);
}

export function handleOptions() {
  return {
    statusCode: 204,
    headers: corsHeaders(),
    body: "",
  };
}

export async function callClaude(systemPrompt, userPrompt) {
  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock) {
    throw new Error("No text content in Claude response");
  }
  return textBlock.text;
}

export function parseJsonResponse(text) {
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(cleaned);
}
