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

### What to Monitor
- Motor selection → options conversion rate (baseline: 7.6%)
- `pricing_updates` email captures per week
- CTA click rate via `cta_build_quote` event
- Review after 2–3 weeks with larger sample
