interface QuickPromptChipsProps {
  prompts: string[];
  disabled: boolean;
  onPick: (text: string) => void;
}

export function QuickPromptChips({
  prompts,
  disabled,
  onPick,
}: QuickPromptChipsProps) {
  if (prompts.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 px-3 pb-2">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(prompt)}
          className="rounded-full border border-cyan-400/30 bg-cyan-500/5 px-3 py-1 text-xs text-cyan-200 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/15 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
