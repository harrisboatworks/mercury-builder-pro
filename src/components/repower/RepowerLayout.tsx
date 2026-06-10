import { type ReactNode } from 'react';
import { RepowerHeader } from './RepowerHeader';

/**
 * Wraps /repower content with the dedicated dark/transparent RepowerHeader.
 */
export function RepowerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050E1C]">
      <RepowerHeader />
      {children}
    </div>
  );
}
