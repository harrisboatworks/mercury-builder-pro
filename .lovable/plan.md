## Funnel Optimization: Motor Selection Drop-off (March 2026)

### Context
Week 1 data (121 sessions) showed a 92% drop between motor selection (92 sessions) and the next quote step (7 sessions). 85% of traffic is mobile.

### Changes Made

**1. Floating Mobile CTA (`src/components/motors/MobileQuoteCTA.tsx`)**
- Appears after user scrolls past 2+ motor cards using IntersectionObserver
- "Build Your Quote — Tap any motor to configure & get pricing"
- Dismissible, positioned above the UnifiedMobileBar (bottom-20)
- Fires `cta_build_quote` gtag event

**2. Inline Email Capture (`src/components/motors/EmailCaptureInline.tsx`)**
- Shows below the motor grid, above the financing disclaimer
- Single email field → writes to `email_sequence_queue` with `sequence_type: 'pricing_updates'`
- Captures device type and timestamp in metadata
- Success state with confirmation message
- Fires `lead_capture` gtag event

**3. Motor card data attribute**
- Added `data-motor-card` to each motor card wrapper for CTA trigger observation

## Merged QR Code + CTA (March 2026)

### Context
The PDF had two overlapping sections — a "Financing Available" box with QR (only for financing-eligible quotes) and a separate "Ready to Proceed?" CTA box. The CTA box caused page-break issues and cash buyers under $5K never got a QR code.

### Changes Made

**1. Universal QR generation (`QuoteSummaryPage.tsx`, `AdminQuoteDetail.tsx`)**
- QR code is now always generated regardless of financing threshold
- Financing-eligible quotes: QR points to `/financing-application?...` with prefilled params
- Sub-$5K quotes: QR points to `mercuryrepower.ca`
- `financingQrCode` field is always passed to the PDF data

**2. Merged CTA + QR section (`ProfessionalQuotePDF.tsx`)**
- Replaced separate financing box and CTA box with one unified section
- QR code on the right, CTA steps on the left ("Scan QR", "Call/text", "Reply to email")
- Financing terms ($/mo, term, APR) shown inside the same box when eligible
- Fallback text-only CTA for edge cases where QR generation fails
- `wrap={false}` prevents page-break splitting
- Deposit-confirmed quotes skip the CTA entirely (existing behavior preserved)

### What to Monitor
- Motor selection → options conversion rate (baseline: 7.6%)
- `pricing_updates` email captures per week
- CTA click rate via `cta_build_quote` event
- Review after 2–3 weeks with larger sample
