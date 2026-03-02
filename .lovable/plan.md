

## Two Inventory Issues

### Issue 1: Missing 115 ELPT FourStroke

The database has **no** `115 ELPT FourStroke` (standard, non-Command Thrust) motor. The 115 HP FourStroke variants that exist are:

| model_display | availability |
|---|---|
| 115ECXLPT FourStroke | Exclude |
| 115ELPT Command Thrust FourStroke | In Stock |
| 115EXLPT Command Thrust FourStroke | NULL (visible) |

The standard `115 ELPT FourStroke` and `115 EXLPT FourStroke` models are listed in the dealer price CSV (model numbers `1115F132D` and `1115F232D`) but were never inserted into `motor_models`. Similarly, `115 ELPT Command Thrust` and `115 EXLPT Command Thrust` exist but not the base models.

**Fix**: Insert the two missing 115 FourStroke base models into `motor_models` using data from the dealer price CSV:

- **115ELPT FourStroke** — model number `1115F132D`, MSRP $19,220, dealer price $16,913
- **115EXLPT FourStroke** — model number `1115F232D`, MSRP $19,625, dealer price $17,270

Both set to `availability = NULL` (standard catalog/brochure items), `family = 'FourStroke'`, `in_stock = false`.

### Issue 2: 15 EHPT FourStroke should be excluded

The motor `15EHPT FourStroke` (id: `e7eef4eb-...`) currently has `availability = NULL`, making it visible on the public site. 

**Fix**: Update its availability to `'Exclude'`.

### Implementation

Single database migration with two statements:
1. `INSERT` the two missing 115 ELPT/EXLPT FourStroke rows
2. `UPDATE` the 15 EHPT FourStroke to `availability = 'Exclude'`

No code changes needed — the existing filter logic already handles `Exclude` and `NULL` availability correctly.

