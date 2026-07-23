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

  it('keeps HP choices horizontal under the legacy mobile flex override', () => {
    const motorSelectionSource = read('src/pages/quote/MotorSelectionPage.tsx');

    expect(motorSelectionSource).toContain('keep-flex flex flex-row gap-2 overflow-x-auto');
  });

  it('keeps the motor-selection preamble specific to Mercury outboards', () => {
    const motorSelectionSource = read('src/pages/quote/MotorSelectionPage.tsx');

    expect(motorSelectionSource).toContain('Mercury Outboard Quote Builder');
    expect(motorSelectionSource).toContain('Start with the horsepower on your current motor');
    expect(motorSelectionSource).not.toMatch(/Mercury boats/i);
    expect(motorSelectionSource).not.toMatch(/boats and (?:motors|outboards)/i);
  });

  it('does not celebrate before a customer has committed', () => {
    const summarySource = read('src/pages/quote/QuoteSummaryPage.tsx');
    const stickySource = read('src/components/quote-builder/StickySummary.tsx');

    expect(summarySource).not.toContain('QuoteRevealCinematic');
    expect(stickySource).not.toContain('canvas-confetti');
    expect(stickySource).not.toContain('playCelebration');
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
