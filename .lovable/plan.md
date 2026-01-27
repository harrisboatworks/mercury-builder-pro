
# Fix: Washed-Out / Milky Appearance on iOS Chrome (Site-Wide)

## Problem
Multiple pages appear "washed out" or have a pinkish/milky tint on iPhone Chrome. The issue is **not limited to QuoteLayout.tsx** — it's happening across the entire site.

## Root Cause
The problem is caused by `backdrop-blur` combined with semi-transparent backgrounds (`bg-white/80`, `bg-background/95`, etc.) on iOS Chrome. When these CSS filters are rendered on mobile Safari/Chrome, they cause GPU compositing artifacts that create a milky overlay effect.

**Affected patterns found:**
- `backdrop-blur-sm` / `backdrop-blur-md` / `backdrop-blur`
- `bg-white/80`, `bg-white/95`, `bg-background/80`, `bg-background/95`
- `opacity-95`, `opacity-100` conditionals

## Files Requiring Changes

| File | Issue | Fix |
|------|-------|-----|
| `src/pages/Index.tsx` (line 380) | Header uses `bg-background/95 backdrop-blur` | Remove backdrop-blur, use solid `bg-white` |
| `src/pages/Dashboard.tsx` (line 36) | Header uses `bg-white/80 backdrop-blur-sm` | Use solid `bg-white` on mobile |
| `src/pages/Login.tsx` (line 115) | Card uses `bg-white/80 backdrop-blur-sm` | Use solid `bg-white` on mobile |
| `src/pages/NotFound.tsx` (lines 40-41) | Has `blur-3xl` gradient orbs | Add `hidden md:block` to hide on mobile |
| `src/components/quote-builder/QuoteBuilder.tsx` (line 157) | Header uses `bg-white/95 backdrop-blur-sm` | Use solid `bg-white` on mobile |
| `src/components/quote-builder/MotorSelection.tsx` (line 1174) | Sticky bar uses `bg-background/95 backdrop-blur-sm` | Use solid `bg-white` on mobile |
| `src/components/ui/mobile-header.tsx` (line 30) | Uses `bg-white/95 backdrop-blur-sm` | Use solid `bg-white` |

## Solution Strategy

**Global CSS fix** — Add mobile-specific overrides that disable backdrop-blur on small screens. This is the most efficient approach because it:
1. Fixes all existing instances in one place
2. Prevents future components from having the same issue
3. Preserves the desktop glassmorphism effect

### Change 1: Add global mobile blur override to `src/index.css`

```css
/* iOS Chrome: Disable backdrop-blur on mobile to prevent milky/washed-out rendering */
@media (max-width: 1024px) {
  .backdrop-blur,
  .backdrop-blur-sm,
  .backdrop-blur-md,
  .backdrop-blur-lg,
  .backdrop-blur-xl,
  .backdrop-blur-2xl,
  .backdrop-blur-3xl,
  [class*="backdrop-blur"] {
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
  }
  
  /* Force solid backgrounds on mobile for elements that had transparency */
  .bg-white\/80,
  .bg-white\/90,
  .bg-white\/95,
  .bg-background\/80,
  .bg-background\/90,
  .bg-background\/95 {
    background-color: hsl(0, 0%, 100%) !important;
  }
}
```

### Change 2: Hide blur-3xl gradient orbs on mobile in `src/pages/NotFound.tsx`

Wrap the ambient orbs in a container with `hidden md:block`:

```tsx
{/* Ambient glassmorphism orbs - Desktop only */}
<div className="hidden md:block">
  <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
  <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
</div>
```

---

## Why This Works

1. **Global Override**: The CSS rule catches ALL instances of `backdrop-blur-*` on screens < 1024px and disables the filter
2. **Solid Fallbacks**: Semi-transparent whites become solid white, eliminating color blending artifacts
3. **Desktop Preserved**: The glassmorphism effect remains on desktop where it renders correctly
4. **Future-Proof**: Any new components using these classes will automatically be fixed on mobile

## Expected Result

- **Mobile (iPhone Chrome)**: Clean, solid white backgrounds with no milky tint
- **Desktop**: Preserved glassmorphism/blur effects for the premium aesthetic
- **No visual design changes** — just removes rendering artifacts on mobile
