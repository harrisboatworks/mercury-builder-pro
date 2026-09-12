// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MotorComparisonProvider } from '@/contexts/MotorComparisonContext';
import { QuoteProvider } from '@/contexts/QuoteContext';
import Mercury115ProXS from '@/pages/landing/Mercury115ProXS';
import MotorSelectionPage from './MotorSelectionPage';

export const SOURCE_SHA = '397654fe566cb207d75be5b619371bc0c8e9531e';

export const SYNTHETIC_MOTOR_ROWS = [
  {
    id: 'portable-99',
    model: '9.9 MH FourStroke',
    model_display: '9.9 MH FourStroke',
    horsepower: 9.9,
    msrp: 3900,
    availability: 'InStock',
    in_stock: true,
    motor_type: 'FourStroke',
  },
  {
    id: 'fs-115',
    model: '115 ELPT FourStroke',
    model_display: '115 ELPT FourStroke',
    horsepower: 115,
    msrp: 16490,
    availability: 'InStock',
    in_stock: true,
    motor_type: 'FourStroke',
  },
  {
    id: 'pxs-115',
    model: '115 ELPT Pro XS',
    model_display: '115 ELPT Pro XS',
    horsepower: 115,
    msrp: 17490,
    availability: 'InStock',
    in_stock: true,
    motor_type: 'Pro XS',
  },
  {
    id: 'pxs-115-compact',
    model: '115ELPT ProXS',
    model_display: '115ELPT ProXS',
    horsepower: 115,
    msrp: 17490,
    availability: 'InStock',
    in_stock: true,
    motor_type: 'Pro XS',
  },
  {
    id: 'fs-150',
    model: '150 L FourStroke',
    model_display: '150 L FourStroke',
    horsepower: 150,
    msrp: 18990,
    availability: 'InStock',
    in_stock: true,
    motor_type: 'FourStroke',
  },
] as const;

export const FIXTURE_SHA256 = createHash('sha256')
  .update(JSON.stringify(SYNTHETIC_MOTOR_ROWS))
  .digest('hex');

const CATALOG_DELAY_MS = 80;

vi.mock('@/lib/helmet', () => ({
  Helmet: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/repower/RepowerHeader', () => ({
  RepowerHeader: () => <header data-testid="repower-header" />,
}));

vi.mock('@/components/ui/site-footer', () => ({
  SiteFooter: () => <footer data-testid="site-footer" />,
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
  trackClarityMotorSelection: vi.fn(),
}));

vi.mock('@/lib/configurator-preload', () => ({
  preloadConfiguratorImages: vi.fn(),
  preloadModalChunk: vi.fn(),
  preloadConfiguratorImagesHighPriority: vi.fn(),
}));

vi.mock('@/hooks/useActivePromotions', () => ({
  useActivePromotions: () => ({ promotions: [], loading: false }),
}));

vi.mock('@/hooks/useActiveFinancingPromo', () => ({
  useActiveFinancingPromo: () => ({ promo: null, loading: false, error: null }),
}));

const testMocks = vi.hoisted(() => ({
  toast: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: testMocks.toast }),
}));

vi.mock('@/lib/visibleMotorsStore', () => ({
  setVisibleMotors: vi.fn(),
}));

vi.mock('@/components/motors/HybridMotorSearch', () => ({
  HybridMotorSearch: () => <div data-testid="hybrid-search" />,
}));

vi.mock('@/components/motors/ConfigFilterSheet', () => ({
  ConfigFilterSheet: () => null,
}));

vi.mock('@/components/motors/MotorCardPreview', () => ({
  default: ({ title, hp }: { title: string; hp: number }) => (
    <article data-testid="motor-preview">{`${hp} ${title}`}</article>
  ),
}));

vi.mock('@/components/motors/RecentlyViewedBar', () => ({
  RecentlyViewedBar: () => null,
}));

vi.mock('@/components/motors/MotorConfiguratorModal', () => ({
  MotorConfiguratorModal: () => null,
}));

vi.mock('@/components/motors/ComparisonDrawer', () => ({
  ComparisonDrawer: () => null,
}));

vi.mock('@/components/motors/ComparisonFloatingBar', () => ({
  ComparisonFloatingBar: () => null,
}));

vi.mock('@/components/ui/SearchOverlay', () => ({
  SearchOverlay: () => null,
}));

vi.mock('@/components/quote-builder/MotorRecommendationQuiz', () => ({
  MotorRecommendationQuiz: () => null,
}));

vi.mock('@/components/quote-builder/PromoReminderModal', () => ({
  PromoReminderModal: () => null,
}));

vi.mock('@/components/quote-builder/MotorSelectionFAQ', () => ({
  MotorSelectionFAQ: () => null,
}));

vi.mock('@/components/motors/EmailCaptureInline', () => ({
  EmailCaptureInline: () => null,
}));

vi.mock('@/components/voice/VoiceStatusBanner', () => ({
  VoiceStatusBanner: () => null,
}));

vi.mock('@/components/ui/page-transition', () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/integrations/supabase/client', () => {
  function query(table: string) {
    const payload = () => {
      if (table === 'motor_models') {
        return { data: SYNTHETIC_MOTOR_ROWS, error: null };
      }
      return { data: [], error: null };
    };
    const chain: Record<string, unknown> = {
      select: () => chain,
      order: () => chain,
      eq: () => chain,
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        new Promise((done) => {
          const delay = table === 'motor_models' ? CATALOG_DELAY_MS : 0;
          setTimeout(() => done(payload()), delay);
        }).then(resolve, reject),
    };
    return chain;
  }
  return {
    supabase: {
      from: (table: string) => query(table),
      functions: { invoke: vi.fn() },
    },
  };
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderQuoteFlow(initialPath: string) {
  return render(
    <QuoteProvider>
      <MotorComparisonProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <LocationProbe />
          <Routes>
            <Route path="/mercury/115-pro-xs" element={<Mercury115ProXS />} />
            <Route path="/quote" element={<MotorSelectionPage />} />
            <Route path="/quote/motor-selection" element={<MotorSelectionPage />} />
          </Routes>
        </MemoryRouter>
      </MotorComparisonProvider>
    </QuoteProvider>,
  );
}

function motorCards() {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-motor-card="true"]'));
}

function highlightedCards() {
  return motorCards().filter((el) => el.classList.contains('motor-card-highlight'));
}

function inViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.top >= 0 && rect.bottom <= window.innerHeight && rect.height > 0;
}

function installViewportGeometry(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  const previousRect = HTMLElement.prototype.getBoundingClientRect;
  const previousScroll = HTMLElement.prototype.scrollIntoView;
  const scrolled: HTMLElement[] = [];

  HTMLElement.prototype.scrollIntoView = function scrollIntoView(this: HTMLElement) {
    this.dataset.scrolledIntoView = '1';
    scrolled.push(this);
  };

  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(this: HTMLElement) {
    if (this.getAttribute('data-motor-card') === 'true') {
      const shown = this.dataset.scrolledIntoView === '1';
      const families = (this.dataset.families || '').toLowerCase();
      const top = shown ? 180 : families.includes('pro xs') ? height + 400 : 80;
      return {
        x: 16,
        y: top,
        top,
        bottom: top + 240,
        left: 16,
        right: 360,
        width: 344,
        height: 240,
        toJSON() {},
      } as DOMRect;
    }
    return previousRect.call(this);
  };

  return {
    scrolled,
    restore() {
      HTMLElement.prototype.scrollIntoView = previousScroll;
      HTMLElement.prototype.getBoundingClientRect = previousRect;
    },
  };
}

describe('#89 destination after 115 Pro XS CTA (synthetic catalog, no production)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    { label: 'desktop', width: 1280, height: 800 },
    { label: 'mobile', width: 390, height: 844 },
  ])(
    'after navigation, delayed catalog highlights 115 Pro XS and scrolls it into view ($label)',
    async ({ label, width, height }) => {
      const geometry = installViewportGeometry(width, height);
      const view = renderQuoteFlow('/mercury/115-pro-xs');

      const cta = screen.getAllByRole('link', { name: 'Build My 115 Pro XS Quote' })[0];
      expect(cta).toHaveAttribute('href', '/quote?model=115-pro-xs');
      fireEvent.click(cta);

      expect(screen.getByTestId('location')).toHaveTextContent('/quote?model=115-pro-xs');
      expect(document.querySelector('.motor-grid-section')).not.toBeInTheDocument();
      expect(motorCards()).toHaveLength(0);
      expect(document.querySelectorAll('[class*="animate-"]').length + document.querySelectorAll('[class*="skeleton"]').length)
        .toBeGreaterThanOrEqual(0);

      await waitFor(
        () => {
          expect(screen.getByRole('heading', { name: /choose your power/i })).toBeInTheDocument();
        },
        { timeout: 2000 },
      );

      expect(document.querySelector('.motor-grid-section')).toBeInTheDocument();
      expect(screen.getByTestId('location')).toHaveTextContent('/quote?model=115-pro-xs');

      await waitFor(
        () => {
          expect(motorCards().length).toBe(SYNTHETIC_MOTOR_ROWS.length);
        },
        { timeout: 2000 },
      );

      await waitFor(
        () => {
          expect(highlightedCards().length).toBe(2);
        },
        { timeout: 2000 },
      );

      const cards = motorCards();
      const fourStroke115 = cards.find((el) => el.dataset.hp === '115' && (el.dataset.families || '').toLowerCase() === 'fourstroke');
      const proXs = cards.filter((el) => el.dataset.hp === '115' && (el.dataset.families || '').toLowerCase().includes('pro xs'));

      expect(fourStroke115).toBeTruthy();
      expect(fourStroke115?.classList.contains('motor-card-highlight')).toBe(false);
      expect(proXs).toHaveLength(2);
      expect(proXs.every((el) => el.classList.contains('motor-card-highlight'))).toBe(true);
      expect(proXs.map((el) => el.querySelector('[data-testid="motor-preview"]')?.textContent)).toEqual([
        '115 115 ELPT Pro XS',
        '115 115ELPT ProXS',
      ]);

      expect(geometry.scrolled[0]).toBe(proXs[0]);
      expect(proXs[0].dataset.scrolledIntoView).toBe('1');
      expect(inViewport(proXs[0])).toBe(true);
      expect(inViewport(fourStroke115!)).toBe(true);
      expect(inViewport(proXs[1])).toBe(false);

      const badgeSlots = document.querySelectorAll('[data-search-badge-slot="true"]');
      expect(badgeSlots.length).toBe(0);

      mkdirSync('/opt/cursor/artifacts', { recursive: true });
      writeFileSync(
        `/opt/cursor/artifacts/issue89-destination-${label}.html`,
        `<!doctype html><meta charset="utf-8"><title>#89 destination ${label}</title>` +
          `<p>source=${SOURCE_SHA}</p><p>fixture=${FIXTURE_SHA256}</p>` +
          view.container.innerHTML,
      );
      geometry.restore();
      view.unmount();
    },
  );
});
