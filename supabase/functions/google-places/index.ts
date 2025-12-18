import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Harris Boat Works Place ID (search for it using Places API if needed)
const PLACE_ID = 'ChIJN1t_tDeuEmsRUsoyG83frY4'; // This will be updated with actual place ID

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
    const searchQuery = url.searchParams.get('query');

    // If we need to find the Place ID first
    if (action === 'findPlace' && searchQuery) {
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      console.log('[google-places] Find place result:', searchData);
      
      return new Response(JSON.stringify(searchData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get place details including reviews
    const placeId = url.searchParams.get('placeId') || PLACE_ID;
    const fields = 'name,rating,user_ratings_total,reviews,opening_hours,formatted_phone_number,formatted_address,website,photos,geometry';
    
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    
    console.log('[google-places] Fetching place details for:', placeId);
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    if (detailsData.status !== 'OK') {
      console.error('[google-places] API error:', detailsData);
      throw new Error(`Google Places API error: ${detailsData.status}`);
    }

    const result = detailsData.result;
    
    // Format the response
    const formattedResponse = {
      name: result.name,
      rating: result.rating,
      totalReviews: result.user_ratings_total,
      reviews: result.reviews?.map((review: any) => ({
        authorName: review.author_name,
        authorPhoto: review.profile_photo_url,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relativeTime: review.relative_time_description,
      })) || [],
      openingHours: result.opening_hours ? {
        isOpen: result.opening_hours.open_now,
        weekdayText: result.opening_hours.weekday_text,
        periods: result.opening_hours.periods,
      } : null,
      phone: result.formatted_phone_number,
      address: result.formatted_address,
      website: result.website,
      location: result.geometry?.location,
      photos: result.photos?.slice(0, 5).map((photo: any) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`,
      })) || [],
    };

    console.log('[google-places] Returning formatted response with', formattedResponse.reviews?.length, 'reviews');

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
