

# Google Places API Cost Optimization Plan

## Summary of the Problem

Your January bill shows **$21.34 for 1,891 API requests** - that's approximately **63 requests per day** for a single business location. This is excessive because:

1. **No server-side caching** - Every visitor triggers a fresh API call
2. **Expensive data tier** - The field mask includes `reviews` and `currentOpeningHours` (Atmosphere tier)
3. **Multiple components calling the same hook** - Footer (every page), About page, Reviews carousel, Rating badge, Photo gallery all trigger the same data fetch
4. **Client-side caching only helps per-user** - React Query's 24-hour staleTime only helps returning users in the same browser session

## Current Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  SiteFooter ──┐                                                 │
│  About Page ──┼──▶ useGooglePlaceData() ──▶ React Query Cache   │
│  Reviews    ──┤         (24hr staleTime)     (per-user only)    │
│  RatingBadge ─┤                                                 │
│  PhotoGallery─┘                                                 │
└────────────────────────────────────┬────────────────────────────┘
                                     │ Every unique user = new API call
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: google-places                        │
├─────────────────────────────────────────────────────────────────┤
│  • Searches "Harris Boat Works Gores Landing Ontario"           │
│  • Uses Text Search (Enterprise) + Atmosphere fields            │
│  • NO caching - always calls Google                             │
│  • Returns: rating, reviews, hours, photos, location            │
└────────────────────────────────────┬────────────────────────────┘
                                     │ $0.011 per request
                                     ▼
                          Google Places API (New)
```

## Where the API is Called

| Component | Location | When Called | Data Used |
|-----------|----------|-------------|-----------|
| `SiteFooter` | Every page | Every page load | Opening hours |
| `About` page | `/about` | Page load | Hours, reviews, photos, rating |
| `GoogleReviewsCarousel` | About page | Page load | Reviews, rating |
| `GoogleRatingBadge` | About page | Page load | Rating, review count |
| `GooglePhotoGallery` | About page | Page load | Photos |
| `OpeningHoursDisplay` | Footer, About | Always | Opening hours |

## Cost Breakdown

- **Text Search API**: $0.017 per request
- **Atmosphere data** (reviews, hours): Additional $0.004 per request
- **Estimated cost**: ~$0.011 per call (with FieldMask discounts)
- **Current monthly**: 1,891 calls x $0.011 = **$21**

## Optimization Strategy

### 1. Add Database Cache Table
Create a `google_places_cache` table to store the API response with a 24-hour TTL. This makes the cache **shared across all users**.

### 2. Update Edge Function with Server-Side Caching
Modify the `google-places` edge function to:
- Check the database cache first
- Only call Google API if cache is expired or missing
- Store fresh results in the cache
- Return cached data with `cached: true` flag for logging

### 3. Update Frontend Hook for Manual Refresh
Add an optional `forceRefresh` parameter to allow admin users to manually refresh the cache if hours change unexpectedly.

### 4. Consider Removing Real-Time "Open Now" Status
The "Open Now" badge requires checking `currentOpeningHours.openNow` which changes throughout the day. Options:
- Calculate "Open Now" client-side using cached weekday hours
- Accept slightly stale "Open Now" status (24-hour cache means it could be wrong near open/close times)

## Proposed Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  All components ──▶ useGooglePlaceData() ──▶ React Query Cache  │
│                                              (24hr staleTime)    │
└────────────────────────────────────┬────────────────────────────┘
                                     │ Calls edge function
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: google-places                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Check google_places_cache table                             │
│     └─ If valid cache exists → return cached data               │
│  2. If expired/missing:                                         │
│     └─ Call Google Places API                                   │
│     └─ Store response in cache table                            │
│     └─ Return fresh data                                        │
└────────────────────────────────────┬────────────────────────────┘
                                     │ ~1 call per day (not per user!)
                                     ▼
                          Google Places API (New)
```

## Expected Cost Reduction

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| **API calls/day** | ~63 | ~1-2 | **97%** |
| **API calls/month** | ~1,891 | ~30-60 | **97%** |
| **Monthly cost** | $21.34 | ~$0.50-$1 | **95%+** |

## Implementation Details

### Step 1: Create Cache Table

```sql
CREATE TABLE public.google_places_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_query TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_google_places_cache_query ON google_places_cache(place_query);
CREATE INDEX idx_google_places_cache_expires ON google_places_cache(expires_at);
```

### Step 2: Update Edge Function

The edge function will:
1. Check the cache table for a valid entry (not expired)
2. If cache hit: increment hit_count and return cached data
3. If cache miss: call Google API, store result, return fresh data

```typescript
// Pseudocode for the updated edge function
async function handleRequest(req) {
  const cacheKey = "harris-boat-works-gores-landing";
  
  // Check cache
  const { data: cached } = await supabase
    .from('google_places_cache')
    .select('*')
    .eq('place_query', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (cached) {
    // Update hit count
    await supabase
      .from('google_places_cache')
      .update({ hit_count: cached.hit_count + 1 })
      .eq('id', cached.id);
    
    return { ...cached.data, cached: true };
  }
  
  // Cache miss - fetch from Google
  const freshData = await fetchFromGoogle();
  
  // Upsert to cache
  await supabase
    .from('google_places_cache')
    .upsert({
      place_query: cacheKey,
      data: freshData,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      hit_count: 0
    }, { onConflict: 'place_query' });
  
  return { ...freshData, cached: false };
}
```

### Step 3: Client-Side "Open Now" Calculation

Instead of relying on the API's `currentOpeningHours.openNow`, calculate it client-side from the cached weekday hours. This ensures the "Open/Closed" badge is always accurate even with cached data.

```typescript
function isCurrentlyOpen(weekdayText: string[]): boolean {
  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sunday, 1=Monday, etc.
  
  // weekdayText is ordered Monday-Sunday
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const todayHours = weekdayText[adjustedIndex];
  
  if (todayHours?.toLowerCase().includes('closed')) return false;
  
  // Parse hours like "Monday: 8:00 AM – 5:00 PM"
  const match = todayHours?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return false;
  
  const [, openH, openM, openP, closeH, closeM, closeP] = match;
  // ... time comparison logic
}
```

## Files to Modify

| File | Changes |
|------|---------|
| **New Migration** | Create `google_places_cache` table |
| `supabase/functions/google-places/index.ts` | Add database caching logic |
| `src/hooks/useGooglePlaceData.ts` | Add `isCurrentlyOpen()` client calculation |
| `src/components/business/OpeningHoursDisplay.tsx` | Use client-side open/closed calculation |

## Bonus Optimizations (Optional)

1. **Reduce FieldMask** - If you only need hours and rating (not reviews/photos), use a smaller field mask for even lower costs
2. **Background refresh** - Add a scheduled function to refresh the cache once per day during off-hours
3. **Admin refresh button** - Add a button in admin panel to force-refresh the cache if hours change

