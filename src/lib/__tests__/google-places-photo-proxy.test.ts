import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildGooglePlacesMediaRequest,
  formatPlacePhotos,
  GOOGLE_PLACES_PHOTO_NAME,
  isGooglePlacesPhotoName,
  sanitizeCachedPlaceData,
} from '../../../supabase/functions/google-places/photos';

const source = (path: string) => readFileSync(path, 'utf8');
const SENTINEL = 'GOOGLE_API_KEY_SENTINEL_TEST_VALUE_NOT_A_REAL_KEY';
const FUNCTION_BASE = 'https://example.supabase.co/functions/v1/google-places';
const PHOTO_NAME = 'places/ChIJ123abc/photos/Abc_def-99';

describe('google-places photo proxy', () => {
  it('accepts only places/<id>/photos/<id> resource names', () => {
    expect(GOOGLE_PLACES_PHOTO_NAME.source).toBe(
      '^places\\/[A-Za-z0-9_-]{1,255}\\/photos\\/[A-Za-z0-9_-]{1,512}$',
    );
    expect(isGooglePlacesPhotoName(PHOTO_NAME)).toBe(true);
    expect(isGooglePlacesPhotoName('places/../photos/Abc')).toBe(false);
    expect(isGooglePlacesPhotoName('places/foo/photos/bar/extra')).toBe(false);
    expect(isGooglePlacesPhotoName('https://example.internal/photos/1')).toBe(false);
    expect(isGooglePlacesPhotoName('places/foo/photos/bar?x=1')).toBe(false);
  });

  it('never embeds the server key in the serialized response or cache payload', () => {
    const formattedResponse = {
      name: 'Harris Boat Works',
      photos: formatPlacePhotos([{ name: PHOTO_NAME }], FUNCTION_BASE),
    };
    const cacheObject = sanitizeCachedPlaceData({
      name: 'Harris Boat Works',
      photos: [{
        name: PHOTO_NAME,
        url: `https://places.googleapis.com/v1/${PHOTO_NAME}/media?maxHeightPx=800&key=${SENTINEL}`,
      }],
    }, FUNCTION_BASE);

    expect(JSON.stringify(formattedResponse)).not.toContain(SENTINEL);
    expect(JSON.stringify(cacheObject)).not.toContain(SENTINEL);
    expect(JSON.stringify(formattedResponse)).not.toMatch(/[?&]key=/);
    expect(JSON.stringify(cacheObject)).not.toMatch(/[?&]key=/);
    expect(JSON.stringify(buildGooglePlacesMediaRequest(PHOTO_NAME, SENTINEL).url))
      .not.toContain(SENTINEL);
    expect(cacheObject.photos[0].url).toBe(
      `${FUNCTION_BASE}?photo=${encodeURIComponent(PHOTO_NAME)}`,
    );
  });

  it('rewrites previously cached key-bearing photo URLs before they can be served', () => {
    const stale = sanitizeCachedPlaceData({
      photos: [{
        name: PHOTO_NAME,
        url: `https://places.googleapis.com/v1/${PHOTO_NAME}/media?maxHeightPx=800&key=${SENTINEL}`,
      }],
    }, FUNCTION_BASE);

    expect(JSON.stringify(stale)).not.toContain(SENTINEL);
    expect(stale.photos[0].url).toContain('?photo=');
    expect(stale.photos[0].url).not.toContain('places.googleapis.com');
  });

  it('pins the edge function to the proxy path and stale-cache rewrite', () => {
    const index = source('supabase/functions/google-places/index.ts');
    expect(index).not.toMatch(/media\?[^`\n]*key=\$\{/);
    expect(index).toContain('sanitizeCachedPlaceData(cached.data, functionBaseUrl)');
    expect(index).toContain('formatPlacePhotos(place.photos, functionBaseUrl)');
    expect(index).toContain('isGooglePlacesPhotoName(photoName)');
    expect(index).toContain("url.searchParams.get('photo')");
  });
});
