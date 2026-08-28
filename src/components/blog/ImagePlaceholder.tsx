import { ExpandableImage } from '@/components/ui/expandable-image';

export type PlaceholderType = 'photo' | 'infographic' | 'diagram' | 'screenshot';
export type PlaceholderAspect = '16:9' | '4:5' | '9:16' | '1:1' | 'letter-portrait';

export interface ImagePlaceholderProps {
  slug: string;
  type: PlaceholderType;
  aspect: PlaceholderAspect;
  description: string;
  prompt?: string;
  image?: string;
  caption?: string;
}

const aspectStyle: Record<PlaceholderAspect, React.CSSProperties> = {
  '16:9': { aspectRatio: '16 / 9' },
  '4:5': { aspectRatio: '4 / 5' },
  '9:16': { aspectRatio: '9 / 16' },
  '1:1': { aspectRatio: '1 / 1' },
  'letter-portrait': { aspectRatio: '8.5 / 11' },
};

const typeLabel: Record<PlaceholderType, string> = {
  photo: 'PHOTO PLACEHOLDER',
  infographic: 'INFOGRAPHIC PLACEHOLDER',
  diagram: 'DIAGRAM PLACEHOLDER',
  screenshot: 'SCREENSHOT PLACEHOLDER',
};

export function ImagePlaceholder({
  slug,
  type,
  aspect,
  description,
  image,
  caption,
}: ImagePlaceholderProps) {
  if (image) {
    return (
      <figure className="my-6">
        <ExpandableImage
          src={image}
          alt={description}
          caption={caption}
          className="w-full rounded-lg"
          containerClassName=""
        />
      </figure>
    );
  }

  const stripeBg =
    'repeating-linear-gradient(135deg, hsl(220 12% 92%) 0 12px, hsl(220 12% 88%) 12px 24px)';

  return (
    <figure
      role="img"
      aria-label={`Placeholder: ${description}`}
      className="my-6 w-full overflow-hidden rounded-lg border border-dashed border-[hsl(220_12%_60%)]"
      style={{ background: stripeBg, ...aspectStyle[aspect] }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
        <span
          className="mb-3 inline-block rounded-full bg-[hsl(45_85%_55%)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(220_25%_10%)] shadow-sm"
          aria-hidden="true"
        >
          Coming soon
        </span>
        <p className="font-display text-[13px] md:text-[15px] font-bold uppercase tracking-[0.18em] text-[hsl(220_20%_25%)]">
          [{typeLabel[type]}]
        </p>
        <p className="mt-2 font-mono text-[11px] md:text-[12px] text-[hsl(220_15%_35%)] break-all">
          {slug}
        </p>
        <p className="mt-2 max-w-[44ch] text-[12px] md:text-[13px] leading-snug text-[hsl(220_15%_30%)]">
          {description}
        </p>
      </div>
    </figure>
  );
}
