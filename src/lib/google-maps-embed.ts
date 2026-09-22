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

export function buildGoogleMapsFallbackHref(center?: {
  latitude: number;
  longitude: number;
}): string {
  if (center) {
    return `https://www.google.com/maps/search/?api=1&query=${center.latitude},${center.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${PLACE_QUERY}`;
}
