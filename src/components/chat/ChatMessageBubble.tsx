import { useCallback, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChatMessage } from '../../types';
import { renderMarkdownToHtml } from './markdown';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const navigate = useNavigate();
  const isUser = message.role === 'user';

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a[data-internal="1"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      e.preventDefault();
      const href = anchor.getAttribute('href');
      if (href) {
        navigate(href);
      }
    },
    [navigate],
  );

  if (isUser) {
    return (
      <div className="ciq-chat-bubble-in flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm border border-cyan-400/40 bg-cyan-500/15 px-3 py-2 text-sm text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
          {message.content}
        </div>
      </div>
    );
  }

  const html = renderMarkdownToHtml(message.content);

  return (
    <div className="ciq-chat-bubble-in flex justify-start">
      <div className="relative max-w-[88%] rounded-2xl rounded-bl-sm border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-100">
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-cyan-400 via-cyan-300 to-red-500/60"
        />
        <div
          className="ciq-chat-md pl-2 leading-relaxed"
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
