export const GOOGLE_PLACES_PHOTO_NAME =
  /^places\/[A-Za-z0-9_-]{1,255}\/photos\/[A-Za-z0-9_-]{1,512}$/;

export function isGooglePlacesPhotoName(name: unknown): name is string {
  return typeof name === "string" && GOOGLE_PLACES_PHOTO_NAME.test(name);
}

export function googlePlacesFunctionUrl(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/google-places`;
}

export function buildPhotoProxyUrl(functionBaseUrl: string, photoName: string): string {
  return `${functionBaseUrl}?photo=${encodeURIComponent(photoName)}`;
}

export function buildGooglePlacesMediaRequest(
  photoName: string,
  apiKey: string,
): { url: string; headers: { "X-Goog-Api-Key": string } } {
  return {
    url: `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=800`,
    headers: { "X-Goog-Api-Key": apiKey },
  };
}

export type PlacePhoto = {
  name: string;
  url: string;
};

export function formatPlacePhotos(
  photos: Array<{ name?: string }> | null | undefined,
  functionBaseUrl: string,
): PlacePhoto[] {
  if (!Array.isArray(photos)) return [];
  const out: PlacePhoto[] = [];
  for (const photo of photos.slice(0, 5)) {
    if (!isGooglePlacesPhotoName(photo?.name)) continue;
    out.push({
      name: photo.name,
      url: buildPhotoProxyUrl(functionBaseUrl, photo.name),
    });
  }
  return out;
}

export function sanitizeCachedPlaceData<T>(data: T, functionBaseUrl: string): T {
  if (!data || typeof data !== "object") return data;
  const record = data as { photos?: unknown };
  if (!Array.isArray(record.photos)) return data;
  return {
    ...data,
    photos: formatPlacePhotos(record.photos as Array<{ name?: string }>, functionBaseUrl),
  };
}
