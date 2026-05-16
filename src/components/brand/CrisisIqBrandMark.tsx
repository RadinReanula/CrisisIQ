/**
 * Public app mark from `public/new_image_suggested/image03.png`
 * (source of truth: project `new_image_suggested/` — copied into `public/` for Vite static URLs).
 */
export function crisisIqMarkUrl(): string {
  const base = import.meta.env.BASE_URL;
  const path = 'new_image_suggested/image03.png';
  return base.endsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

interface CrisisIqBrandMarkProps {
  /** Hero home header vs compact coordinator nav. */
  variant?: 'hero' | 'nav';
  className?: string;
}

const VARIANT_CLASS: Record<NonNullable<CrisisIqBrandMarkProps['variant']>, string> = {
  hero: 'mx-auto h-16 w-16 object-contain transition-all duration-300',
  nav: 'h-7 w-7 shrink-0 object-contain',
};

export function CrisisIqBrandMark({ variant = 'hero', className = '' }: CrisisIqBrandMarkProps) {
  const sizeClass = VARIANT_CLASS[variant];
  return (
    <img
      src={crisisIqMarkUrl()}
      width={variant === 'hero' ? 64 : 28}
      height={variant === 'hero' ? 64 : 28}
      alt=""
      decoding="async"
      className={`${sizeClass} ${className}`.trim()}
      aria-hidden
    />
  );
}
