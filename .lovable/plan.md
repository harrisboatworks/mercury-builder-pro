

# Fix: Mobile Washed Out / Pink Tint Issue

## Problem
The site appears "washed out" with a pinkish-beige tint on iPhone Chrome. All UI elements look faded and have a pink overlay.

## Root Cause Analysis

Two elements are combining to cause this issue:

### 1. Header `opacity-95` (Primary Culprit)
When the page first loads (not scrolled), the header has `opacity-95`:

```tsx
// src/components/ui/luxury-header.tsx:64-68
className={`... ${
  isScrolled 
    ? 'shadow-sm backdrop-blur-md opacity-100' 
    : 'opacity-95'  // ← This makes header semi-transparent
}`}
```

On iOS Chrome, this partial transparency triggers GPU compositing issues with the blurred background elements.

### 2. Ambient Gradient Orbs (Secondary Culprit)
The `QuoteLayout` has three fixed-position blurred gradient circles:

```tsx
// src/components/quote-builder/QuoteLayout.tsx:35-39
<div className="bg-blue-100/40 blur-3xl" />
<div className="bg-purple-100/30 blur-3xl" />
<div className="bg-emerald-100/20 blur-3xl" />
```

When these overlapping colors (blue + purple + emerald) are viewed through the `opacity-95` header on iOS, they blend into an unexpected **pinkish wash**.

---

## Solution

Make two targeted changes:

### Change 1: Remove `opacity-95` from header
**File:** `src/components/ui/luxury-header.tsx`

Replace the opacity-based approach with solid white at all times:

```tsx
// Before (line 64-68):
className={`sticky top-0 z-50 ... ${
  isScrolled 
    ? 'shadow-sm backdrop-blur-md opacity-100' 
    : 'opacity-95'
}`}

// After:
className={`sticky top-0 z-50 ... ${
  isScrolled 
    ? 'shadow-sm backdrop-blur-md' 
    : ''
}`}
```

The header is already `bg-white`, so the opacity was only adding a subtle "floating" effect that's not worth the mobile rendering bugs.

### Change 2: Hide gradient orbs on mobile
**File:** `src/components/quote-builder/QuoteLayout.tsx`

Add `hidden md:block` so the decorative orbs only render on desktop:

```tsx
// Before (line 35):
<div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

// After:
<div className="hidden md:block fixed inset-0 -z-10 overflow-hidden pointer-events-none">
```

This removes the blur-3xl elements on mobile where they cause GPU artifacts.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/ui/luxury-header.tsx` | Remove `opacity-95` class from header |
| `src/components/quote-builder/QuoteLayout.tsx` | Add `hidden md:block` to gradient orbs container |

---

## Expected Result

- Mobile: Clean, solid white background with crisp UI
- Desktop: Retains subtle glassmorphism aesthetic with gradient orbs
- No visible change to the overall design intent

