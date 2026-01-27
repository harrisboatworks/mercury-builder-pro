
# Fix: Dark Mode Heading Visibility on Boat Info Page

## Problem

In dark mode, several headings and card elements on the Boat Details Wizard page are nearly invisible because they use hardcoded light-mode colors (`text-gray-900`, `bg-gray-50`) without corresponding `dark:` variant overrides.

### Affected Elements (from screenshot)
- "Boat Details Wizard" main heading (has override - OK)
- "What type of boat do you have?" question label
- Boat type card headings (e.g., "Pontoon", "V-Hull Fishing")
- Boat type card backgrounds
- "Not Sure?" help button heading and text
- Help content headings

---

## Files to Modify

| File | Purpose |
|------|---------|
| `src/components/quote-builder/BoatInformation.tsx` | Add dark mode text colors to headings and card backgrounds |

---

## Changes

### 1. Boat Type Card Headings (Line 575)
**Current:**
```tsx
<h3 className="font-light tracking-wide text-base md:text-lg text-gray-900">{type.label}</h3>
```

**Fixed:**
```tsx
<h3 className="font-light tracking-wide text-base md:text-lg text-gray-900 dark:text-gray-100">{type.label}</h3>
```

### 2. Boat Type Card Backgrounds (Line 562)
**Current:**
```tsx
className={`group relative rounded-2xl border-2 p-4 bg-gray-50 text-left ... ${boatInfo.type === type.id ? 'border-red-600 bg-red-50' : 'border-gray-200'}`}
```

**Fixed:**
```tsx
className={`group relative rounded-2xl border-2 p-4 bg-gray-50 dark:bg-gray-800 text-left ... ${boatInfo.type === type.id ? 'border-red-600 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-700'}`}
```

### 3. Card Image Container (Line 563)
**Current:**
```tsx
className="mb-3 h-32 md:h-40 overflow-hidden rounded-md flex items-center justify-center bg-white"
```

**Fixed:**
```tsx
className="mb-3 h-32 md:h-40 overflow-hidden rounded-md flex items-center justify-center bg-white dark:bg-gray-900"
```

### 4. "Not Sure?" Button Heading (Line 603)
**Current:**
```tsx
<h3 className="font-light tracking-wide text-gray-900">Not Sure?</h3>
```

**Fixed:**
```tsx
<h3 className="font-light tracking-wide text-gray-900 dark:text-gray-100">Not Sure?</h3>
```

### 5. Help Content Heading (Line 610)
**Current:**
```tsx
<h4 className="font-light tracking-wide text-gray-900 mb-3">Let's figure out your boat type together!</h4>
```

**Fixed:**
```tsx
<h4 className="font-light tracking-wide text-gray-900 dark:text-gray-100 mb-3">Let's figure out your boat type together!</h4>
```

---

## Summary of All Class Changes

| Line | Element | Add Classes |
|------|---------|-------------|
| 562 | Boat type card container | `dark:bg-gray-800`, `dark:bg-red-950/30`, `dark:border-gray-700` |
| 563 | Card image container | `dark:bg-gray-900` |
| 575 | Boat type label `<h3>` | `dark:text-gray-100` |
| 603 | "Not Sure?" heading | `dark:text-gray-100` |
| 610 | Help content heading | `dark:text-gray-100` |

---

## Expected Result

After these changes, all headings and cards on the Boat Details Wizard will have proper contrast in dark mode, making them clearly visible and readable.
