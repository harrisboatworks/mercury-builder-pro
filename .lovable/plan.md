
Goal: fix the remaining washed-out tiller installation page on iPhone/Chrome and properly redesign the Purchase Path step for mobile, with a real audit/verification pass instead of one-off CSS guesses.

What I found
- The tiller installation page still has opacity-based Framer Motion wrappers in `InstallationConfig.tsx`, and the card grid inside `OptionGallery.tsx` also animates each option from `opacity: 0`. On iOS browsers, those layers are a likely source of the semi-transparent “washed out” rendering in your screenshot.
- The current “global light mode” CSS in `src/index.css` helps with dark mode, but it does not address component-level opacity animations and translucent overlays everywhere.
- `PurchasePath.tsx` is only mildly compressed. It is still two full cards with multiple bullets and full-size actions, which is why it still feels like the same step on mobile.
- The sticky mobile bar and progress/header stack consume a lot of vertical space, so mobile steps need to be designed with that constraint in mind, not just slightly tightened.

Implementation plan

1. Remove risky opacity animation from the tiller installation step
- In `src/components/quote-builder/InstallationConfig.tsx`:
  - remove the opacity-based motion wrappers around the tiller flow
  - render the tiller page as a plain static container on mobile/iOS, or use transform-only animation if we keep motion at all
- In `src/components/OptionGallery.tsx`:
  - stop animating option cards from transparent to visible
  - keep only safe micro-interactions like tap scale / border highlight / selected ring
  - ensure image card content uses solid white backgrounds and no semi-transparent overlays by default on mobile

2. Harden the iOS/mobile visual protection at the component level
- In `src/index.css`:
  - add a targeted mobile/iOS safeguard for quote-builder surfaces:
    - force solid backgrounds for quote pages, cards, stepper, and content wrappers
    - disable opacity/filter/backdrop effects on quote route containers where they can cause milky rendering
  - avoid broad destructive overrides, but explicitly protect:
    - quote page wrappers
    - option gallery cards
    - progress/header containers
    - sticky prompt areas that use translucent gradients
- If needed, add a reusable “ios-safe-surface” utility class and apply it to the most affected components.

3. Redesign Purchase Path specifically for mobile, not just “shrink desktop”
- In `src/components/quote-builder/PurchasePath.tsx`:
  - create a true mobile-first variant below `md`
  - reduce each choice to a compact decision card:
    - smaller image/header footprint
    - 2-3 short bullets max
    - tighter label hierarchy
    - full-width CTA always visible within each card
  - prioritize the information mobile users need to decide quickly:
    - Loose Motor: pickup, no install, included basics
    - Full Install: we rig it, test it, battery included
  - keep the richer premium desktop layout at `md+`
- This should make both choices visible much earlier and feel intentionally designed for phone.

4. Adjust page-level spacing on the affected quote steps
- In `PurchasePathPage.tsx` and `InstallationPage.tsx`:
  - reduce unnecessary top spacing on mobile
  - tighten back-button area and content margins
  - ensure the main card starts higher on screen
- If helpful, make the back button more compact on mobile while keeping the current desktop presentation.

5. Do an actual verification pass
- After implementation, verify both:
  - `/quote/installation` with a tiller motor
  - `/quote/purchase-path`
- Specifically check:
  - no washed-out/translucent rendering on the tiller install page
  - cards/backgrounds look solid in iPhone dark-mode browser conditions
  - Purchase Path shows materially less vertical bloat on mobile
  - CTAs remain visible above or close to above the sticky bar
- I also want to compare preview vs published/custom-domain behavior, because your screenshot suggests the mobile experience may differ from what earlier testing assumed.

Technical notes
- Primary likely culprit for the tiller issue: nested Framer Motion opacity transitions in `InstallationConfig.tsx` and `OptionGallery.tsx`.
- Current global dark-mode protection is necessary but not sufficient; the remaining issue appears to be transparency/compositing, not just theme inversion.
- Best fix pattern:
```text
Mobile/iOS quote pages
  -> solid surfaces
  -> no opacity-entry animations on content cards
  -> no translucent overlays unless absolutely necessary
  -> compact mobile-specific layout, not scaled desktop
```

Expected result
- The tiller installation step will render solid and stable on iPhone/Chrome instead of faded/milky.
- The Purchase Path step will feel genuinely mobile-optimized rather than “desktop cards squeezed onto a phone.”
- The quote flow will look more deliberate and professional on mobile, especially with the sticky bar present.

<lov-actions>
<lov-suggestion message="Test the tiller installation page and purchase path end-to-end on mobile, including iPhone dark mode in Chrome and Safari, and verify there is no washed-out rendering.">Verify that it works</lov-suggestion>
<lov-suggestion message="Implement the mobile-specific redesign for the Purchase Path page with compact cards, fewer bullets, and always-visible CTAs while keeping the richer desktop layout intact.">Redesign Purchase Path mobile</lov-suggestion>
<lov-suggestion message="Remove unsafe opacity-based animations from the tiller installation step and option gallery, and replace them with iOS-safe motion or static rendering.">Harden iOS rendering</lov-suggestion>
<lov-suggestion message="Add reusable iOS-safe surface utilities for quote pages so cards, headers, and sticky bars always render with solid backgrounds on mobile browsers.">Add iOS-safe UI utilities</lov-suggestion>
</lov-actions>
