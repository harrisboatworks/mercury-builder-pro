

# Add Missing 90 ELPT CT and 50 ELPT CT Motors

## Context
Both models exist in the pricing CSVs and were in the original seed migration, but the audit showed they're missing from `motor_models`. Same situation as the 40 ELPT CT we just fixed.

## Plan
Single migration to INSERT both motors with correct field values (learning from the 40 CT mistake — set `model`, `model_display`, and `display_name` properly, not just "Outboard").

### 50 ELPT Command Thrust FourStroke — `1F51453GZ`
| Field | Value |
|-------|-------|
| model_number | 1F51453GZ |
| display | 50 ELPT Command Thrust FourStroke |
| HP | 50 |
| MSRP | $12,645 |
| Dealer price | $11,127 |
| has_command_thrust | true |
| has_power_trim | true |
| Rigging code | ELPT |
| model_key | FS_50_ELPT_CT |

### 90 ELPT Command Thrust FourStroke — `1F904532D`
| Field | Value |
|-------|-------|
| model_number | 1F904532D |
| display | 90 ELPT Command Thrust FourStroke |
| HP | 90 |
| MSRP | $17,355 |
| Dealer price | $15,274 |
| has_command_thrust | true |
| has_power_trim | true |
| Rigging code | ELPT |
| model_key | FS_90_ELPT_CT |

## SQL (via insert tool — uses ON CONFLICT to skip if already present)
```sql
INSERT INTO motor_models (
  model, model_display, display_name, model_number,
  horsepower, family, motor_type, make, year, is_brochure,
  has_command_thrust, has_power_trim, rigging_code,
  msrp, dealer_price, model_key, availability
) VALUES
(
  '50 ELPT Command Thrust FourStroke',
  '50 ELPT Command Thrust FourStroke',
  '50 ELPT Command Thrust FourStroke',
  '1F51453GZ', 50, 'FourStroke', 'Outboard', 'Mercury', 2025, true,
  true, true, 'ELPT', 12645, 11127, 'FS_50_ELPT_CT', 'Brochure'
),
(
  '90 ELPT Command Thrust FourStroke',
  '90 ELPT Command Thrust FourStroke',
  '90 ELPT Command Thrust FourStroke',
  '1F904532D', 90, 'FourStroke', 'Outboard', 'Mercury', 2025, true,
  true, true, 'ELPT', 17355, 15274, 'FS_90_ELPT_CT', 'Brochure'
)
ON CONFLICT (model_number) DO NOTHING;
```

Also fix the existing 40 CT's `model` field (currently set to `'Outboard'`):
```sql
UPDATE motor_models
SET model = '40 ELPT Command Thrust FourStroke'
WHERE model_number = '1F41453GZ' AND model = 'Outboard';
```

## Files Changed
| File | Change |
|------|--------|
| New migration | INSERT 50 + 90 ELPT CT motors, fix 40 CT model field |

