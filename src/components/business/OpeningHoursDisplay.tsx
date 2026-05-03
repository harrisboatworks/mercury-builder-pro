import { Skeleton } from '@/components/ui/skeleton';
import { OpeningHours, isCurrentlyOpen } from '@/hooks/useGooglePlaceData';
import { COMPANY_INFO } from '@/lib/companyInfo';

interface OpeningHoursDisplayProps {
  openingHours?: OpeningHours;
  loading?: boolean;
  error?: boolean;
  tone?: 'default' | 'dark';
}

export function OpeningHoursDisplay({ openingHours, loading, error, tone = 'default' }: OpeningHoursDisplayProps) {
  const isDark = tone === 'dark';
  const textClass = isDark ? 'text-repower-cream/55' : 'text-muted-foreground';
  const linkClass = isDark ? 'text-repower-gold hover:text-repower-cream' : 'text-primary hover:underline';
  const skeletonClass = isDark ? 'bg-repower-cream/10' : '';

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className={`h-4 w-40 ${skeletonClass}`} />
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
        <p className={`${textClass} text-sm`}>
          Contact us for current hours
        </p>
        <a
          href={`tel:+1${phoneLink}`}
          className={`${linkClass} text-sm transition-colors`}
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
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
              isOpen
                ? isDark ? 'border border-in-stock/30 bg-in-stock/20 text-repower-cream' : 'bg-green-100 text-green-800'
                : isDark ? 'border border-repower-mercury-red/30 bg-repower-mercury-red/15 text-repower-cream' : 'bg-red-100 text-red-800'
            }`}
          >
            {isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
      )}
      
      {/* Hours List */}
      {hours.map((dayHours, index) => (
        <p key={index} className={`${textClass} text-sm leading-relaxed`}>
          {dayHours}
        </p>
      ))}
    </div>
  );
}
