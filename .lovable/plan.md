
# Fix Contact Icons - Force Horizontal Display

## The Problem

Looking at the screenshot, the contact icons (Phone, Email, Location) are still displaying vertically stacked in a single centered column, not in a 3-column horizontal row. The `grid-cols-3` is being applied but something is preventing it from rendering correctly.

## Root Cause Analysis

The code has `grid grid-cols-3` but the icons are still stacking. This could be caused by:
1. The Card having constrained width or flexbox centering that overrides the grid
2. Each link element taking full width somehow
3. CSS specificity or container constraints

## Solution

Add explicit styling to ensure the grid works correctly:

### File: `src/components/quote-builder/ScheduleConsultation.tsx`

**Line 885** - Add explicit width and ensure grid-cols-3 is enforced:

```tsx
// Before
<div className="grid grid-cols-3 gap-2 md:gap-6">

// After - force full width and ensure proper grid behavior
<div className="w-full grid grid-cols-3 gap-2 md:gap-6">
```

**Lines 886-900** - Simplify the link structure to prevent stacking issues:

```tsx
// Phone - simpler structure, flex-row always on mobile with icon + text side by side
<a href="tel:9053422153" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition-colors">
  <Phone className="w-5 h-5 text-muted-foreground" />
  <span className="text-xs font-light">Phone</span>
</a>

// Email - same pattern
<a href="mailto:info@harrisboatworks.ca" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition-colors">
  <Mail className="w-5 h-5 text-muted-foreground" />
  <span className="text-xs font-light">Email</span>
</a>

// Location - same pattern  
<a href="https://maps.google.com/..." target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition-colors">
  <MapPin className="w-5 h-5 text-muted-foreground" />
  <span className="text-xs font-light">Location</span>
</a>
```

Key changes:
1. Add `w-full` to ensure grid container spans full width
2. Remove the hidden `<span>` with phone number/email - it was interfering with the flex layout
3. Simplify each link to just icon + label stacked vertically
4. Add `p-2` for better touch targets

## Expected Result

Three tappable columns side by side on mobile:
```
[📞]     [✉️]      [📍]
Phone    Email    Location
```

## File to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/ScheduleConsultation.tsx` | Simplify contact links structure and add w-full to grid |
