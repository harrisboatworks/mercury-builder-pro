

# Priority 2: Reduce Installation Config Friction

## Problem
50% drop-off. Users face 2 sequential questions about controls and steering with no shortcut. Technical terms like "Side-Mount" and "Binnacle" can cause hesitation despite the "Most Common" badges.

## Changes

### 1. Add "Not sure? Use recommended settings" shortcut button
**File: `InstallationConfig.tsx`**
- Add a prominent button below the header: "Not sure? Use the most common setup"
- Clicking it auto-selects Side-Mount Control + Cable Steering (the "Most Common" tagged options) and triggers completion immediately
- Reduces the 2-step flow to 1 click for uncertain users

### 2. Improve helper text on choices
**File: `visualChoices.ts`**
- Side-Mount: "Most boats have this — a lever on the side of the console"
- Binnacle: "A lever mounted on top of the console — common on center consoles"
- Cable Steering: "Standard on most boats under 150HP"
- Hydraulic Steering: "Common on boats over 150HP or with larger motors"

### 3. Pre-highlight the recommended option
**File: `OptionGallery.tsx`**
- Add optional `recommended` prop (value string) to OptionGallery
- When set, show a subtle pulsing border or "Recommended" indicator on the matching card (distinct from selected state)
- This gives a visual nudge without auto-selecting

### Files Modified
- `src/components/quote-builder/InstallationConfig.tsx` — add skip button, pass recommended values
- `src/config/visualChoices.ts` — update helper text
- `src/components/OptionGallery.tsx` — add `recommended` prop with visual indicator

