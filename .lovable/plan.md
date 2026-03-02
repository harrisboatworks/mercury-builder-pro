

## Add Propeller Allowance to All Packages (HP-Based Pricing)

### Problem
The propeller allowance line item is missing from Essential and Complete packages entirely. For Premium, it's hardcoded at $299.99 "Aluminum" regardless of HP. Per the established pricing rules:
- **Under 25HP**: $0 (propeller included with motor)
- **25-115HP**: $350 Aluminum propeller allowance
- **150HP+**: $1,200 Stainless Steel propeller allowance

The installation labor ($450 for remote motors on installed path) IS already showing correctly.

### Changes

**1. Create a propeller allowance helper** (can be inline or a small function)

A function `getPropellerAllowance(hp)` returning `{ price, name, description }`:
- `hp < 25` → price: 0 (prop included, no line item needed)
- `25 <= hp <= 115` → price: 350, name: "Propeller Allowance (Aluminum)", description: "Standard aluminum propeller — final selection after water test"
- `hp >= 150` → price: 1200, name: "Propeller Allowance (Stainless Steel)", description: "Stainless steel propeller — final selection after water test"

**2. `src/pages/quote/QuoteSummaryPage.tsx`** — Add propeller allowance to `accessoryBreakdown`
- After the controls/installation section (~line 375), add a propeller allowance line item for ALL packages when `!includesProp` and HP >= 25
- Remove the existing Premium-only prop logic at lines 386-393 (replace with the universal allowance)
- The allowance amount must also be added to the pricing total calculation at line 266

**3. `src/pages/quote/PackageSelectionPage.tsx`** — Update package pricing and features
- Replace the hardcoded `299.99` prop cost in the Premium package (line 239) with the HP-based amount
- Add propeller allowance to Essential and Complete package `priceBeforeTax` calculations (lines 205, 221)
- Update feature text in all three packages to mention the propeller allowance with correct type (Aluminum vs Stainless Steel)

**4. PDF flow** — No changes needed, since the PDF renders whatever `accessoryBreakdown` contains

### Summary of pricing impact
For a 150HP+ motor, this adds $1,200 to the quote as a visible "Propeller Allowance (Stainless Steel)" line item across all packages. For 25-115HP, $350 appears. Under 25HP, no change (prop already included).

