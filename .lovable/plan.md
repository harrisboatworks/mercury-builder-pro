
# Fix: Comprehensive Dark Mode Resistance for Boat Details Wizard

## Problem Analysis

From the screenshots, multiple elements on the Boat Details Wizard page are invisible or barely visible:

1. **Boat type card headings** - "V-Hull Fishing", "Pontoon" labels
2. **Card descriptions** - "Deep V-hull fishing boats", "Family & entertainment"
3. **Recommended HP text** - "Recommended: 40-150 HP"
4. **Skip buttons** - "Skip this step - Use typical settings for 60HP", "Skip for now"
5. **Navigation buttons** - "Back to Motor", "NEXT: TRANSOM HEIGHT"
6. **Tip text** - "Tip: You can tap a preset above to speed things up."
7. **Various form labels** and descriptions

## Root Cause

The `dark:` Tailwind classes (e.g., `dark:text-gray-300`) only work when the `dark` class is on the HTML element. Since the ThemeProvider forces light mode, these never fire.

Browser extensions/OS dark mode use color inversion which inverts `text-gray-600` to nearly invisible light gray on the (now dark) inverted background.

## Solution

Expand the protection CSS classes and apply them more comprehensively:

1. Add more protected text classes with varying gray levels
2. Add card/background protection
3. Add button text protection
4. Remove non-functional `dark:` classes to reduce code clutter

---

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Add more protected classes: `.text-protected-subtle`, `.bg-protected`, `.button-protected` |
| `src/components/quote-builder/BoatInformation.tsx` | Apply protection classes to all remaining unprotected elements |

---

## Changes

### 1. Expand CSS Protection Classes (src/index.css)

Add after line 36:

```css
/* Additional protection for secondary text */
.text-protected-subtle {
  color: hsl(220, 9%, 46%) !important;
  -webkit-text-fill-color: hsl(220, 9%, 46%) !important;
}

/* Protection for light gray text like tips and hints */
.text-protected-muted {
  color: hsl(220, 13%, 55%) !important;
  -webkit-text-fill-color: hsl(220, 13%, 55%) !important;
}

/* Card/container background protection */
.bg-protected {
  background-color: hsl(220, 14%, 96%) !important;
}

.bg-protected-white {
  background-color: hsl(0, 0%, 100%) !important;
}

/* Button text protection */
.button-text-protected {
  color: hsl(222, 47%, 11%) !important;
  -webkit-text-fill-color: hsl(222, 47%, 11%) !important;
  border-color: hsl(222, 47%, 11%) !important;
}

/* Accent text protection (like primary blue) */
.text-protected-primary {
  color: hsl(211, 48%, 29%) !important;
  -webkit-text-fill-color: hsl(211, 48%, 29%) !important;
}
```

### 2. Update BoatInformation.tsx Elements

**Boat Type Card Descriptions (line 576-579):**
```tsx
<div className="boat-details mt-1 space-y-0.5">
  <span className="block text-sm md:text-base font-light text-protected-subtle">{type.description}</span>
  {type.recommendedHP && <span className="block text-xs md:text-sm text-protected-primary font-medium">Recommended: {type.recommendedHP} HP</span>}
</div>
```

**Selection Impact Text (line 580):**
```tsx
<div className="selection-impact mt-2 text-xs text-protected-subtle">
```

**Skip This Step Button (line 688-692):**
```tsx
<Button type="button" variant="ghost" size="sm" onClick={handleSkip} className="button-text-protected hover:opacity-80">
  Skip this step - Use typical settings for {hp || selectedMotor?.hp || '--'}HP
</Button>
```

**Navigation Buttons (line 1065-1081):**

Back/Previous button:
```tsx
<Button type="button" variant="outline" onClick={handlePrev} className="flex items-center justify-center gap-2 min-h-[44px] order-2 sm:order-1 border-2 button-text-protected font-light rounded-sm hover:bg-gray-900 hover:text-white transition-all duration-500">
```

Skip for now button:
```tsx
<Button type="button" variant="ghost" onClick={handleSkip} className="text-sm min-h-[44px] font-light button-text-protected hover:opacity-80">
```

Next/Submit buttons:
```tsx
<Button type="submit" className="border-2 border-gray-900 bg-gray-900 text-white px-8 py-4 text-xs tracking-widest uppercase font-light rounded-sm hover:bg-white hover:text-gray-900 transition-all duration-500" disabled={!canNext()}>
```

**Tip Text (line 1087-1089):**
```tsx
<div className="rounded-lg border border-border bg-protected p-4">
  <div className="text-sm text-protected-subtle">Tip: You can tap a preset above to speed things up.</div>
</div>
```

**Other Labels and Descriptions:**
- Form labels: Add `heading-protected` class
- Helper text (line 701, 726, 749, etc.): Replace `text-gray-500` with `text-protected-subtle`
- Slider labels (line 732, 736): Replace `text-gray-600 dark:text-gray-300` with `text-protected-subtle`
- Alert descriptions: Replace `text-gray-600 dark:text-gray-300` with `text-protected-subtle`

### 3. Remove Non-Functional `dark:` Classes

Throughout the file, remove all `dark:` variant classes since they never fire and add clutter:
- `dark:bg-gray-800`, `dark:bg-gray-900`, `dark:bg-red-950/30` on cards
- `dark:border-gray-700`, `dark:border-gray-100` on borders
- `dark:text-gray-100`, `dark:text-gray-300`, `dark:text-gray-400` on text
- `dark:hover:text-gray-100`, `dark:hover:bg-gray-100` on hover states
- `dark:bg-orange-950/20`, `dark:bg-blue-950/20` on alerts

---

## Summary Table

| Element | Current | After |
|---------|---------|-------|
| Card descriptions | `text-gray-600 dark:text-gray-300` | `text-protected-subtle` |
| Recommended HP | `text-primary` | `text-protected-primary` |
| Skip buttons | `text-gray-600 dark:text-gray-300` | `button-text-protected` |
| Back/Next buttons | `border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100` | `button-text-protected` |
| Tip text | `text-gray-600 dark:text-gray-300` | `text-protected-subtle` |
| Helper text | `text-gray-500` | `text-protected-subtle` |
| Slider labels | `text-gray-600 dark:text-gray-300` | `text-protected-subtle` |
| Card backgrounds | `bg-gray-50 dark:bg-gray-800` | `bg-protected` |

---

## Expected Result

All text, buttons, and cards on the Boat Details Wizard page will remain clearly visible with proper contrast regardless of browser dark mode extensions or OS-level dark mode settings.
