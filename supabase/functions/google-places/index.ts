import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  buildGooglePlacesMediaRequest,
  formatPlacePhotos,
  googlePlacesFunctionUrl,
  isGooglePlacesPhotoName,
  sanitizeCachedPlaceData,
} from "./photos.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CACHE_KEY = 'harris-boat-works-gores-landing';
const CACHE_TTL_HOURS = 24;

type PlaceLocalizedText = {
  text?: string;
};

type GooglePlaceReview = {
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
  rating?: number;
  text?: PlaceLocalizedText;
  originalText?: PlaceLocalizedText;
  publishTime?: string;
  relativePublishTimeDescription?: string;
};

async function proxyPlacePhoto(req: Request, photoName: string): Promise<Response> {
  if (!isGooglePlacesPhotoName(photoName)) {
    return new Response('Invalid photo name', {
      status: 400,
      headers: corsHeaders,
    });
  }

  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const allowed = await checkRateLimit(req, {
    action: 'google_places_photo',
    maxAttempts: 60,
    windowMinutes: 10,
  });
  if (!allowed) return rateLimitedResponse(corsHeaders, 60);

  const media = buildGooglePlacesMediaRequest(photoName, apiKey);
  const upstream = await fetch(media.url, { headers: media.headers });
  const contentType = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !/^image\/(jpeg|jpg|png|webp|gif)(;.*)?$/i.test(contentType)) {
    return new Response('Photo unavailable', {
      status: 502,
      headers: corsHeaders,
    });
  }

  return new Response(upstream.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const requestedPhoto = url.searchParams.get('photo');
    if (requestedPhoto !== null) {
      return await proxyPlacePhoto(req, requestedPhoto);
    }

    const allowed = await checkRateLimit(req, {
      action: 'google_places',
      maxAttempts: 60,
      windowMinutes: 10,
    });
    if (!allowed) return rateLimitedResponse(corsHeaders, 60);

    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const functionBaseUrl = googlePlacesFunctionUrl(supabaseUrl);

    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const searchQuery = url.searchParams.get('query') || 'Harris Boat Works Gores Landing Ontario';

    // Step 1: Check cache first (unless force refresh)
    if (!forceRefresh) {
      console.log('[google-places] Checking cache for:', CACHE_KEY);
      
      const { data: cached, error: cacheError } = await supabase
        .from('google_places_cache')
        .select('*')
        .eq('place_query', CACHE_KEY)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached && !cacheError) {
        console.log('[google-places] Cache HIT! Hit count:', cached.hit_count);
        
        // Update hit count asynchronously (don't await)
        supabase
          .from('google_places_cache')
          .update({ hit_count: (cached.hit_count || 0) + 1 })
          .eq('id', cached.id)
          .then(() => console.log('[google-places] Hit count updated'));

        return new Response(JSON.stringify({ 
          ...sanitizeCachedPlaceData(cached.data, functionBaseUrl), 
          cached: true,
          cachedAt: cached.cached_at,
          expiresAt: cached.expires_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('[google-places] Cache MISS or expired');
    } else {
      console.log('[google-places] Force refresh requested');
    }

    const upstreamAllowed = await checkRateLimit(req, {
      action: 'google_places_upstream',
      maxAttempts: 10,
      windowMinutes: 60,
    });
    if (!upstreamAllowed) return rateLimitedResponse(corsHeaders, 300);

    // Step 2: Fetch from Google Places API
    console.log('[google-places] Searching for place:', searchQuery);
    
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`;
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.reviews,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.photos,places.location'
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        maxResultCount: 1
      })
    });

    const searchData = await searchResponse.json();
    
    if (searchData.error) {
      console.error('[google-places] Search API error:', searchData.error);
      throw new Error(`Google Places API error: ${searchData.error?.message || searchData.error?.status}`);
    }

    if (!searchData.places || searchData.places.length === 0) {
      console.log('[google-places] No places found');
      return new Response(JSON.stringify({ 
        error: 'Place not found',
        reviews: [] 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const place = searchData.places[0];
    console.log('[google-places] Found place:', place.displayName?.text);

    // Format the response
    const formattedResponse = {
      name: place.displayName?.text,
      rating: place.rating,
      totalReviews: place.userRatingCount,
      reviews: place.reviews?.map((review: GooglePlaceReview) => ({
        authorName: review.authorAttribution?.displayName || 'Customer',
        authorPhoto: review.authorAttribution?.photoUri,
        rating: review.rating,
        text: review.text?.text || review.originalText?.text || '',
        time: review.publishTime ? new Date(review.publishTime).getTime() / 1000 : Date.now() / 1000,
        relativeTime: review.relativePublishTimeDescription || 'Recently',
      })) || [],
      openingHours: place.currentOpeningHours ? {
        isOpen: place.currentOpeningHours.openNow,
        weekdayText: place.currentOpeningHours.weekdayDescriptions,
      } : null,
      phone: place.nationalPhoneNumber,
      address: place.formattedAddress,
      website: place.websiteUri,
      location: place.location,
      photos: formatPlacePhotos(place.photos, functionBaseUrl),
    };

    console.log('[google-places] Returning', formattedResponse.reviews?.length, 'reviews');

    // Step 3: Store in cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    
    const { error: upsertError } = await supabase
      .from('google_places_cache')
      .upsert({
        place_query: CACHE_KEY,
        data: formattedResponse,
        cached_at: new Date().toISOString(),
        expires_at: expiresAt,
        hit_count: 0
      }, { 
        onConflict: 'place_query' 
      });

    if (upsertError) {
      console.error('[google-places] Cache upsert error:', upsertError);
    } else {
      console.log('[google-places] Cached response until:', expiresAt);
    }

    return new Response(JSON.stringify({ 
      ...formattedResponse, 
      cached: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[google-places] Error:', error);
    return new Response(JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
