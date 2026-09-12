// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { mkdirSync, writeFileSync } from 'node:fs';
import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyMotorFamily, getMotorFamilyDisplay } from '@/lib/motor-family-classifier';
import { PRO_XS_115 } from '@/data/landing/mercuryLineupLandings';
import Mercury115ProXS from './Mercury115ProXS';

vi.mock('@/lib/helmet', () => ({
  Helmet: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/repower/RepowerHeader', () => ({
  RepowerHeader: () => <header data-testid="repower-header" />,
}));

vi.mock('@/components/ui/site-footer', () => ({
  SiteFooter: () => <footer data-testid="site-footer" />,
}));

const DEEP_LINK_MODEL_TARGETS: Record<string, { hp: number; family?: string }> = {
  '150-hp': { hp: 150 },
  '115-pro-xs': { hp: 115, family: 'pro xs' },
  '150-pro-xs': { hp: 150, family: 'pro xs' },
  '200-pro-xs': { hp: 200, family: 'pro xs' },
  '250-pro-xs': { hp: 250, family: 'pro xs' },
};

const SYNTHETIC_CATALOG = [
  { id: 'portable-99', hp: 9.9, model: '9.9 MH FourStroke' },
  { id: 'fs-115', hp: 115, model: '115 ELPT FourStroke' },
  { id: 'pxs-115', hp: 115, model: '115 ELPT Pro XS' },
  { id: 'pxs-115-compact', hp: 115, model: '115ELPT ProXS' },
  { id: 'fs-150', hp: 150, model: '150 L FourStroke' },
];

const errors: string[] = [];
const originalError = console.error;
const originalWarn = console.warn;

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderLanding(initialPath = '/mercury/115-pro-xs') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationProbe />
      <Routes>
        <Route path="/mercury/115-pro-xs" element={<Mercury115ProXS />} />
        <Route path="/quote" element={<div data-testid="quote-sink">quote sink</div>} />
        <Route path="/quote/motor-selection" element={<div data-testid="quote-sink">quote sink</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function cardDataset(motor: (typeof SYNTHETIC_CATALOG)[number]) {
  const type = getMotorFamilyDisplay(classifyMotorFamily(motor.hp, motor.model));
  return { hp: String(motor.hp), families: type, type };
}

function matchDeepLinkCards(
  cards: Array<{ hp: string; families: string }>,
  modelParam: string,
) {
  const target = DEEP_LINK_MODEL_TARGETS[modelParam.toLowerCase()];
  if (!target) return [];
  return cards.filter((el) => {
    const hp = parseFloat(el.hp || '');
    if (hp !== target.hp) return false;
    if (!target.family) return true;
    return (el.families || '').toLowerCase().includes(target.family);
  });
}

function applyHighlight(root: HTMLElement, modelParam: string) {
  const target = DEEP_LINK_MODEL_TARGETS[modelParam.toLowerCase()];
  if (!target) return [] as HTMLElement[];
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-motor-card="true"]'));
  const matches = cards.filter((el) => {
    const hp = parseFloat(el.dataset.hp || '');
    if (hp !== target.hp) return false;
    if (!target.family) return true;
    return (el.dataset.families || '').toLowerCase().includes(target.family);
  });
  matches.forEach((el) => {
    el.classList.add('motor-card-highlight');
    const badge = el.querySelector<HTMLElement>('[data-search-badge-slot="true"]');
    if (badge) badge.classList.remove('hidden');
  });
  matches[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return matches;
}

describe('#89 Mercury 115 Pro XS CTA reproduction (synthetic catalog)', () => {
  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
    errors.length = 0;
  });

  it('keeps the landing CTA as a keyboard-activatable quote deep-link on desktop and mobile widths', async () => {
    console.error = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
      originalError(...args);
    };
    console.warn = (...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
      originalWarn(...args);
    };

    for (const width of [1280, 390]) {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
      const view = renderLanding();
      const ctas = screen.getAllByRole('link', { name: 'Build My 115 Pro XS Quote' });
      expect(ctas.length).toBeGreaterThanOrEqual(2);
      for (const cta of ctas) {
        expect(cta).toHaveAttribute('href', '/quote?model=115-pro-xs');
        expect(cta.tagName).toBe('A');
        expect(cta).not.toHaveAttribute('aria-disabled');
        expect(cta.getAttribute('tabindex')).not.toBe('-1');
        expect(cta.className).toMatch(/focus-visible:ring/);
      }

      const artifactDir = '/opt/cursor/artifacts';
      mkdirSync(artifactDir, { recursive: true });
      writeFileSync(
        `${artifactDir}/issue89-landing-${width}.html`,
        `<!doctype html><meta charset="utf-8"><title>#89 landing ${width}</title>${view.container.innerHTML}`,
      );

      ctas[0].focus();
      expect(ctas[0]).toHaveFocus();
      fireEvent.keyDown(ctas[0], { key: 'Enter', code: 'Enter', bubbles: true });
      fireEvent.keyUp(ctas[0], { key: 'Enter', code: 'Enter', bubbles: true });
      // jsdom does not synthesize a click from Enter on <a>. Native browsers do.
      // Click here proves the same href the focused link would activate.
      fireEvent.click(ctas[0]);
      expect(screen.getByTestId('location')).toHaveTextContent('/quote?model=115-pro-xs');
      expect(screen.getByTestId('quote-sink')).toBeInTheDocument();
      view.unmount();
    }

    expect(PRO_XS_115.primaryCta).toEqual({
      label: 'Build My 115 Pro XS Quote',
      to: '/quote?model=115-pro-xs',
    });
    expect(errors.filter((line) => !line.includes('Not implemented: navigation'))).toEqual([]);
  });

  it('matches hp/family after asynchronous card mount and highlights the visible Pro XS cards', async () => {
    const classified = SYNTHETIC_CATALOG.map((motor) => ({ ...motor, ...cardDataset(motor) }));
    expect(classified.find((m) => m.id === 'pxs-115')?.type).toBe('Pro XS');
    expect(classified.find((m) => m.id === 'pxs-115-compact')?.type).toBe('Pro XS');
    expect(classified.find((m) => m.id === 'fs-115')?.type).toBe('FourStroke');

    const matched = matchDeepLinkCards(classified, '115-pro-xs');
    expect(matched.map((m) => classified.find((row) => row.hp === m.hp && row.families === m.families && row.type === 'Pro XS')).filter(Boolean).length).toBe(2);
    expect(matched.every((m) => m.hp === '115' && m.families.toLowerCase().includes('pro xs'))).toBe(true);
    expect(matchDeepLinkCards(classified, '115-pro-xs').some((m) => m.families === 'FourStroke')).toBe(false);

    const root = document.createElement('div');
    document.body.appendChild(root);
    const scrolled: string[] = [];
    const previousScroll = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = function scrollIntoView() {
      scrolled.push((this as HTMLElement).dataset.model || '');
    };

    await new Promise((resolve) => setTimeout(resolve, 80));
    for (const motor of classified) {
      const card = document.createElement('div');
      card.setAttribute('data-motor-card', 'true');
      card.dataset.hp = motor.hp;
      card.dataset.families = motor.families;
      card.dataset.model = motor.id;
      card.innerHTML = `<button type="button">${motor.model}</button><div data-search-badge-slot="true" class="hidden">Selected from your search</div>`;
      root.appendChild(card);
    }

    const matches = applyHighlight(root, '115-pro-xs');
    expect(matches.map((el) => el.dataset.model)).toEqual(['pxs-115', 'pxs-115-compact']);
    expect(matches.every((el) => el.classList.contains('motor-card-highlight'))).toBe(true);
    expect(matches[0].querySelector('[data-search-badge-slot="true"]')?.classList.contains('hidden')).toBe(false);
    expect(scrolled[0]).toBe('pxs-115');
    expect(matches[0].getBoundingClientRect().height).toBeGreaterThanOrEqual(0);

    const firstButton = within(matches[0]).getByRole('button', { name: '115 ELPT Pro XS' });
    firstButton.focus();
    expect(firstButton).toHaveFocus();
    fireEvent.keyDown(firstButton, { key: 'Enter', code: 'Enter' });
    fireEvent.click(firstButton);

    mkdirSync('/opt/cursor/artifacts', { recursive: true });
    writeFileSync(
      '/opt/cursor/artifacts/issue89-highlighted-cards.html',
      `<!doctype html><meta charset="utf-8"><title>#89 highlighted cards</title>${root.innerHTML}`,
    );
    HTMLElement.prototype.scrollIntoView = previousScroll;
    root.remove();
  });
});
