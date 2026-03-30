

# Add Missing 40 ELPT Command Thrust Motor

## Problem
Mercury's 40 ELPT Command Thrust (Four-Cylinder) FourStroke — model `1F41453GZ` — exists in both pricing CSVs but was never inserted into `motor_models`. Customers searching for Command Thrust 40HP won't find it.

## Fix
Single migration to INSERT the missing motor with correct pricing, flags, and metadata.

### Key values from pricing data
| Field | Value |
|-------|-------|
| Model number | 1F41453GZ |
| Display | 40 ELPT Command Thrust FourStroke |
| MSRP | $11,250 |
| Dealer price | $9,900 |
| HP | 40 |
| Family | FourStroke |
| has_command_thrust | true |
| has_power_trim | true |
| Rigging code | ELPT |
| Shaft | L (20") |

## File

| File | Change |
|------|--------|
| New migration | INSERT the 40 ELPT CT motor into `motor_models` with availability set to `NULL` (standard brochure catalog item, visible on site) |

