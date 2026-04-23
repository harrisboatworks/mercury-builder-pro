

## Fix iOS bottom-bar gap on `UnifiedMobileBar`

### Why the gap happens

On iOS Safari, the bottom mobile bar (`UnifiedMobileBar`, rendered globally in `App.tsx`) is `position: fixed; bottom: 0`. iOS Safari has two well-known behaviors that cause the visible gap you saw in the screenshot:

1. **URL bar collapse/expand jitter**: When Safari's bottom toolbar slides in/out during scroll, the `fixed` bar momentarily detaches from the visual bottom while the layout viewport recomputes. You briefly see white space below the bar.
2. **Rubber-band overscroll**: When you flick past the end of the page, iOS lifts the entire fixed element with the document, exposing whatever is underneath. The current "overscroll shield" `<div className="absolute top-full h-[120px] bg-white">` sits *inside* the fixed bar, so it lifts with it instead of staying glued to the screen bottom.
3. **Safe-area padding** is currently applied via inline style, which works but doesn't protect against the two issues above.

### What to change

All edits in `src/components/quote-builder/UnifiedMobileBar.tsx` (and a small `index.css` rule). No behavior or layout changes — only stability/anchoring.

**1. Replace the inside-the-bar overscroll shield with a body-level one.**
- Remove the current `<div className="absolute … top-full h-[120px] bg-white" />` from inside the fixed bar.
- Render a separate sibling `<div>` with `position: fixed; left: 0; right: 0; bottom: -120px; height: 120px; background: white; z-index: 79;` (one less than the bar). This shield stays anchored regardless of how the bar shifts, so any rubber-band gap is filled with the same white as the bar.

**2. Add an iOS-specific bottom anchoring fix.**
In `src/index.css`, inside the existing `@supports (-webkit-touch-callout: none)` iOS block, add a rule for the bar's wrapper that forces GPU compositing and uses `translateZ(0)` plus `will-change: transform`. This stabilizes the fixed element against URL-bar reflow on iOS:
```css
.ios-fixed-bottom {
  transform: translateZ(0);
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
```
Add `className="ios-fixed-bottom"` to the bar's outer fixed `<div>`.

**3. Use `100dvh`-aware bottom anchoring.**
Wrap the bar in a small layer that uses `bottom: 0` but also sets `padding-bottom: max(env(safe-area-inset-bottom), 0px)` via a CSS class (rather than inline `style`) so it's deterministic across re-renders. No visual change — just consolidates safe-area handling.

**4. Verify no parent uses `transform`/`filter`.**
A `transform` on any ancestor of a `position: fixed` element re-roots it to that ancestor, which on iOS amplifies the gap. The bar is mounted in `App.tsx` directly under the router providers — already safe — but I'll grep ancestors to confirm and document.

### Files touched

- `src/components/quote-builder/UnifiedMobileBar.tsx` — restructure overscroll shield, add `ios-fixed-bottom` class, move safe-area padding to a class.
- `src/index.css` — add `.ios-fixed-bottom` rule inside the iOS `@supports` block; add a `body::after` background-fill safety only if needed.

### Verification

Manual test plan to walk through after the change:
1. Open homepage `/` on an iPhone, scroll up and down rapidly to trigger Safari URL-bar collapse → bar should stay glued to bottom, no white gap.
2. Flick-scroll past the bottom of the page (rubber-band) → shield fills any exposed area with white matching the bar.
3. Rotate device portrait↔landscape → safe-area inset still respected, no gap.
4. Repeat on a route with the bar in a different state (e.g. `/quote/options` with a motor selected) → same behavior.
5. Confirm desktop and Android Chrome are unaffected (the new CSS is gated by `@supports (-webkit-touch-callout: none)`, iOS-only).

### Risk

Very low. All changes are additive or swap one positioning approach for an equivalent one. No state, routing, or analytics touched. If the shield introduces any visual artifact on a specific route, it's a one-line revert.

