/**
 * Tiny, dependency-free Markdown renderer scoped to the assistant's
 * output rules. Supports: links `[text](href)`, bold `**bold**`, inline
 * code `` `code` ``, bullet lines starting with `- `, and newline
 * paragraphs. HTML in inputs is escaped first so injection is safe.
 *
 * Returned strings are React-ready snippets that callers pass to
 * `dangerouslySetInnerHTML`. Internal links (starting with `/`) get a
 * `data-internal="1"` attribute so the bubble can intercept clicks and
 * call React Router instead of doing a full navigation.
 */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch] ?? ch);
}

function isSafeHref(href: string): boolean {
  if (!href) return false;
  if (href.startsWith('/')) return true;
  if (href.startsWith('mailto:')) return true;
  if (href.startsWith('tel:')) return true;
  if (href.startsWith('http://') || href.startsWith('https://')) return true;
  return false;
}

function renderInline(text: string): string {
  // Order matters: links first (they contain `[]` and `()`), then bold,
  // then inline code.
  let out = text;

  // Links: [text](href)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, href) => {
    if (!isSafeHref(href)) {
      return escapeHtml(`[${label}](${href})`);
    }
    const safeLabel = escapeHtml(label);
    const safeHref = escapeHtml(href);
    const internal = href.startsWith('/') ? ' data-internal="1"' : '';
    const target = href.startsWith('/')
      ? ''
      : ' target="_blank" rel="noopener noreferrer"';
    return `<a href="${safeHref}"${target}${internal} class="ciq-chat-link">${safeLabel}</a>`;
  });

  // Bold: **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Inline code: `code`
  out = out.replace(/`([^`]+)`/g, '<code class="ciq-chat-code">$1</code>');

  return out;
}

export function renderMarkdownToHtml(input: string): string {
  if (!input) return '';
  const escaped = escapeHtml(input.trim());

  const lines = escaped.split(/\r?\n/);
  const blocks: string[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const joined = paragraph.join(' ');
    blocks.push(`<p>${renderInline(joined)}</p>`);
    paragraph = [];
  };

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets
      .map((b) => `<li>${renderInline(b)}</li>`)
      .join('');
    blocks.push(`<ul class="ciq-chat-ul">${items}</ul>`);
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushBullets();
      flushParagraph();
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]);
      continue;
    }
    flushBullets();
    paragraph.push(line);
  }

  flushBullets();
  flushParagraph();

  return blocks.join('');
}
