

## Add Missing Motor Option Rules for Tow N Stow Covers and Verado Running Cover

### Problem
8 motor options exist in the `motor_options` table but have **no rules and no direct assignments**, so they never appear on the Options page for any motor selection.

### Fix
Insert `motor_option_rules` entries for each item, matching the same pattern used by the existing vented running covers and service kits.

### SQL Migration

A single migration will insert 8 new rows into `motor_option_rules`:

| Option | Part # | assignment_type | hp_min | hp_max | motor_family |
|---|---|---|---|---|---|
| Tow N Stow (40-60HP FourStroke) | 8M0221490 | available | 40 | 60 | FourStroke |
| Tow N Stow (75-115HP FourStroke) | 8M0221491 | available | 75 | 115 | FourStroke |
| Tow N Stow (150HP FourStroke) | 8M0221492 | available | 140 | 160 | FourStroke |
| Tow N Stow (175-225HP FourStroke) | 8M0221495 | available | 175 | 225 | FourStroke |
| Tow N Stow (200-300HP FourStroke) | 8M0221496 | available | 200 | 300 | FourStroke |
| Tow N Stow (200-300HP Pro XS) | 8M0221499 | available | 200 | 300 | ProXS |
| Tow N Stow (225-400HP Verado) | 8M0221494 | available | 225 | 400 | -- (no family filter, or Verado-specific if the family value exists) |
| Vented Cover (300HP L6 Verado) | 8M0228517 | available | 300 | 300 | -- (Verado family if applicable) |

**Note on Verado**: The existing rule conditions use `motor_family` values of `FourStroke` and `ProXS`. If Verado motors use a different family value in the `motors` table, the rule conditions will need to match it. If they are stored as `FourStroke`, we may need to add a secondary condition or leave the family filter off for these two items.

### Steps
1. Check what `family` value Verado motors use in the `motors` table
2. Create a single SQL migration inserting 8 `motor_option_rules` rows
3. Verify by navigating to the Options page with a motor in each HP range to confirm Tow N Stow covers now appear alongside vented running covers

### No code changes needed
The `useMotorOptions` hook already handles rule-based matching correctly -- it just needs the rules to exist in the database.

