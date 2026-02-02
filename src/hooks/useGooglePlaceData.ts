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
  cached?: boolean;
  cachedAt?: string;
  expiresAt?: string;
}

/**
 * Calculate if the business is currently open based on weekday hours.
 * This allows us to use cached data while still showing accurate open/closed status.
 */
export function isCurrentlyOpen(weekdayText?: string[]): boolean | null {
  if (!weekdayText || weekdayText.length === 0) return null;

  const now = new Date();
  const dayIndex = now.getDay(); // 0=Sunday, 1=Monday, etc.
  
  // Google's weekdayText is ordered Monday-Sunday (indices 0-6)
  // JavaScript's getDay() returns 0=Sunday, 1=Monday, etc.
  // So we need to map: Sunday(0) -> index 6, Monday(1) -> index 0, etc.
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const todayHours = weekdayText[adjustedIndex];
  
  if (!todayHours) return null;
  
  // Check if closed
  if (todayHours.toLowerCase().includes('closed')) return false;
  
  // Check for 24 hours
  if (todayHours.toLowerCase().includes('24 hours') || todayHours.toLowerCase().includes('open 24')) {
    return true;
  }
  
  // Parse hours like "Monday: 8:00 AM – 5:00 PM" or "Monday: 8:00 a.m. – 5:00 p.m."
  const timePattern = /(\d{1,2}):(\d{2})\s*([AaPp]\.?[Mm]\.?)\s*[–-]\s*(\d{1,2}):(\d{2})\s*([AaPp]\.?[Mm]\.?)/;
  const match = todayHours.match(timePattern);
  
  if (!match) return null;
  
  const [, openHStr, openMStr, openPeriod, closeHStr, closeMStr, closePeriod] = match;
  
  // Convert to 24-hour format
  let openH = parseInt(openHStr, 10);
  let closeH = parseInt(closeHStr, 10);
  const openM = parseInt(openMStr, 10);
  const closeM = parseInt(closeMStr, 10);
  
  const isOpenPM = openPeriod.toLowerCase().replace(/\./g, '') === 'pm';
  const isClosePM = closePeriod.toLowerCase().replace(/\./g, '') === 'pm';
  
  if (isOpenPM && openH !== 12) openH += 12;
  if (!isOpenPM && openH === 12) openH = 0;
  if (isClosePM && closeH !== 12) closeH += 12;
  if (!isClosePM && closeH === 12) closeH = 0;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  
  // Handle cases where closing time is past midnight
  if (closeMinutes < openMinutes) {
    // Business closes after midnight
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }
  
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

async function fetchGooglePlaceData(): Promise<PlaceData | null> {
  try {
    const { data, error } = await supabase.functions.invoke('google-places', {
      body: null,
      headers: { 'Content-Type': 'application/json' },
    });

    if (error) throw error;
    
    if (!data || data.error) {
      console.warn('[useGooglePlaceData] No data or error returned:', data?.error);
      return null;
    }
    
    // Calculate isOpen client-side for accuracy with cached data
    if (data.openingHours?.weekdayText) {
      const calculatedIsOpen = isCurrentlyOpen(data.openingHours.weekdayText);
      if (calculatedIsOpen !== null) {
        data.openingHours.isOpen = calculatedIsOpen;
      }
    }
    
    if (data.cached) {
      console.log('[useGooglePlaceData] Using cached data from:', data.cachedAt);
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
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - matches server cache
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    // Recalculate isOpen on window focus since it's time-dependent
    refetchOnWindowFocus: false,
  });
}
