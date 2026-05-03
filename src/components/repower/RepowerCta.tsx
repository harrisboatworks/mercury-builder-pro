import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Unified CTA button used across the Repower landing page.
 * Variants:
 *  - primary: Mercury red, used for the main action on each section
 *  - secondary: cream-outlined ghost on dark backgrounds
 *  - outline: gold-outlined alternate (use sparingly)
 * Sizes: sm | md | lg
 *
 * Renders a <Link> when `to` is provided, an <a> when `href` is provided,
 * or a <button> otherwise. Always preserves the same typography and hover
 * states across the page.
 */
export const repowerCtaVariants = cva(
  'group inline-flex items-center justify-center gap-2 rounded font-sans font-semibold uppercase tracking-wider transition-all duration-300 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[#C8102E] text-[#F5F1EA] hover:bg-[#9A0C24] shadow-lg shadow-[#C8102E]/30 hover:-translate-y-0.5',
        secondary:
          'border border-[#F5F1EA]/30 text-[#F5F1EA] hover:bg-[#F5F1EA]/5 hover:border-[#F5F1EA]/60',
        outline:
          'border border-[#F5F1EA]/30 text-[#F5F1EA] hover:border-[#C9A24A] hover:text-[#C9A24A]',
      },
      size: {
        sm: 'px-4 py-2.5 text-[11px]',
        md: 'px-6 py-3 text-xs',
        lg: 'px-8 py-4 text-sm',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'lg', block: false },
  }
);

type CtaVariantProps = VariantProps<typeof repowerCtaVariants>;

type AsButton = { as?: 'button' } & ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined; href?: undefined };
type AsAnchor = { as?: 'a'; href: string } & AnchorHTMLAttributes<HTMLAnchorElement> & { to?: undefined };
type AsLink = { as?: 'link'; to: LinkProps['to'] } & Omit<LinkProps, 'to' | 'children'>;

export type RepowerCtaProps = CtaVariantProps & { children: ReactNode; className?: string } & (AsButton | AsAnchor | AsLink);

export const RepowerCta = forwardRef<HTMLElement, RepowerCtaProps>((props, ref) => {
  const { variant, size, block, className, children, ...rest } = props as RepowerCtaProps & { to?: any; href?: string };
  const classes = cn(repowerCtaVariants({ variant, size, block }), className);

  if ('to' in rest && rest.to !== undefined) {
    const { to, ...linkRest } = rest as AsLink;
    return (
      <Link ref={ref as any} to={to} className={classes} {...(linkRest as any)}>
        {children}
      </Link>
    );
  }

  if ('href' in rest && rest.href !== undefined) {
    return (
      <a ref={ref as any} className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button ref={ref as any} className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
});
RepowerCta.displayName = 'RepowerCta';
