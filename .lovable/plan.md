
# Fix: Dark Mode Resistant Headings on Boat Info Page

## Problem
The headings on the Boat Details Wizard page ("Boat Details Wizard", "What type of boat do you have?", boat type labels, etc.) appear nearly invisible because:
1. Browser extensions or OS-level dark mode force color inversion
2. The `text-gray-900` Tailwind class gets inverted to light gray
3. The `dark:` overrides added earlier never fire because `ThemeProvider` forces light mode

## Solution
Make headings **resistant to forced dark mode** by:
1. Using high-specificity CSS with explicit color values
2. Adding a global CSS rule that protects critical text from inversion
3. Removing ineffective `dark:` classes (they never fire)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/index.css` | Add forced color protection for headings |
| `src/components/quote-builder/BoatInformation.tsx` | Apply protected heading class + remove dead `dark:` overrides |

---

## Implementation

### 1. Add Global Dark Mode Resistant Heading Styles (src/index.css)

Add CSS that protects important headings from browser-based dark mode inversion:

```css
/* After line 20 - Protect headings from forced dark mode inversion */
/* These headings must remain visible regardless of browser dark mode extensions */
.heading-protected,
.heading-protected h1,
.heading-protected h2,
.heading-protected h3,
.heading-protected h4,
.heading-protected label {
  color: hsl(222, 47%, 11%) !important;
  -webkit-text-fill-color: hsl(222, 47%, 11%) !important;
}

.text-protected {
  color: hsl(215, 16%, 47%) !important;
  -webkit-text-fill-color: hsl(215, 16%, 47%) !important;
}
```

### 2. Update BoatInformation.tsx Headings

Apply the protected classes and remove non-functional `dark:` overrides:

**Main Header (line 466-471):**
```tsx
<div className="text-center space-y-3 animate-fade-in heading-protected">
  <h2 className="text-3xl md:text-4xl font-light tracking-wide">Boat Details Wizard</h2>
  <p className="text-base md:text-lg font-light text-protected">
    Let's match your {selectedMotor?.model || 'Mercury motor'} to your boat, step by step.
  </p>
</div>
```

**Question Label (line 527-529):**
```tsx
<div className="text-center space-y-2 heading-protected">
  <Label className="text-2xl font-light tracking-wide">What type of boat do you have?</Label>
  <p className="font-light text-protected">Pick the closest match and enter your boat length.</p>
</div>
```

**Boat Type Card Headings (line 575):**
```tsx
<h3 className="font-light tracking-wide text-base md:text-lg heading-protected">{type.label}</h3>
```

**Other Section Headings:**
- Line 481: "Motor Only" heading
- Line 513: "Trade-In Valuation" heading  
- Line 520: "Ready to Continue" heading
- Line 603: "Not Sure?" heading
- Line 609: "Let's figure out your boat type" heading

All will get the `heading-protected` class wrapper or direct application.

---

## Summary of Changes

| Element | Current | After |
|---------|---------|-------|
| "Boat Details Wizard" | `text-gray-900 dark:text-gray-100` | `heading-protected` (CSS forces dark color) |
| "What type of boat..." | `text-gray-900 dark:text-gray-100` | `heading-protected` |
| Boat type labels | `text-gray-900 dark:text-gray-100` | `heading-protected` |
| Description text | `text-gray-600 dark:text-gray-300` | `text-protected` |
| "Not Sure?" | `text-gray-900 dark:text-gray-100` | `heading-protected` |

---

## Why This Works

1. **`!important`** overrides any browser-injected dark mode styles
2. **`-webkit-text-fill-color`** prevents WebKit browsers from inverting text color
3. **Explicit HSL values** are not affected by Tailwind's theme resolution
4. **Removing `dark:` classes** cleans up dead code that never executes

## Expected Result

All headings on the Boat Details Wizard will be clearly visible with high contrast, regardless of browser dark mode settings or extensions.
