import { Link } from 'react-router-dom';

/**
 * Slim credentials strip rendered under the blog hero image.
 * Restrained, footer-line feel — not a banner.
 */
export function DealerConfidenceStrip() {
  const items = [
    { label: 'Mercury Platinum Dealer' },
    { label: 'Family-owned since 1947' },
    { label: 'Mercury dealer since 1965' },
    { label: 'Gores Landing, ON' },
    { label: 'Quote builder available', href: '/quote/motor-selection' },
  ];

  return (
    <div
      role="complementary"
      aria-label="Harris Boat Works credentials"
      className="my-6 border-t border-b border-repower-navy-900/10 py-3"
    >
      <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs uppercase tracking-[0.14em] text-repower-navy-900/70">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-x-3">
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-repower-navy-900 hover:underline underline-offset-4 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
            {i < items.length - 1 && (
              <span aria-hidden="true" className="text-repower-navy-900/30">
                ·
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
