import React, { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { motorShareUrl, type MotorSlugInput } from '@/lib/motorSlug';

interface ShareLinkButtonProps {
  // Preferred: pass the full motor row so we build the canonical
  // /motors/{slug} URL that matches public-motors-api and MotorPage.
  motor?: MotorSlugInput | null;
  // Legacy fallbacks — kept for callers that only have modelKey/model.
  // These produce a non-canonical slug that may 404; prefer `motor`.
  modelKey?: string | null;
  modelFallback?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function ShareLinkButton({ motor, modelKey, modelFallback, className, size = 'sm' }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const hasMotor = !!(motor && motor.horsepower);
  if (!hasMotor && !modelKey && !modelFallback) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let url: string;
    if (hasMotor) {
      url = motorShareUrl(motor!);
    } else {
      // Legacy path — best-effort, not guaranteed to match canonical route.
      const source = (modelKey || modelFallback)!;
      const slug = source
        .toLowerCase()
        .replace(/[_\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      url = `https://www.mercuryrepower.ca/motors/${slug}`;
    }

    const showSuccess = () => {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    };

    // Try modern Clipboard API first (requires secure context + focused document)
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        showSuccess();
        return;
      }
    } catch (err) {
      console.warn('[ShareLinkButton] clipboard API failed, falling back:', err);
    }

    // Fallback: hidden textarea + execCommand (works in iframes, non-secure contexts)
    try {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, url.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (ok) {
        showSuccess();
        return;
      }
      throw new Error('execCommand returned false');
    } catch (err) {
      console.error('[ShareLinkButton] copy fallback failed:', err, { url });
      // Last resort: prompt the user so they can copy manually
      try {
        window.prompt('Copy this link:', url);
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };


  const iconSize = size === 'sm' ? 16 : 20;
  const buttonSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className={cn(
              buttonSize,
              'rounded-full flex items-center justify-center transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
              copied
                ? 'bg-green-500 text-white shadow-md'
                : 'bg-repower-cream/95 backdrop-blur-sm text-repower-navy-900 hover:bg-repower-paper border border-repower-navy-900/15 hover:shadow-md hover:shadow-primary/10 hover:border-primary/30',
              className
            )}
            aria-label="Copy share link"
          >
            {copied ? <Check size={iconSize} /> : <Link2 size={iconSize} />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {copied ? 'Copied!' : 'Copy share link'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
