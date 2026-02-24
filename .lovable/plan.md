

# Add Customer Guidance to Installation Config Selections

## What's Changing

Add contextual direction so customers understand they're describing what's **already on their boat**, plus reassurance that it's okay if they're unsure.

## Changes

### 1. Update page intro text (`InstallationConfig.tsx`)

Replace the current generic subtitle with something like:

> "Tell us what rigging is currently on your boat — we'll confirm everything during your consultation."

### 2. Add a "Not sure?" reassurance note

Below the steering step (or as a subtle note at the bottom), add a small message:

> "Not sure what you have? No worries — just pick your best guess and we'll sort it out when we see the boat."

This will be a simple muted text line, not a full alert banner.

### 3. Update helper descriptions (`visualChoices.ts`)

Make the helpers more descriptive so customers can identify what they have:

**Controls:**
- Side-Mount: "Lever on the side of your console" (was "Mounts on side of console")
- Binnacle: "Lever mounted on top of your console" (was "Top-mount throttle/shift")

**Steering:**
- Cable: "Standard mechanical steering — most common on smaller boats" (was "Mechanical cable system")
- Hydraulic: "Power-assisted steering — common on larger boats" (was "Smooth hydraulic control")

### 4. Update step titles

Change from directive ("Choose Your Control System") to descriptive:
- Step 1: "What type of controls does your boat have?"
- Step 2: "What type of steering does your boat have?"

## Files to Edit

- `src/config/visualChoices.ts` — Updated helper text
- `src/components/quote-builder/InstallationConfig.tsx` — Updated intro text, step titles, and "not sure" note

