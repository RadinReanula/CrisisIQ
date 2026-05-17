import { useCallback, useEffect, useRef, useState } from 'react';
import { sendChatMessage } from '../services/chat';
import type { ChatContextHint, ChatMessage, ChatReply } from '../types';

export type ChatStatus = 'idle' | 'sending' | 'error';

const HISTORY_CAP = 8;

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: makeId(),
    role,
    content,
    createdAt: nowIso(),
  };
}

export interface UseCrisisChatResult {
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | null;
  suggestions: string[];
  send: (content: string) => void;
  retry: () => void;
  reset: () => void;
}

/**
 * Stateful hook backing the CrisisIQ Assistant. Owns message history,
 * in-flight status, error, and the latest server suggestions. Truncates
 * history to `HISTORY_CAP` turns before sending (the server also caps).
 */
export function useCrisisChat(
  contextHint: ChatContextHint,
): UseCrisisChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const lastUserContentRef = useRef<string>('');

  // Capture the latest hint without re-creating `send` on every render.
  const hintRef = useRef<ChatContextHint>(contextHint);
  useEffect(() => {
    hintRef.current = contextHint;
  }, [contextHint]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const dispatch = useCallback(
    async (history: ChatMessage[]) => {
      // Abort any in-flight call first.
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('sending');
      setError(null);

      try {
        const trimmed = history.slice(-HISTORY_CAP);
        const reply: ChatReply = await sendChatMessage(
          trimmed,
          hintRef.current,
          controller.signal,
        );

        if (!isMountedRef.current) return;
        if (abortRef.current !== controller) return;

        setMessages((prev) => [
          ...prev,
          makeMessage('assistant', reply.reply),
        ]);
        setSuggestions(
          Array.isArray(reply.suggestions) ? reply.suggestions : [],
        );
        setStatus('idle');
      } catch (err) {
        if (!isMountedRef.current) return;
        if (controller.signal.aborted) return;
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'CrisisIQ Assistant is unreachable right now.';
        setError(msg);
        setStatus('error');
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [],
  );

  const send = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      lastUserContentRef.current = trimmed;
      const userTurn = makeMessage('user', trimmed);
      const next = [...messages, userTurn];
      setMessages(next);
      void dispatch(next);
    },
    [messages, dispatch],
  );

  const retry = useCallback(() => {
    if (status === 'sending') return;
    // If the last entry is a user turn (assistant never replied), resend
    // history as-is. Otherwise resend the cached last user content.
    const last = messages[messages.length - 1];
    if (last && last.role === 'user') {
      void dispatch(messages);
      return;
    }
    if (lastUserContentRef.current) {
      send(lastUserContentRef.current);
    }
  }, [messages, status, dispatch, send]);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setSuggestions([]);
    setError(null);
    setStatus('idle');
    lastUserContentRef.current = '';
  }, []);

  return { messages, status, error, suggestions, send, retry, reset };
}
