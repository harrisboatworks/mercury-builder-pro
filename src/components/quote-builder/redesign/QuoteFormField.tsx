import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface QuoteFormFieldProps {
  label?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  helper?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function QuoteFormField({ label, htmlFor, required, helper, error, children, className }: QuoteFormFieldProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-2 font-sans font-semibold text-[12px] uppercase tracking-[0.14em] text-repower-navy-900/70"
        >
          {label}
          {required && <span className="ml-1 text-repower-gold" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 font-sans text-[13px] text-repower-mercury-red">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 font-sans text-[13px] text-repower-navy-900/55">{helper}</p>
      ) : null}
    </div>
  );
}
