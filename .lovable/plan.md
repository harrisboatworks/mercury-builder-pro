

# Fix: MobileQuoteDrawer Crash on iPhone

## Problem

When tapping the motor info card in the `UnifiedMobileBar` on iPhone, the `MobileQuoteDrawer` (vaul drawer) opens but the page crashes entirely. This is a known issue with **vaul v0.9.x** and `shouldScaleBackground: true` (the default) on iOS Safari.

## Root Cause

The `Drawer` component in `src/components/ui/drawer.tsx` defaults `shouldScaleBackground = true`. When the `MobileQuoteDrawer` opens:

1. **Vaul tries to scale `document.body`** by applying a CSS transform, but the `UnifiedMobileBar` is `position: fixed` with `z-index: [80]` and uses `env(safe-area-inset-bottom)` — this combination causes iOS Safari's rendering engine to crash or produce a blank white screen.
2. The drawer is rendered **inside** a fixed-position parent (`UnifiedMobileBar`), and vaul's portal + body scaling conflicts with iOS's compositing of fixed elements with safe-area insets.
3. Additionally, the `pb-24` (96px padding-bottom) on the scrollable content area inside the drawer can push content below the viewport on smaller iPhones, causing layout thrashing during the open animation.

## Fix (3 files)

### 1. `src/components/quote-builder/MobileQuoteDrawer.tsx`
- Pass `shouldScaleBackground={false}` to the `Drawer` — this prevents vaul from applying the body transform that crashes iOS Safari.
- Change `pb-24` to `pb-8` with a safe-area spacer at the bottom, so content doesn't overflow on small screens.

### 2. `src/components/ui/drawer.tsx`
- Change the default `shouldScaleBackground` from `true` to `false` globally. The background-scaling feature is cosmetic and causes consistent iOS issues across multiple drawers in the app. This is a safer default.

### 3. `src/components/quote-builder/UnifiedMobileBar.tsx`
- No code change needed — the drawer is already rendered outside the fixed bar's visual hierarchy via portal, but the fix in the drawer component resolves the crash.

## What This Does NOT Change
- All drawer functionality, animations, and content remain identical
- Desktop dialog behavior is unaffected
- Other drawers (filter sheet, comparison, financing) benefit from the safer default

