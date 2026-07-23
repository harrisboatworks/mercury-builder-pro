import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('quote funnel UX contract', () => {
  it('gives mobile customers the same reservation path as desktop', () => {
    const summarySource = read('src/pages/quote/QuoteSummaryPage.tsx');

    expect(summarySource).toContain('Reserve this motor —');
    expect(summarySource).toContain('onClick={handleReserveDeposit}');
    expect(summarySource).toContain('onReview={handleStepComplete}');
    expect(summarySource).toContain('Have HBW Review My Quote');
  });

  it('keeps the mobile HP rail compact, contained, and horizontal', () => {
    const motorSelectionSource = read('src/pages/quote/MotorSelectionPage.tsx');

    expect(motorSelectionSource).toContain('bg-repower-paper border-b');
    expect(motorSelectionSource).not.toContain('md:bg-transparent md:border-b-0');
    expect(motorSelectionSource).toContain('keep-flex flex flex-row gap-1.5 overflow-x-auto');
    expect(motorSelectionSource).toContain('md:hidden');
    expect(motorSelectionSource).toContain('!mobile && (');
    expect(motorSelectionSource).toContain('!mobile && range.popular');
  });

  it('uses a structured desktop HP selector without clipping its popular marker', () => {
    const motorSelectionSource = read('src/pages/quote/MotorSelectionPage.tsx');

    expect(motorSelectionSource).toContain('grid grid-cols-6 gap-1.5 overflow-visible pt-2');
    expect(motorSelectionSource).toContain('min-h-[44px] w-full rounded-sm');
    expect(motorSelectionSource).toContain('shadow-[inset_0_-3px_0_#C9A24A]');
    expect(motorSelectionSource).not.toContain('rounded-full px-3.5 py-2');
  });

  it('shows useful navigation before ultra-wide desktop widths', () => {
    const headerSource = read('src/components/repower/RepowerHeader.tsx');
    const menuSource = read('src/components/repower/RepowerMobileMenu.tsx');

    expect(headerSource).toContain('const PRIMARY_NAV_LINKS');
    expect(headerSource).toContain("label: 'Outboards'");
    expect(headerSource).toContain("label: 'Pricing'");
    expect(headerSource).toContain("label: 'Promotions'");
    expect(headerSource).toContain("label: 'Financing'");
    expect(headerSource).toContain('hidden lg:flex');
    expect(headerSource).not.toContain('hidden min-[1500px]:flex');
    expect(headerSource).toContain('More');
    expect(headerSource).toContain("const isQuoteFlow = location.pathname.startsWith('/quote')");
    expect(headerSource).toContain('!isQuoteFlow &&');
    expect(menuSource).toContain("to: '/pricing-reference'");
  });

  it('keeps the motor-selection preamble specific to Mercury outboards', () => {
    const motorSelectionSource = read('src/pages/quote/MotorSelectionPage.tsx');

    expect(motorSelectionSource).toContain('Mercury Outboard Quote Builder');
    expect(motorSelectionSource).toContain('Start with the horsepower on your current motor');
    expect(motorSelectionSource).not.toMatch(/Mercury boats/i);
    expect(motorSelectionSource).not.toMatch(/boats and (?:motors|outboards)/i);
  });

  it('keeps legacy white app surfaces out of the redesigned quote steps', () => {
    const reminderSource = read('src/components/quote-builder/PromoReminderModal.tsx');
    const boatInfoSource = read('src/components/quote-builder/BoatInformation.tsx');
    const quoteInputSource = read('src/components/quote-builder/redesign/QuoteInput.tsx');
    const quoteTileSource = read('src/components/quote-builder/redesign/QuoteRadioTile.tsx');

    expect(reminderSource).toContain('Get a price alert.');
    expect(reminderSource).toContain("Watch This Motor's Price");
    expect(reminderSource).toContain('bg-repower-cream');
    expect(reminderSource).not.toContain("Don't Miss a Deal!");
    expect(boatInfoSource).toContain('const quoteStepCardClass');
    expect(boatInfoSource).not.toContain('bg-protected');
    expect(quoteInputSource).not.toContain('bg-white');
    expect(quoteTileSource).not.toContain('bg-white');
  });

  it('does not celebrate before a customer has committed', () => {
    const summarySource = read('src/pages/quote/QuoteSummaryPage.tsx');
    const stickySource = read('src/components/quote-builder/StickySummary.tsx');
    const installationSource = read('src/components/quote-builder/InstallationConfig.tsx');

    expect(summarySource).not.toContain('QuoteRevealCinematic');
    expect(stickySource).not.toContain('canvas-confetti');
    expect(stickySource).not.toContain('playCelebration');
    expect(installationSource).not.toContain('canvas-confetti');
    expect(installationSource).not.toContain('playCelebration');
  });

  it('keeps quote content inset through tablet and small-laptop widths', () => {
    const shellSource = read('src/components/quote-builder/redesign/QuotePageShell.tsx');
    const summarySource = read('src/pages/quote/QuoteSummaryPage.tsx');

    expect(shellSource).toContain('md:px-8');
    expect(shellSource).toContain('min-[960px]:px-0');
    expect(summarySource).toContain('md:px-8');
    expect(summarySource).toContain('min-[1180px]:px-0');
  });

  it('renders the boat review card at the actual final sub-step', () => {
    const boatInfoSource = read('src/components/quote-builder/BoatInformation.tsx');
    const dynamicReviewMatches = boatInfoSource.match(/currentStep === totalSteps - 1/g) ?? [];

    expect(dynamicReviewMatches).toHaveLength(3);
    expect(boatInfoSource).not.toContain('currentStep === 4 && <Card');
    expect(boatInfoSource).toContain('whitespace-normal p-4 text-left');
  });

  it('marks submission only after the lead insert succeeds', () => {
    const scheduleSource = read('src/components/quote-builder/ScheduleConsultation.tsx');
    const trackerSource = read('src/hooks/useQuoteActivityTracker.ts');

    const persistencePoint = scheduleSource.indexOf("quoteId = fnData?.quoteId");
    const completionPoint = scheduleSource.indexOf("dispatch({ type: 'COMPLETE_STEP', payload: 7 })");

    expect(persistencePoint).toBeGreaterThan(-1);
    expect(completionPoint).toBeGreaterThan(persistencePoint);
    expect(trackerSource).toContain("event_type: 'quote_submitted'");
    expect(trackerSource).toContain('!submittedTracked.current');
  });

  it('keeps the final action no-obligation and path-specific', () => {
    const scheduleSource = read('src/components/quote-builder/ScheduleConsultation.tsx');

    expect(scheduleSource).toContain('Send My Quote for Review');
    expect(scheduleSource).toContain('This does not place an order or take payment.');
    expect(scheduleSource).toContain('Pickup is arranged only after you approve the quote');
    expect(scheduleSource).toContain('Installation is booked only after you approve the quote');
  });

  it('preserves agency before the reservation payment', () => {
    const depositSource = read('src/components/quote-builder/DepositInfoDialog.tsx');

    expect(depositSource).toContain('Review Secure Checkout');
    expect(depositSource).toContain('before anything is ordered');
  });
});
