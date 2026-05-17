import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

interface ChatComposerProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

const MAX_LENGTH = 1024;

export function ChatComposer({ disabled, onSubmit }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autoSize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    autoSize();
  }, [value, autoSize]);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue('');
  }, [value, disabled, onSubmit]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      submit();
    },
    [submit],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-white/10 bg-slate-900/80 p-3"
    >
      <label htmlFor="ciq-chat-input" className="sr-only">
        Message the CrisisIQ Assistant
      </label>
      <textarea
        id="ciq-chat-input"
        ref={textareaRef}
        rows={1}
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={
          disabled
            ? 'CrisisIQ Assistant is thinking…'
            : 'Ask about CrisisIQ, hotlines, or live requests…'
        }
        className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 transition-all duration-200 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12l14-7-3 14-4-6-7-1z"
          />
        </svg>
      </button>
    </form>
  );
}
