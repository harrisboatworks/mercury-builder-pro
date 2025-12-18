import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GoogleReview {
  authorName: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  time: number;
  relativeTime: string;
}

export interface GooglePhoto {
  name: string;
  url: string;
}

export interface PlaceLocation {
  latitude: number;
  longitude: number;
}

export interface OpeningHours {
  isOpen: boolean;
  weekdayText: string[];
}

export interface PlaceData {
  name: string;
  rating: number;
  totalReviews: number;
  reviews: GoogleReview[];
  openingHours?: OpeningHours;
  phone?: string;
  address?: string;
  website?: string;
  photos?: GooglePhoto[];
  location?: PlaceLocation;
}

async function fetchGooglePlaceData(): Promise<PlaceData | null> {
  try {
    const { data, error } = await supabase.functions.invoke('google-places', {
      body: null,
      headers: { 'Content-Type': 'application/json' },
    });

    if (error) throw error;
    
    if (!data || data.error) {
      // Fallback: try to find the place directly
      const searchResponse = await fetch(
        `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/google-places?action=findPlace&query=Harris+Boat+Works+Gores+Landing+Ontario`
      );
      const searchData = await searchResponse.json();
      
      if (searchData.candidates && searchData.candidates.length > 0) {
        const placeId = searchData.candidates[0].place_id;
        
        const detailsResponse = await fetch(
          `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/google-places?placeId=${placeId}`
        );
        return await detailsResponse.json();
      }
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('[useGooglePlaceData] Error fetching place data:', err);
    return null;
  }
}

export function useGooglePlaceData() {
  return useQuery({
    queryKey: ['google-place-data', 'harris-boat-works'],
    queryFn: fetchGooglePlaceData,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
