

# Fix Misleading "Pre-selected" Badge on Recommended Add-Ons

## Problem
The "Recommended Add-Ons" section header always shows a "Pre-selected" badge, but only items with `is_included` (e.g., fuel tanks on small motors) are actually pre-selected. For motors like the 200 ELPT ProXS, the SmartCraft Connect Mobile appears under "Recommended" but is NOT pre-selected — making the badge deceptive.

## Fix
**File: `src/pages/quote/OptionsPage.tsx` (~line 345)**

Conditionally show the badge based on whether any recommended options are actually pre-selected (i.e., have `is_included === true`):

- If at least one recommended option has `is_included`, show the "Pre-selected" badge
- Otherwise, show no badge (or a softer label like "Suggested")

This is a single-line conditional change in the `OptionsSection` rendering for the recommended section.

