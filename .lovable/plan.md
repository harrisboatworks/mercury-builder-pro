# Solid header on every page except `/`

`RepowerHeader` already supports a `solid` prop that disables the scroll listener and locks the header to solid navy-900. The fix is to plumb that prop through `RepowerLayout` and use it everywhere except the home page.

## Changes

### 1. `src/components/repower/RepowerLayout.tsx`
Add a `solidHeader?: boolean` prop and forward it to `RepowerHeader`.

```tsx
export function RepowerLayout({ children, solidHeader = false }: { children: ReactNode; solidHeader?: boolean }) {
  return (
    <div className="min-h-screen bg-[#050E1C]">
      <RepowerHeader solid={solidHeader} />
      {children}
    </div>
  );
}
```

### 2. Non-home pages using `RepowerLayout`
Pass `solidHeader`:
- `src/pages/quote/MotorSelectionPage.tsx` → `<RepowerLayout solidHeader>`
- `src/pages/Repower.tsx` → `<RepowerLayout solidHeader>`

`src/pages/Index.tsx` (the `/` route) stays as-is — no `solidHeader` prop, preserving the existing transparent-fades-to-solid scroll behavior over the video hero.

### 3. Other pages that should also get the unified solid header
The brief lists `/about`, `/contact`, `/faq`, `/financing`, `/trade-in-value`, `/promotions`, `/blog`, blog detail. Today these mostly use `LuxuryHeader` (or page-specific headers), not `RepowerHeader`, so they don't show the same nav at all. To satisfy "same lockup, same nav links, same hover states, same height across every page," we'll wrap each of these page roots with `<RepowerLayout solidHeader>` and remove their existing `<LuxuryHeader />` usage:

- `src/pages/About.tsx` (or wherever the About route renders — confirmed via routing)
- `src/pages/Contact.tsx`
- `src/pages/FAQ.tsx`
- `src/pages/TradeInValuePage.tsx`
- `src/pages/Blog.tsx`
- `src/pages/BlogArticle.tsx`
- Promotions page
- Financing calculator page
- `src/pages/Locations.tsx` and `src/pages/LocationDetail.tsx` (currently use `LuxuryHeader`) — same treatment for consistency

For each: replace the outer `<div>...<LuxuryHeader />...</div>` with `<RepowerLayout solidHeader>...</RepowerLayout>`, and add `pt-20` (or equivalent) to the first content block so it clears the fixed header — matching how `MotorSelectionPage` already does it.

### 4. No changes to `RepowerHeader.tsx`
The `solid` prop logic already short-circuits the scroll listener and forces the solid navy background. Nothing to change there.

## Result
- `/` — unchanged: transparent gradient over hero, fades to solid navy on scroll past 60px.
- Every other route — solid `#050E1C` navy header from first paint, no scroll transition, same lockup + nav + Build Quote button + height.
