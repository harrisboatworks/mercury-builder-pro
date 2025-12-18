import { Skeleton } from '@/components/ui/skeleton';
import { OpeningHours } from '@/hooks/useGooglePlaceData';

interface OpeningHoursDisplayProps {
  openingHours?: OpeningHours;
  loading?: boolean;
  error?: boolean;
}

// Fallback hours if API fails
const FALLBACK_HOURS = [
  'Monday: 8:00 AM – 5:00 PM',
  'Tuesday: 8:00 AM – 5:00 PM',
  'Wednesday: 8:00 AM – 5:00 PM',
  'Thursday: 8:00 AM – 5:00 PM',
  'Friday: 8:00 AM – 5:00 PM',
  'Saturday: 9:00 AM – 2:00 PM',
  'Sunday: Closed',
];

export function OpeningHoursDisplay({ openingHours, loading, error }: OpeningHoursDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-4 w-40" />
        ))}
      </div>
    );
  }

  const hours = openingHours?.weekdayText ?? (error ? FALLBACK_HOURS : FALLBACK_HOURS);

  return (
    <div className="space-y-1">
      {/* Open/Closed Status Badge */}
      {openingHours && (
        <div className="mb-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              openingHours.isOpen
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {openingHours.isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
      )}
      
      {/* Hours List */}
      {hours.map((dayHours, index) => (
        <p key={index} className="text-muted-foreground text-sm">
          {dayHours}
        </p>
      ))}
    </div>
  );
}
