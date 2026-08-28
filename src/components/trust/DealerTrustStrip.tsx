import { Award, Home, MapPin, DollarSign } from 'lucide-react';

interface DealerTrustStripProps {
  variant?: 'compact' | 'full';
  className?: string;
}

const ITEMS = [
  {
    icon: Award,
    title: 'Mercury Premier Dealer',
    body: 'Authorized Mercury Marine dealer since 1965.',
  },
  {
    icon: Home,
    title: 'Family-owned since 1947',
    body: 'Three generations on Rice Lake, Ontario.',
  },
  {
    icon: MapPin,
    title: 'Serving Toronto, GTA & Kawarthas',
    body: 'Pickup at our Gores Landing shop. No shipping.',
  },
  {
    icon: DollarSign,
    title: 'Live CAD pricing',
    body: 'Real, itemized quote in about 3 minutes.',
  },
];

export function DealerTrustStrip({ variant = 'full', className = '' }: DealerTrustStripProps) {
  const items = variant === 'compact' ? ITEMS.slice(0, 2) : ITEMS;

  return (
    <section
      aria-label="Why buyers trust Harris Boat Works"
      className={`rounded-xl border border-border bg-card ${className}`}
    >
      <ul
        className={`grid gap-px bg-border ${
          variant === 'compact' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
        }`}
      >
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="bg-card p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground leading-tight">{title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{body}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
