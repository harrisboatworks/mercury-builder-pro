const PLACE_QUERY = 'Harris+Boat+Works,Gores+Landing,ON';

export function getGoogleMapsEmbedKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

export function buildGoogleMapEmbedUrl(
  apiKey: string,
  center?: { latitude: number; longitude: number },
): string {
  return center
    ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center.latitude},${center.longitude}&zoom=14&maptype=roadmap`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${PLACE_QUERY}&zoom=14`;
}

const FALLBACK_SPAN_DEG = 0.02;

/**
 * Keyless OpenStreetMap embed used when the Google Maps Embed key is absent
 * (local development, or any environment missing VITE_GOOGLE_MAPS_EMBED_KEY).
 * Renders a real map with a marker instead of a bare text notice.
 */
export function buildOpenStreetMapEmbedUrl(center: {
  latitude: number;
  longitude: number;
}): string {
  const minLon = (center.longitude - FALLBACK_SPAN_DEG).toFixed(6);
  const minLat = (center.latitude - FALLBACK_SPAN_DEG / 2).toFixed(6);
  const maxLon = (center.longitude + FALLBACK_SPAN_DEG).toFixed(6);
  const maxLat = (center.latitude + FALLBACK_SPAN_DEG / 2).toFixed(6);
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${center.latitude},${center.longitude}`;
}

export function buildGoogleMapsFallbackHref(center?: {
  latitude: number;
  longitude: number;
}): string {
  if (center) {
    return `https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${PLACE_QUERY}`;
}
