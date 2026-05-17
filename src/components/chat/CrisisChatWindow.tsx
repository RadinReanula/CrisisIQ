import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/useAppContext';
import { useCrisisChat } from '../../hooks/useCrisisChat';
import type { ChatContextHint } from '../../types';
import { CrisisIqBrandMark } from '../brand/CrisisIqBrandMark';
import { ChatComposer } from './ChatComposer';
import { ChatMessageBubble } from './ChatMessageBubble';
import { QuickPromptChips } from './QuickPromptChips';

const DEFAULT_PROMPTS = [
  'How do I submit an emergency request?',
  'What can volunteers do?',
  'How is urgency decided?',
  'Show me active threats nearby',
];

const INITIAL_GREETING = [
  '**Hi**, I am the CrisisIQ Assistant.',
  '',
  'Ask me how to submit a request, how the live map works, what coordinators do, or for a live snapshot of active requests.',
  '',
  'For a life threatening emergency, call **119** first, then use [Submit a request](/submit).',
].join('\n');

interface CrisisChatWindowProps {
  onClose: () => void;
}

function inferRole(
  isCoordinator: boolean,
  hasUser: boolean,
): ChatContextHint['role'] {
  if (isCoordinator) return 'coordinator';
  if (hasUser) return 'volunteer';
  return 'citizen';
}

export function CrisisChatWindow({ onClose }: CrisisChatWindowProps) {
  const { user, isCoordinator, currentEvent } = useAppContext();
  const location = useLocation();

  const contextHint = useMemo<ChatContextHint>(
    () => ({
      page: location.pathname,
      eventId: currentEvent?.id,
      eventName: currentEvent?.name,
      role: inferRole(isCoordinator, Boolean(user)),
    }),
    [location.pathname, currentEvent?.id, currentEvent?.name, isCoordinator, user],
  );

  const { messages, status, error, suggestions, send, retry } =
    useCrisisChat(contextHint);

  const listRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Autoscroll on new message or status change.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, status]);

  // Esc closes the window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Focus the close button on mount so screen readers / keyboard users can
  // Tab into the rest of the dialog from a known anchor.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const handleHeaderKeyDown = useCallback(
    (_e: ReactKeyboardEvent<HTMLDivElement>) => {
      // Reserved for future focus-trap; kept as a no-op so we keep
      // existing accessible behaviour (browser tab order).
    },
    [],
  );

  const activePrompts =
    messages.length === 0 ? DEFAULT_PROMPTS : suggestions;
  const showChips = status !== 'sending' && activePrompts.length > 0;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="CrisisIQ Assistant"
      className="ciq-chat-window-in fixed inset-x-0 bottom-0 z-[60] flex h-[100dvh] flex-col overflow-hidden border-t border-white/10 bg-slate-950/95 text-white shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-24 sm:right-4 sm:h-[600px] sm:max-h-[80vh] sm:w-[380px] sm:rounded-2xl sm:border"
      onKeyDown={handleHeaderKeyDown}
    >
      {/* Decorative aurora orbs in the header. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 left-0 right-0 h-32 overflow-hidden"
      >
        <div className="ciq-chat-orb-a absolute -left-10 top-0 h-32 w-32 rounded-full bg-cyan-500/40 blur-3xl" />
        <div className="ciq-chat-orb-b absolute -right-8 top-6 h-28 w-28 rounded-full bg-red-500/40 blur-3xl" />
      </div>

      {/* Header. */}
      <header className="relative flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-slate-900/60">
          <CrisisIqBrandMark variant="nav" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">CrisisIQ Assistant</p>
          <p className="flex items-center gap-1.5 text-[11px] text-cyan-200/80">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            Live · powered by OpenAI
          </p>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close CrisisIQ Assistant"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 transition-colors hover:border-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>
      <div aria-hidden className="ciq-chat-scanline h-px w-full opacity-80" />

      {/* Message list. */}
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        className="ciq-chat-scroll relative flex-1 space-y-3 overflow-y-auto bg-slate-950/60 px-3 py-4"
      >
        {messages.length === 0 ? (
          <ChatMessageBubble
            message={{
              id: 'greeting',
              role: 'assistant',
              content: INITIAL_GREETING,
              createdAt: new Date().toISOString(),
            }}
          />
        ) : (
          messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
        )}

        {status === 'sending' && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-slate-900/70 px-3 py-2 text-cyan-200">
              <span className="ciq-chat-dot h-1.5 w-1.5 rounded-full bg-cyan-300" />
              <span className="ciq-chat-dot ciq-chat-dot-2 h-1.5 w-1.5 rounded-full bg-cyan-300" />
              <span className="ciq-chat-dot ciq-chat-dot-3 h-1.5 w-1.5 rounded-full bg-cyan-300" />
              <span className="ml-2 text-[11px] uppercase tracking-wide text-cyan-300/80">
                thinking
              </span>
            </div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-bl-sm border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
              <p className="font-semibold">Something went wrong.</p>
              <p className="mt-1 text-xs text-red-200/80">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-2 rounded-lg border border-red-400/50 px-2.5 py-1 text-xs text-red-100 transition-colors hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-400/60"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick-prompt chips. */}
      {showChips && (
        <QuickPromptChips
          prompts={activePrompts}
          disabled={false}
          onPick={send}
        />
      )}

      {/* Composer. */}
      <ChatComposer disabled={status === 'sending'} onSubmit={send} />

      {/* Disclaimer footer. */}
      <p className="border-t border-white/10 bg-slate-950/80 px-3 py-2 text-center text-[10px] leading-snug text-slate-400">
        Not a substitute for emergency services. In Sri Lanka, call{' '}
        <a href="tel:119" className="font-semibold text-red-300 hover:text-red-200">
          119
        </a>{' '}
        or{' '}
        <a href="tel:1990" className="font-semibold text-red-300 hover:text-red-200">
          1990
        </a>{' '}
        first.
      </p>
    </div>
  );
}
