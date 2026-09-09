import { COMPANY_INFO } from '@/lib/companyInfo';
import {
  buildGoogleMapEmbedUrl,
  buildGoogleMapsFallbackHref,
  getGoogleMapsEmbedKey,
} from '@/lib/google-maps-embed';

interface GoogleMapEmbedProps {
  className?: string;
  height?: string;
  center?: {
    latitude: number;
    longitude: number;
  };
}

export function GoogleMapEmbed({ className = '', height = '100%', center }: GoogleMapEmbedProps) {
  const apiKey = getGoogleMapsEmbedKey();

  return (
    <div className={`relative overflow-hidden rounded-xl bg-muted ${className}`} style={{ height }}>
      {apiKey ? (
        <iframe
          src={buildGoogleMapEmbedUrl(apiKey, center)}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Harris Boat Works Location"
          className="absolute inset-0"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 font-sans text-sm text-foreground">
          <p className="font-medium">Map preview is unavailable.</p>
          <address className="not-italic text-muted-foreground">
            {COMPANY_INFO.name}
            <br />
            {COMPANY_INFO.address.street}
            <br />
            {COMPANY_INFO.address.city}, {COMPANY_INFO.address.province} {COMPANY_INFO.address.postal}
          </address>
          <a
            href={buildGoogleMapsFallbackHref(center)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-2"
          >
            View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
