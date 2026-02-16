import { Skeleton } from '@/components/ui/skeleton';
import { OpeningHours, isCurrentlyOpen } from '@/hooks/useGooglePlaceData';
import { COMPANY_INFO } from '@/lib/companyInfo';

interface OpeningHoursDisplayProps {
  openingHours?: OpeningHours;
  loading?: boolean;
  error?: boolean;
}

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

  const hours = openingHours?.weekdayText;

  // If no Google data available, show graceful fallback
  if (!hours || hours.length === 0) {
    const phoneLink = COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '');
    return (
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          Contact us for current hours
        </p>
        <a
          href={`tel:+1${phoneLink}`}
          className="text-primary text-sm hover:underline"
        >
          {COMPANY_INFO.contact.phone}
        </a>
      </div>
    );
  }

  // Calculate isOpen client-side for accurate real-time status
  const calculatedIsOpen = isCurrentlyOpen(hours);
  const isOpen = calculatedIsOpen !== null ? calculatedIsOpen : openingHours?.isOpen;

  return (
    <div className="space-y-1">
      {/* Open/Closed Status Badge - calculated client-side for accuracy */}
      {isOpen !== undefined && isOpen !== null && (
        <div className="mb-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isOpen
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {isOpen ? 'Open Now' : 'Closed'}
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
