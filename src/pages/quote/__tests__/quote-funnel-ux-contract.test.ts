import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('quote funnel UX contract', () => {
  it('lets customers continue when a trade-in estimate is unavailable', () => {
    const tradeInSource = read('src/components/quote-builder/TradeInValuation.tsx');

    expect(tradeInSource).toContain('!standalone && tradeInInfo.hasTradeIn && onAutoAdvance');
    expect(tradeInSource).toContain('data-testid="trade-in-continue"');
  });

  it('gives mobile customers the same reservation path as desktop', () => {
    const summarySource = read('src/pages/quote/QuoteSummaryPage.tsx');

    expect(summarySource).toContain('Reserve this motor —');
    expect(summarySource).toContain('onClick={handleReserveDeposit}');
    expect(summarySource).toContain('onReview={handleStepComplete}');
    expect(summarySource).toContain('Have HBW Review My Quote');
  });

  it('supports an express motor-only purchase path from the 9.9 MH sale page', () => {
    const saleSource = read('src/components/motors/Mercury99MHSalePage.tsx');
    const motorSelectionSource = read('src/pages/quote/MotorSelectionPage.tsx');
    const summarySource = read('src/pages/quote/QuoteSummaryPage.tsx');
    const contextSource = read('src/contexts/QuoteContext.tsx');
    const paymentSource = read('supabase/functions/create-payment/index.ts');
    const webhookSource = read('supabase/functions/stripe-webhook/index.ts');
    const emailSource = read('supabase/functions/send-deposit-confirmation-email/index.ts');
    const supabaseConfig = read('supabase/config.toml');
    const successSource = read('src/pages/PaymentSuccess.tsx');
    const pdfSource = read('src/components/quote-pdf/ProfessionalQuotePDF.tsx');
    const globalStickySource = read('src/components/quote/GlobalStickyQuoteBar.tsx');
    const depositDialogSource = read('src/components/quote-builder/DepositInfoDialog.tsx');
    const motorSelectionFaqSource = read('src/components/quote-builder/MotorSelectionFAQ.tsx');
    const termsSource = read('src/pages/Terms.tsx');
    const llmsSource = read('public/llms.txt');

    expect(saleSource).toContain("motorOnlyParams.set('intent', 'motor-only')");
    expect(saleSource).toContain('Reserve Your 9.9 — ${depositAmount.toLocaleString()}');
    expect(saleSource).toContain('secure this model with a ${depositAmount.toLocaleString()} reservation deposit');
    expect(motorSelectionSource).toContain("searchParams.get('intent') === 'motor-only'");
    expect(motorSelectionSource).toContain('motorId === MERCURY_99_MH_EXPRESS_MOTOR_ID');
    expect(motorSelectionSource).toContain("type: 'START_MOTOR_ONLY_QUOTE'");
    expect(contextSource).toContain("purchasePath: 'loose'");
    expect(contextSource).toContain("selectedPaymentMethod: 'cash_purchase'");
    expect(contextSource).toContain('motorOnlyExpress: true');
    expect(contextSource).toContain('suppressAdditionalPromoSavings: true');
    expect(summarySource).toContain('const suppressAdditionalPromoSavings = state.uiFlags.suppressAdditionalPromoSavings === true');
    expect(summarySource).toContain('const promoSavings = suppressAdditionalPromoSavings');
    expect(summarySource).toContain('Your motor-only reservation');
    expect(summarySource).toContain('showProgress={!isMotorOnlyExpress}');
    expect(summarySource).toContain('!isMotorOnlyExpress && (');
    expect(summarySource).toContain('motorId: state.motor?.id');
    expect(saleSource).toContain('Fully refundable until HBW confirms the exact motor, price, availability and ETA');
    expect(summarySource).toContain('After written approval, it becomes non-refundable and is credited to your final invoice.');
    expect(depositDialogSource).toContain("depositAmount === 100");
    expect(depositDialogSource).toContain('you approve the order in writing');
    expect(motorSelectionFaqSource).toContain('model-specific Mercury 9.9 MH offer for model 1A10201LK uses a $100 CAD deposit');
    expect(motorSelectionFaqSource).not.toContain('Deposits are fully refundable within 7 days');
    expect(paymentSource).toContain('if (depositAmount === "100")');
    expect(paymentSource).toContain('quoteData?.motorId !== EXPRESS_MOTOR_ID');
    expect(paymentSource).toContain('resolvedModelNumber !== EXPRESS_MOTOR_MODEL_NUMBER');
    expect(paymentSource).toContain('Customer information required for deposit');
    expect(paymentSource).not.toContain('rawBody.motorInfo');
    expect(paymentSource).not.toContain('rawBody.savedQuoteId');
    expect(paymentSource).toContain('const paymentOrigin = resolvePaymentOrigin(req)');
    expect(paymentSource).toContain('const origin = paymentOrigin');
    expect(paymentSource).toContain('action: z.literal("verify")');
    expect(paymentSource).toContain('phone: z.string().trim().min(7)');
    expect(webhookSource).toContain('session.payment_status !== "paid"');
    expect(webhookSource).toContain('savedQuoteId === boundSavedQuoteId');
    expect(webhookSource).toContain('.contains("quote_data", { payment_status: "pending" })');
    expect(webhookSource).toContain('Bound deposit record lookup failed');
    expect(webhookSource).toContain('Bound quote record lookup failed');
    expect(webhookSource).toContain('body: { stripeSessionId: session.id }');
    expect(webhookSource).not.toContain('saved_quotes updated via email fallback');
    expect(emailSource).toContain('isAuthorizedInternalRequest(req)');
    expect(emailSource).toContain('Paid deposit record not found');
    expect(emailSource).toContain('A bound Stripe session is required');
    expect(supabaseConfig).toContain('[functions.send-deposit-confirmation-email]\nverify_jwt = true');
    expect(successSource).toContain("body: { action: 'verify', sessionId }");
    expect(successSource).toContain("const isDeposit = verification.paymentType === 'motor_deposit'");
    expect(successSource).toContain('const isMercury99MhReservation = isDeposit && verification.amountPaid === 100');
    expect(successSource).toContain('Your $100 reservation terms:');
    expect(successSource).toContain("data?.paymentIntentStatus === 'processing'");
    expect(successSource).toContain('if (verificationError || !verification?.verified)');
    expect(successSource).not.toContain('quote PDF attached');
    expect(pdfSource).toContain('reservationRequiresConfirmation');
    expect(pdfSource).toContain('It becomes non-refundable and is credited to your final invoice only after you approve the order in writing.');
    expect(emailSource).toContain('Your $100 reservation terms:');
    expect(termsSource).toContain('Model-Specific Mercury 9.9 MH Reservation Deposit');
    expect(llmsSource).toContain('model-specific Mercury 9.9 MH offer for model 1A10201LK uses a $100 CAD reservation deposit');
    expect(globalStickySource).toContain("'/payment-success'");
    expect(globalStickySource).toContain("'/motors/fourstroke-9-9hp-9-9mh-fourstroke'");
    expect(summarySource).not.toContain("status: 'Confirmed'");
    expect(summarySource).not.toContain('deposit-confirmed PDF');
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

  it('explains data use and exposes required quote fields to assistive technology', () => {
    const scheduleSource = read('src/components/quote-builder/ScheduleConsultation.tsx');
    const reminderSource = read('src/components/quote-builder/PromoReminderModal.tsx');
    const inlineCaptureSource = read('src/components/motors/EmailCaptureInline.tsx');

    expect(scheduleSource).toContain('We use your details to review this quote and contact you about it.');
    expect(scheduleSource).toContain('to="/privacy"');
    expect(scheduleSource.match(/aria-required="true"/g)).toHaveLength(3);
    expect(scheduleSource.match(/aria-invalid=/g)).toHaveLength(3);
    expect(scheduleSource).toContain('role="alert"');
    expect(reminderSource).toContain('This signs you up for price and promotion updates for this motor.');
    expect(reminderSource).toContain('has-[:focus-visible]:ring-2');
    expect(inlineCaptureSource).toContain('Email address for pricing and deal updates');
    expect(inlineCaptureSource).toContain('Pricing and deal emails from Harris Boat Works.');
  });

  it('preserves agency before the reservation payment', () => {
    const depositSource = read('src/components/quote-builder/DepositInfoDialog.tsx');

    expect(depositSource).toContain('Review Secure Checkout');
    expect(depositSource).toContain('before anything is ordered');
  });

  it('gives the motor-search input a persistent accessible name', () => {
    const searchSource = read('src/components/motors/HybridMotorSearch.tsx');
    const inputMarkup = searchSource.match(/<input\b[\s\S]*?placeholder=""[\s\S]*?\/>/)?.[0];

    expect(inputMarkup).toBeTruthy();
    expect(inputMarkup).toContain('placeholder=""');

    const accessibleName = inputMarkup?.match(/\baria-label="([^"]*)"/)?.[1]?.trim();
    expect(accessibleName).toBeTruthy();
  });
});
