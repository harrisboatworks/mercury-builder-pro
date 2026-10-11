import { useCallback, useEffect, useRef } from 'react';

export interface ExplainerFigureProps {
  src: string;
  title: string;
  caption: string;
}

// Only source-controlled, same-origin explainer pages can be embedded.
export function isExplainerPath(src: string) {
  return /^\/explainers\/[a-z0-9-]+\.html$/.test(src);
}

export function ExplainerFigure({ src, title, caption }: ExplainerFigureProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resize = useCallback(() => {
    const iframe = iframeRef.current;
    const document = iframe?.contentDocument;
    if (!iframe || !document?.body) return;
    // Reset the viewport height so a narrower/taller layout can also shrink.
    iframe.style.height = '0px';
    iframe.style.height = `${document.documentElement.scrollHeight}px`;
  }, []);

  const observerRef = useRef<ResizeObserver | null>(null);

  // Content inside the figure can change height (e.g. a <details> opening),
  // so also follow the framed document's own size, not just window resizes.
  const handleLoad = useCallback(() => {
    resize();
    observerRef.current?.disconnect();
    const body = iframeRef.current?.contentDocument?.body;
    if (body && typeof ResizeObserver !== 'undefined') {
      observerRef.current = new ResizeObserver(() => resize());
      observerRef.current.observe(body);
    }
  }, [resize]);

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      observerRef.current?.disconnect();
    };
  }, [resize]);

  if (!isExplainerPath(src)) return null;

  return (
    <figure className="not-prose mx-auto my-8 w-full max-w-[760px]">
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        loading="lazy"
        scrolling="no"
        onLoad={handleLoad}
        className="block h-[1100px] w-full border-0 sm:h-[900px]"
      />
      <figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {caption}
        <a href={src} target="_blank" rel="noopener noreferrer" className="mt-1 block w-fit text-primary underline underline-offset-4">
          Open full screen
        </a>
      </figcaption>
    </figure>
  );
}