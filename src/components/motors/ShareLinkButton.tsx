import React, { useState } from 'react';
import { Link2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface ShareLinkButtonProps {
  modelKey?: string | null;
  modelFallback?: string;
  className?: string;
  size?: 'sm' | 'md';
}

function buildSlug(modelKey: string): string {
  return modelKey
    .toLowerCase()
    .replace(/[_\s]+/g, '-')       // underscores & spaces → dashes
    .replace(/[^a-z0-9-]/g, '')    // strip non-alphanumeric
    .replace(/-+/g, '-')           // collapse multiple dashes
    .replace(/^-|-$/g, '');        // trim leading/trailing dashes
}

export function ShareLinkButton({ modelKey, modelFallback, className, size = 'sm' }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const source = modelKey || modelFallback;
  if (!source) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const slug = buildSlug(source);
    const url = `${window.location.origin}/motors/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
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
                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-gray-100 border border-gray-200 hover:shadow-md hover:shadow-primary/10 hover:border-primary/30',
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
