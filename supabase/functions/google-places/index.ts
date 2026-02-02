import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_KEY = 'harris-boat-works-gores-landing';
const CACHE_TTL_HOURS = 24;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    // Initialize Supabase client for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
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
          ...cached.data, 
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
      throw new Error(`Google Places API error: ${searchData.error.message || searchData.error.status}`);
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
      reviews: place.reviews?.map((review: any) => ({
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
      photos: place.photos?.slice(0, 5).map((photo: any) => ({
        name: photo.name,
        url: `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=800&key=${apiKey}`,
      })) || [],
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
