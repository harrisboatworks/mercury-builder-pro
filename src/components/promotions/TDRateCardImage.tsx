import { useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import { formatFinancingRate } from '@/lib/finance';


interface TDRateCardImageProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Self-healing <img> for the TD rate card.
 * - Appends a cache-busting `v` param so a fresh asset is fetched on each session
 *   (bucketed to the deployed BUILD_ID when available, otherwise the current day,
 *   so we don't defeat the CDN on every render).
 * - On load failure, retries up to 2 times with a new cache-buster, then renders
 *   an inline branded placeholder.
 */
export function TDRateCardImage({ src, alt, className }: TDRateCardImageProps) {
  const buildCacheBuster = () => {
    // Prefer a stable per-deploy token; fall back to per-day, then random on retry.
    const buildId =
      (typeof window !== 'undefined' && (window as any).__BUILD_ID__) ||
      new Date().toISOString().slice(0, 10);
    return String(buildId);
  };

  const withBuster = (url: string, token: string) => {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}v=${encodeURIComponent(token)}`;
  };

  const [token, setToken] = useState(() => buildCacheBuster());
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setToken(buildCacheBuster());
    setAttempt(0);
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-repower-mercury-red text-repower-cream rounded-md shadow-sm aspect-square p-8 text-center ${className ?? ''}`}
      >
        <Percent className="w-10 h-10 mb-3" strokeWidth={1.75} />
        <p className="font-display text-xl md:text-2xl font-bold leading-tight">
          Ready to Repower
        </p>
        <p className="font-sans text-sm md:text-base mt-2 opacity-90">
          As low as {formatFinancingRate()}
        </p>

        <p className="font-sans text-xs mt-1 opacity-75">
          Through Dec 31, 2026 (OAC)
        </p>
      </div>
    );
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open full rate card: ${alt}`}
      className="block cursor-zoom-in"
    >
      <img
        key={`${token}-${attempt}`}
        src={withBuster(src, attempt === 0 ? token : `${token}-r${attempt}-${Date.now()}`)}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        onError={() => {
          if (attempt < 2) {
            setAttempt((a) => a + 1);
          } else {
            setFailed(true);
          }
        }}
      />
    </a>
  );
}
