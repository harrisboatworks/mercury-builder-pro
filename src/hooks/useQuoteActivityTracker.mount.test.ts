// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('quote activity tracker mount contract', () => {
  it('keeps one quote-only tracker above pathname-keyed routes', () => {
    const appSource = read('src/App.tsx');
    const layoutSource = read('src/components/quote-builder/QuoteLayout.tsx');

    const trackerMount = appSource.indexOf('<QuoteActivityTrackerMount />');
    const suspense = appSource.indexOf('<Suspense fallback={<RouteLoader />}>');
    const keyedRoutes = appSource.indexOf('<Routes location={location} key={location.pathname}>');

    expect(trackerMount).toBeGreaterThan(-1);
    expect(suspense).toBeGreaterThan(trackerMount);
    expect(keyedRoutes).toBeGreaterThan(trackerMount);
    expect(appSource).toContain('location.pathname === "/quote"');
    expect(appSource).toContain('location.pathname.startsWith("/quote/")');
    expect(layoutSource).not.toContain('useQuoteActivityTracker');
  });
});
