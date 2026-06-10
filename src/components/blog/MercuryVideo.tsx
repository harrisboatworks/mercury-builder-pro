import { useState } from 'react';

interface MercuryVideoProps {
  videoId: string;
  title: string;
  caption?: string;
}

/**
 * Lightweight YouTube facade. Renders the thumbnail as a button; only
 * loads the real iframe on click. Avoids the ~600KB YouTube embed cost
 * on initial page load (protects LCP / CWV on blog posts).
 */
export function MercuryVideo({ videoId, title, caption }: MercuryVideoProps) {
  const [loaded, setLoaded] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <figure className="my-6" data-mercury-video={videoId}>
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom: '56.25%' }}
      >
        {loaded ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            aria-label={`Play: ${title}`}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          >
            <img
              src={thumb}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-repower-mercury-red/90 shadow-lg transition-transform hover:scale-110"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm italic text-repower-navy-900/65">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default MercuryVideo;
