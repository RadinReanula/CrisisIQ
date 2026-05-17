import type { ChatContextHint, ChatMessage, ChatReply } from '../types';

const FUNCTIONS_BASE = '/.netlify/functions';

/** Wire-shape sent to the server: drop the client-only fields. */
interface WireMessage {
  role: ChatMessage['role'];
  content: string;
}

function toWire(messages: ChatMessage[]): WireMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

/**
 * POSTs the conversation history (plus optional client context hints)
 * to the `ai-chat` Netlify function and returns the assistant reply.
 *
 * Throws when the server responds non-2xx or the request fails; the
 * caller (the chat hook) renders an error state and offers a retry,
 * matching the existing `getAiThreats` pattern in `src/services/ai.ts`.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  contextHint: ChatContextHint = {},
  signal?: AbortSignal,
): Promise<ChatReply> {
  const response = await fetch(`${FUNCTIONS_BASE}/ai-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: toWire(messages),
      context: contextHint,
    }),
    signal,
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body && typeof body.error === 'string') {
        detail = body.error;
      }
    } catch {
      // swallow JSON parse errors; default detail above is fine
    }
    throw new Error(detail || 'CrisisIQ Assistant is unreachable right now.');
  }

  return (await response.json()) as ChatReply;
}
