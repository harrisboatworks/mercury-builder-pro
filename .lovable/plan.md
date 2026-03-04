

## Duplicate Battery Prompt: Analysis and Fix

### The Problem

The battery question appears **twice** in the flow:

1. **Options Page** (`/quote/options`) — Clean `BatteryOptionPrompt` card asking "Would you like to add a starting battery?" with Yes/No selection. User's choice is saved to `state.looseMotorBattery`.

2. **Package Selection Page** (`/quote/packages`) — The "Complete" and "Premium" packages **automatically include** a battery cost (`$179.99`) for all non-manual-start motors (`batteryCost` on line 151), regardless of what the user chose on the Options page. The "Essential" package separately references the user's Options page choice via `looseMotorBatteryCost`.

This means:
- If the user said **"Yes, add battery"** on Options, the Essential package charges them for it, AND the Complete/Premium packages charge them again (double-counting).
- If the user said **"No, I have my own"** on Options, the Complete/Premium packages still add a battery cost — contradicting their choice.

### The Fix

**On PackageSelectionPage**, the battery logic for Complete/Premium packages should respect the user's choice from the Options page instead of unconditionally adding `batteryCost`:

- **Line 151**: `const batteryCost = !isManualStart ? 179.99 : 0;` — This should check `state.looseMotorBattery` when on the `loose` path. If the user already said "No", don't add a battery. If they said "Yes", don't double-add (it's already in `looseMotorBatteryCost`).
- **Lines 228-232**: The Complete package features list says "Marine starting battery ($180 value)" unconditionally for non-manual-start motors. This should only show if a battery is actually being included.
- **Line 219**: Essential package shows "Customer supplies battery (if needed)" when `looseMotorBatteryCost === 0` — this is correct behavior.

**Concrete changes to `src/pages/quote/PackageSelectionPage.tsx`:**

1. Update `batteryCost` calculation (line 151) to account for loose path battery choice:
   - If `purchasePath === 'loose'` and user declined battery → `batteryCost = 0`
   - If `purchasePath === 'loose'` and user accepted battery → battery is already in `looseMotorBatteryCost`, so `batteryCost = 0` for Complete/Premium to avoid double-counting
   - If `purchasePath === 'installed'` → keep existing logic (battery included in Complete/Premium as an upgrade perk)

2. Update Complete package features (line 232) to conditionally show battery line item based on whether it's actually being added.

3. Update Premium package price calculation (line 246) accordingly.

No other files need changes — the Options page battery prompt is working correctly.

