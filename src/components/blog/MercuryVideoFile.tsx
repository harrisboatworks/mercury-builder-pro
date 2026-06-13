import { useState } from 'react';
import { Play } from 'lucide-react';

interface MercuryVideoFileProps {
  src: string;
  title: string;
  caption?: string;
  poster?: string;
}

/**
 * Self-hosted MP4 facade. Renders a poster/play button until clicked,
 * then mounts a native <video> with preload="metadata". Keeps LCP clean
 * for large CDN-hosted videos.
 */
export function MercuryVideoFile({ src, title, caption, poster }: MercuryVideoFileProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="my-6">
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom: '56.25%' }}
      >
        {loaded ? (
          <video
            className="absolute inset-0 h-full w-full"
            src={src}
            poster={poster}
            title={title}
            controls
            autoPlay
            playsInline
            preload="metadata"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            aria-label={`Play: ${title}`}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0"
          >
            {poster ? (
              <img
                src={poster}
                alt={title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 bg-gradient-to-br from-repower-navy-900 to-black" />
            )}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-repower-mercury-red/90 shadow-lg transition-transform hover:scale-110"
            >
              <Play className="h-7 w-7 text-white" fill="currentColor" />
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

export default MercuryVideoFile;
