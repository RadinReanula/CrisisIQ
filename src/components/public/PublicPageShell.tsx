import type { ReactNode } from 'react';
import { EmergencyBar } from './EmergencyBar';

/** Top padding matches fixed emergency bar height. */
export const PUBLIC_PAGE_TOP = 'pt-14';

interface PublicPageShellProps {
  children: ReactNode;
  className?: string;
}

export function PublicPageShell({ children, className = '' }: PublicPageShellProps) {
  return (
    <>
      <EmergencyBar />
      <div className={`${PUBLIC_PAGE_TOP} ${className}`}>{children}</div>
    </>
  );
}
