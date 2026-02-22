

# Fix: Washed Out / Faded Boat Info Page on Mobile

## Problem
The Boat Info step (Step 4) looks faded and washed out on iPhone. The root cause is the "dark mode protection" CSS classes that force low-contrast gray colors:

- `bg-protected` forces `hsl(220, 14%, 96%)` (very light gray) on card backgrounds
- `text-protected` forces `hsl(215, 16%, 47%)` (medium gray) for body text
- `text-protected-subtle` forces `hsl(220, 9%, 46%)` for descriptions
- `heading-protected` forces `hsl(222, 47%, 11%)` which is fine for headings
- Combined with `border-gray-200` on cards and `font-light` everywhere, the whole page reads as washed out

On a phone screen at outdoor brightness, these low-contrast grays are especially hard to read.

## Solution
Increase contrast across the board by darkening text colors and making backgrounds crisper, while keeping the dark-mode protection approach intact.

### 1. Darken the protected text utility classes
**File:** `src/index.css`

| Class | Current | New |
|-------|---------|-----|
| `.text-protected` | `hsl(215, 16%, 47%)` (47% lightness) | `hsl(215, 20%, 30%)` (30% lightness) |
| `.text-protected-subtle` | `hsl(220, 9%, 46%)` | `hsl(220, 12%, 35%)` |
| `.text-protected-muted` | `hsl(220, 13%, 55%)` | `hsl(220, 13%, 45%)` |
| `.bg-protected` | `hsl(220, 14%, 96%)` | `hsl(0, 0%, 100%)` (white, crisper) |

This improves readability without changing the overall design language.

### 2. Strengthen boat type card borders and text
**File:** `src/components/quote-builder/BoatInformation.tsx`

- Change card border from `border-gray-200` to `border-gray-300` for unselected cards
- Change the page subtitle from `text-protected` to `text-protected-subtle` (which will now be darker)
- The "Recommended: XX HP" text already uses `text-protected-primary` which is fine

### 3. Bump font weight on key labels
**File:** `src/components/quote-builder/BoatInformation.tsx`

- Boat type name: change from `font-light` to `font-normal` so it stands out
- "What type of boat do you have?" heading is already good
- Description text: keep `font-light` but the darker color from step 1 will make it readable

## Technical Details

### Files to modify:
1. **`src/index.css`** (lines 33-52) -- darken the 4 protected color utility classes
2. **`src/components/quote-builder/BoatInformation.tsx`** (line 554) -- change `border-gray-200` to `border-gray-300`, and (line 567) change `font-light` to `font-normal` on boat type headings

### Impact
- All pages using these protected classes will get the contrast boost (consistent improvement across the site)
- No layout changes, no structural changes
- Selected state (red border) stays the same

