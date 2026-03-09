

# What the Data Actually Says (and What to Do About It)

## The Numbers This Week

Since the RLS fix went live (March 7), real tracking kicked in. Here's the week:

- **121 unique sessions**, ~85% mobile, split roughly Google (24) / Facebook (23) / Instagram (4) / direct+other
- **92 sessions** hit motor selection — your landing page is working
- **7 sessions** got past options/purchase-path — that's the cliff
- **3–6 sessions** reached boat-info/trade-in
- **4 sessions** saw the summary, **1 quote abandoned**, **0 submitted**

The funnel:
```text
Motor Selection:  92 sessions (100%)
Options:           7 sessions  (7.6%)  ← 92% drop here
Purchase Path:     7 sessions  (7.6%)
Boat Info:         3 sessions  (3.3%)
Trade-In:          6 sessions  (6.5%)
Installation:      2 sessions  (2.2%)
Promo/Package:     5 sessions  (5.4%)
Summary:           4 sessions  (4.3%)
Submitted:         0 sessions  (0%)
```

## Being Honest About Sample Size

With ~2 days of real tracking and 121 sessions, we shouldn't over-index on exact percentages. But the **92 → 7 drop between motor selection and the next step** is large enough to be directionally meaningful. That's not noise.

## What I'd Recommend Building

### 1. Motor Selection → Options: Close the 92% Drop

This is the only signal strong enough to act on. 92 people browsed motors, 7 continued. The likely causes:

- **Mobile users (85% of traffic) are browsing, not buying.** They may not realize they can build a quote, or the "next step" CTA isn't prominent enough on mobile.
- **No clear single CTA on motor cards.** Users may be window-shopping without a clear nudge to start configuring.

**Proposed fix:** Add a persistent mobile-friendly CTA on the motor selection page — something like a floating "Build Your Quote" button that appears after a user has scrolled through motors. This is a small UI change with potentially outsized impact.

### 2. Capture Leads Earlier in the Funnel

Right now, you only capture contact info at the very end (PDF download / consultation). With 92 sessions browsing motors and 0 completing, you're losing everyone.

**Proposed fix:** Add an optional "Get notified about deals on this motor" email capture on motor cards or the motor selection page. Low-friction, one field, no commitment. This turns browsers into contactable leads even if they never finish the quote.

### 3. UTM Tracking Is Empty

Zero UTM-tagged sessions despite traffic from Google Ads (`doubleclick.net` referrer) and Facebook. This means your ad campaigns aren't using UTM parameters, so you can't measure which campaigns drive quote engagement vs. just clicks.

**This isn't a code fix** — it's a campaign configuration issue. All Facebook and Google ad URLs should include `?utm_source=facebook&utm_medium=cpc&utm_campaign=...` parameters. The tracking code already captures them.

---

### What I Would NOT Do

- **Redesign the multi-step flow** — sample size is too small to know if steps 2–9 are problematic. The drop at step 1 overwhelms everything else.
- **Add more analytics** — the tracking is now working well. Let it collect 2–3 more weeks of data before adding complexity.
- **Optimize for desktop** — 85% of your traffic is mobile. Focus there.

---

## Implementation Plan

Two changes, both scoped and low-risk:

1. **Add a floating "Build Your Quote" CTA on mobile motor selection page** — appears after the user scrolls past 2+ motor cards. Sticky bottom bar with a clear action button. Small component addition.

2. **Add a lightweight email capture component on the motor selection page** — "Want pricing updates? Enter your email." Single input, stores to `email_sequence_queue` or a new lightweight leads table. Shows after ~15 seconds or on scroll.

Both are front-end only, no backend changes needed (email capture writes to existing tables). Combined, these address the one signal that's statistically meaningful: mobile users browse motors and leave without engaging further.

