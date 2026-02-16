

## Fix: Infographic Image Not Clickable on Repower Page

### Root Cause
In `src/components/ui/expandable-image.tsx`, the hover overlay div (line 70) with the expand icon covers the entire image (`absolute inset-0`). It sits on top of the `<img>` element, so all clicks land on the overlay -- but the overlay has no `onClick` handler. The `onClick={handleImageClick}` is only on the `<img>` underneath, which never receives the click.

### Fix
**File: `src/components/ui/expandable-image.tsx`**

Add `onClick={handleImageClick}` to the overlay div at line 70, so clicking anywhere on the image (including the overlay) opens the lightbox. This is a one-line change.

```
// Line 70: add onClick
<div 
  className="absolute inset-0 flex items-center justify-center ..."
  onClick={handleImageClick}  // <-- add this
>
```

Alternatively (and more cleanly), add `pointer-events-none` to the overlay so clicks pass through to the image. Either approach works; adding the click handler to the overlay is simpler and more intuitive since users expect to click the expand icon itself.

### Files Changed
1. **`src/components/ui/expandable-image.tsx`** -- Add `onClick={handleImageClick}` to the overlay div (line 70)

