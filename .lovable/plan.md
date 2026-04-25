## Audit findings (per-issue) and fix plan

### 1 + 2 + 3 + 4 — Block "Continue" until required selections are made

**Finding.** The desktop OptionsPage footer already disables Continue when battery choice is required (`disabled={!canContinue}` on line 436). But the **global mobile sticky bar** (`UnifiedMobileBar.tsx`) only disables on `!hasMotor` (line 1420), and `handlePrimary` blindly navigates to the next page from `PAGE_CONFIG`. That means on mobile a user can tap the bottom "Continue" / "Boat Info" CTA and skip past:

- `/quote/options` when battery choice is required and not made (electric-start motor)
- `/quote/purchase-path` before picking Loose vs Installed
- `/quote/boat-info` before any boat type or "Not Sure" was chosen

`BoatInformation.tsx` has its own internal `canNext()` gate for in-component step buttons (line 433), but the **global** sticky bar bypasses it.

**Fix.** Add a single `getPageGate(pathname, state)` helper inside `UnifiedMobileBar.tsx` that returns `{ disabled: boolean, reason?: string }`, then:

1. Wire `disabled={!hasMotor || gate.disabled}` on the primary CTA button (line 1420).
2. In `handlePrimary` (line 899), early-return + `toast.error(gate.reason)` if `gate.disabled`.
3. Apply the existing `disabled:opacity-40 disabled:bg-gray-400 disabled:shadow-none` styles (already in place on line 1426) so the visual state matches the validation state (covers issue #5).

Gate rules:
- `/quote/options`: disabled when `hasElectricStart(state.motor?.model)` is true AND `state.looseMotorBattery?.wantsBattery` is `null/undefined`. Reason: "Choose a battery option to continue".
- `/quote/purchase-path`: disabled when `!state.purchasePath`. Reason: "Pick Loose Motor or Professional Install".
- `/quote/boat-info`: disabled when `!state.boatInfo?.type` (covers both real type selection and the "Not Sure / Skip" path, since `handleSkip` in `BoatInformation.tsx` line 403 sets `type: 'utility'` before submitting). Reason: "Pick a boat type or tap Not Sure".
- `/quote/trade-in`: leave as-is (already optional via "Skip Trade-In" label).
- All other pages: `disabled: false`.

Also add the same check in `GlobalStickyQuoteBar.handlePrimary` (`src/components/quote/GlobalStickyQuoteBar.tsx`) so desktop tablets ≥ md get the same gating, by passing `disabled` through to `StickyQuoteBar` and gating its primary button. (`StickyQuoteBar` doesn't currently take a `disabled` prop — add one and wire the button.)

### 5 — Disabled vs active visuals

Already declared on `UnifiedMobileBar` button (line 1426: `disabled:opacity-40 disabled:bg-gray-400 disabled:shadow-none`). No styling change needed — fix is purely propagating the correct `disabled` boolean (covered by #1-4 fix).

For `StickyQuoteBar` (desktop), add matching `disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed` classes to its primary button when the new `disabled` prop is true.

### 6 — Console errors

**a) Failed Mercury image URLs.** `src/lib/mercury-product-images.ts` builds URLs against `https://www.mercurymarine.com/content/dam/mercury-marine/...` which 404s frequently (Mercury rotates these paths). It's used as the *7th-tier* fallback in `motor-helpers.ts` line 776. Fix: when the CDN URL 404s the browser logs an error. Either:
- (preferred, minimal) Skip this tier entirely and go straight to the local `/lovable-uploads/...` placeholder. Change `priority 7` block in `motor-helpers.ts` to no-op (or only return when a verified local override exists).
- Also remove the `getMotorImages(...).galleryImages` fallback in `MotorSelectionPage.tsx` line 517 so it returns `[]` instead of stale CDN URLs.

**b) Google Place data error.** `useGooglePlaceData.ts` line 133 logs `console.error(...)` on any failure. The edge function works (see logs), so the error is rare — but downgrade the log level: change `console.error` → `console.warn` so transient failures don't appear as errors. Also wrap the `supabase.functions.invoke` call so a network error returns `null` quietly instead of throwing inside React Query (already retries once).

**c) Conversation init.** `useChatPersistence.ts` line 112 logs `console.error('Failed to initialize conversation:', error)` when the user is anonymous and RLS blocks insert (expected). Downgrade to `console.warn` and add a guard: if error code is `42501` / 'new row violates row-level security policy', skip silently — chat still works locally without persistence.

### 7 — Per-page SEO

Confirmed in the audit:
- `/promotions` already uses `<PromotionsPageSEO promotions={promotions}>` (Promotions.tsx line 327) which emits title, description, canonical, OG title/description, Twitter card, and JSON-LD (FAQPage + OfferCatalog).
- `/blog` uses `<BlogIndexSEO />` with title, description, canonical, OG, Twitter, JSON-LD CollectionPage + ItemList.
- `/blog/:slug` uses `<BlogSEO article={article} />` (BlogArticle.tsx line 226).

No changes required for #7. (Will spot-confirm `BlogSEO` includes canonical + OG image + Article JSON-LD when implementing — if any field is missing, add it.)

### 8 — Viewport meta

`index.html` line 14 currently:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```
Change to:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
Removes both `maximum-scale=1.0` and `user-scalable=no` so iOS/Android pinch-zoom works (accessibility win).

---

### Files I will edit

1. `src/components/quote-builder/UnifiedMobileBar.tsx` — add `getPageGate`, wire `disabled` on CTA button, gate `handlePrimary`, toast on blocked tap.
2. `src/components/quote/GlobalStickyQuoteBar.tsx` — compute `disabled` for `/quote/purchase-path`, `/quote/boat-info`, `/quote/options`, pass to `StickyQuoteBar`.
3. `src/components/quote/StickyQuoteBar.tsx` — accept new `disabled` prop, apply to primary button + visual styles.
4. `src/lib/motor-helpers.ts` — remove or short-circuit Priority 7 Mercury CDN fallback.
5. `src/pages/quote/MotorSelectionPage.tsx` — drop `getMotorImages(...).galleryImages` fallback; use empty array.
6. `src/hooks/useGooglePlaceData.ts` — `console.error` → `console.warn`.
7. `src/hooks/useChatPersistence.ts` — `console.error` → `console.warn` + RLS-error guard.
8. `index.html` — remove `maximum-scale=1.0, user-scalable=no` from viewport meta.

### What I will NOT change

- `BoatInformation.tsx` — already gates internal "next" buttons via `canNext()`. The global bar fix is enough.
- `PurchasePath.tsx` — selecting a tile fires `onSelectPath` and `PurchasePathPage` immediately navigates. The new global gate just prevents users from tapping the *bottom bar* "Boat Info" CTA before clicking a tile.
- `OptionsPage.tsx` desktop footer — already gated correctly.
- Promotions / blog SEO components — already complete.

### Risk

Very low. All gating changes are additive (button is currently *too permissive*, becomes *correctly* disabled). Image fallback removal can only make image loading the same or quieter (the 7th-tier URLs were already 404ing). Viewport change is universally safe and improves a11y. Console log downgrade is purely cosmetic.

### Test plan after implementation

1. Mobile + desktop: open `/quote/motor-selection` → pick a 9.9 EH motor → land on `/quote/options` → confirm bottom "Continue" stays grey/disabled until "Yes, add battery" or "No, I have my own" is tapped.
2. Continue → `/quote/purchase-path`: bottom "Boat Info" stays disabled until a tile is tapped.
3. Continue → `/quote/boat-info`: bottom "Continue" stays disabled until a boat type or "Not Sure / Skip" is tapped.
4. Open DevTools console: confirm no `console.error` from google-places, conversation init, or Mercury CDN images on a fresh load of `/`.
5. Mobile Safari: pinch-zoom now works on `/`.
6. View-source on `/promotions` and `/blog`: confirm `<title>`, `<meta name=description>`, `<link rel=canonical>`, OG tags, and JSON-LD are present.

