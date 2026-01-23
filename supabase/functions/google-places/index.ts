import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'details';
    const searchQuery = url.searchParams.get('query') || 'Harris Boat Works Gores Landing Ontario';

    // Step 1: Search for the place using Places API (New)
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

    return new Response(JSON.stringify(formattedResponse), {
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
