

# Plan: Progressive Loading + Step Count Fix

## 1. Remove Step Count from Progress Stepper

**File: `src/components/quote-builder/QuoteProgressStepper.tsx`**

Change the mobile stepper text from `Step {currentStepIndex + 1} of {visibleSteps.length}` to just `Step {currentStepIndex + 1}` (line 186). This eliminates the shifting "of N" that changes when conditional steps appear/disappear.

**File: `src/components/quote-builder/CurrentStepIndicator.tsx`**

Same change — line 20: `Step {currentStep}` instead of `Step {currentStep} of {totalSteps}`. Remove the `totalSteps` prop requirement (make it optional or remove references). Keep the progress bar percentage calculation working by keeping `totalSteps` as a prop but not displaying it in text.

## 2. Progressive Loading on Summary Page

**File: `src/pages/quote/QuoteSummaryPage.tsx`**

The current gate: a 500ms `setTimeout` sets `isMounted = true`, and until then the entire page shows `QuoteSummarySkeleton`. All pricing data is already available synchronously from context — no reason to block rendering.

Changes:
- **Remove the `isMounted` gate** (lines 136-142) and the skeleton conditional (lines 805-807). Show the main content immediately since pricing, motor data, and package info are all in-memory from the quote context.
- **Lazy-load only the heavy, non-critical sections** behind their own loading states:
  - The PDF generation button — already has its own `isGeneratingPDF` state; just keep it as-is.
  - The QR code generation — wrap in a `useState` that resolves after the QR is generated, show a small skeleton placeholder in the QR spot only.
  - The cinematic reveal already manages its own state and doesn't block content.
- **Keep the redirect guard** (lines 150-160) but check `state.isLoading` directly without the `isMounted` delay.

This means pricing, motor header, package details, and the sticky summary all render on first paint. Only the QR code spot shows a small placeholder for ~1 second while it generates.

### Files to modify
1. `src/components/quote-builder/QuoteProgressStepper.tsx` — remove "of N" from mobile stepper
2. `src/components/quote-builder/CurrentStepIndicator.tsx` — remove "of N" from step text
3. `src/pages/quote/QuoteSummaryPage.tsx` — remove `isMounted` gate, show content immediately

