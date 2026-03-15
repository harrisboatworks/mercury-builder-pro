

# Fix: Washed-Out Pages After Opening Admin Quotes on iPhone

## Problem

After opening a saved admin quote on iPhone, pages appear faded/washed out. Works fine in incognito. The issue is **leaked body styles** from modal scroll locks that persist across programmatic navigation.

## Root Cause

Six components set `document.body.style.position = 'fixed'` and `overflow = 'hidden'` when they open. On iOS Safari, when the `SavedQuotePage` triggers programmatic navigation (`navigate('/quote/summary')`), React cleanup effects for any open modal can fail to fire. This leaves body styles stuck, collapsing the viewport and making everything look washed out.

The existing `ScrollToTop` component **detects** this (`bodyStyle.position === 'fixed'` on line 70) but then **skips** the scroll-to-top instead of fixing it -- making the problem worse by leaving the bad state in place.

Additionally, the cinematic reveal plays unnecessarily on admin quote restores, adding a z-9999 compositing layer that can leave rendering artifacts on iOS.

## Fix (2 files)

### 1. `src/components/ui/ScrollToTop.tsx`
- On every route change, **force-reset** stale body styles before scrolling:
  - Clear `document.body.style.position`, `.overflow`, `.top`, `.width`
  - Remove `data-scroll-y` attribute
  - Remove `chat-drawer-open` class from `documentElement`
- **Remove** the early return on line 70 that currently skips when body is locked -- instead, fix it and proceed

### 2. `src/pages/quote/QuoteSummaryPage.tsx`
- In the cinematic gate (line ~109), add: skip when `state.isAdminQuote === true`
- Admin-restored quotes don't need the reveal animation, and its z-9999 layer causes iOS rendering artifacts

## What stays the same
- No modal components are modified
- Desktop behavior unchanged
- Cinematic still plays for normal customer flows
- All drawer/sheet functionality intact

