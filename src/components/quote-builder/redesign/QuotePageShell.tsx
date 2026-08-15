import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface QuotePageShellProps {
  eyebrow?: string;
  title?: string;
  subhead?: string;
  children: ReactNode;
  className?: string;
}

export function QuotePageShell({ eyebrow, title, subhead, children, className }: QuotePageShellProps) {
  return (
    <div className="bg-repower-paper min-h-[60vh]">
      <div className={cn('mx-auto w-full max-w-[880px] px-6 py-12 md:px-8 md:py-16 min-[960px]:px-0', className)}>
        {(eyebrow || title) && (
          <header className="mb-7">
            {eyebrow && (
              <div className="flex items-center gap-3 mb-4">
                <span className="block h-px w-8 bg-repower-mercury-red/70" aria-hidden />
                <span className="font-sans text-[13px] md:text-sm font-semibold uppercase tracking-[0.24em] text-repower-mercury-red">
                  {eyebrow}
                </span>
              </div>
            )}
            {title && (
              <h1 className="font-display font-bold text-repower-navy-900 leading-[1.05] tracking-[-0.025em]" style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
                {title}
              </h1>
            )}
            {subhead && (
              <p className="mt-4 font-sans text-[17px] text-repower-navy-900/65 leading-relaxed">
                {subhead}
              </p>
            )}
            <div className="mt-7 h-px w-full bg-repower-navy-900/10" aria-hidden />
          </header>
        )}
        <div className="flex flex-col gap-7">{children}</div>
      </div>
    </div>
  );
}
