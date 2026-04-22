import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';

const STORAGE_KEY = 'dismissed_pricing_ribbon';

export function PricingRibbon() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  // Hide inside the configurator itself — redundant there
  if (location.pathname.startsWith('/quote/')) return null;
  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  return (
    <div className="hidden sm:block bg-primary text-primary-foreground text-sm">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <Link
          to="/quote/motor-selection"
          className="flex items-center gap-2 hover:underline flex-1 min-w-0"
        >
          <span className="font-medium truncate">
            Live Mercury pricing. No &ldquo;call for quote.&rdquo;
          </span>
          <span className="hidden sm:inline opacity-90">Build yours in 3 minutes</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss pricing banner"
          className="p-1 rounded hover:bg-primary-foreground/10 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
