
# Fix Contact Icons Layout - Display Horizontally

## The Problem

On the `/quote/schedule` page, the contact buttons (Phone, Email, Location) are stacked vertically on mobile. This looks awkward and takes up too much vertical space.

## Current Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
```

- Mobile: Single column (stacked vertically)
- Desktop: Three columns (side-by-side)

## Solution

Change the grid to always use 3 columns, with responsive styling adjustments:

1. Use `grid-cols-3` at all screen sizes
2. Center the icons and text within each column
3. Stack icon above label on mobile for better fit
4. Show full contact details only on larger screens (already working with `hidden md:inline`)

## Changes

### File: `src/components/quote-builder/ScheduleConsultation.tsx`

**Line 885** - Update grid classes:

```tsx
// Before
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">

// After - always 3 columns, centered content
<div className="grid grid-cols-3 gap-2 md:gap-6">
```

**Lines 886-900** - Update each contact link to center content and stack on mobile:

```tsx
// Phone link - centered with flex-col on mobile
<a href="tel:9053422153" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 hover:text-primary transition-colors text-center">
  <Phone className="w-5 h-5 text-muted-foreground" />
  <span className="text-xs md:text-sm font-light">Phone</span>
</a>

// Email link - same pattern
<a href="mailto:info@harrisboatworks.ca" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 hover:text-primary transition-colors text-center">
  <Mail className="w-5 h-5 text-muted-foreground" />
  <span className="text-xs md:text-sm font-light">Email</span>
</a>

// Location link - same pattern
<a href="..." className="flex flex-col md:flex-row items-center gap-1 md:gap-2 hover:text-primary transition-colors text-center">
  <MapPin className="w-5 h-5 text-muted-foreground" />
  <span className="text-xs md:text-sm font-light">Location</span>
</a>
```

## Expected Result

| Mobile | Desktop |
|--------|---------|
| 📞 Phone &nbsp;&nbsp; ✉️ Email &nbsp;&nbsp; 📍 Location | Same, with full details visible |

Three compact, tappable icons in a row on mobile - similar to the contact modal pattern used elsewhere in the app.

## File to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/ScheduleConsultation.tsx` | Update grid layout and link styling (lines 885-900) |
