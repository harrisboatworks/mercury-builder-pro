
Fix the washed-out iPhone issue by treating it as a broader quote-flow rendering problem, not just a single page bug.

1. Remove the remaining fade-risk on first render
- Update `src/components/ui/page-transition.tsx` so iOS-safe rendering is decided immediately, not after mount.
- Right now the page can briefly render with `opacity: 0` before the effect flips to safe mode, which can leave the screen looking faded on iPhone browsers.

2. Hard-stop animated fade layers inside Boat Info
- Audit `src/components/quote-builder/BoatInformation.tsx` and remove/replace the repeated `animate-fade-in` containers on mobile/iOS.
- Convert key sections to static or transform-only reveal so the boat selection / boat info step never relies on opacity animation.

3. Replace semi-transparent quote surfaces with solid mobile surfaces
- In `BoatInformation.tsx`, replace important `bg-muted/30`, tinted alert backgrounds, and similar translucent panels with solid light backgrounds on mobile/iOS.
- This is especially important in the boat-type picker and follow-up detail panels, where stacked translucent layers can look milky on iPhone.

4. Tighten CSS targeting instead of broad guesses
- Refine `src/index.css` so the quote flow has explicit “safe surface” rules for:
  - `PageTransition` wrapper
  - boat-info cards/panels
  - purchase-path cards
  - progress/header wrappers
- Keep the fixes specific to quote pages and mobile/iOS so desktop styling is preserved.

5. Verify the actual affected flow
- Re-check these steps specifically:
  - `/quote/purchase-path`
  - `/quote/boat-info` boat selection section
- Compare the shared wrappers between them, since the issue is likely coming from common layout/animation behavior rather than only one component.

Technical findings
- `PageTransition` still starts with animated opacity for one render before `useEffect` detects iOS.
- `BoatInformation.tsx` still contains many `animate-fade-in` sections and translucent `bg-muted/30` containers.
- `PurchasePath.tsx` itself is now mostly solid, so the remaining faded look likely comes from shared wrappers or the Boat Info step rather than that card component alone.

Expected result
- Boat selection / boat info on iPhone should render fully solid immediately, with no washed-out first paint.
- The quote flow should stop regressing page-to-page because the fix will cover the shared transition layer and the remaining translucent content panels.
