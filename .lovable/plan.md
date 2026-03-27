

# Generate Trade-In Valuation Rules Document

## Task
Create a comprehensive markdown reference document at `/mnt/documents/trade-in-valuation-rules.md` summarizing all trade-in valuation logic, brand penalties, adjustments, floors, and configuration options currently implemented in the system.

## Content to Include

1. **Two valuation paths**: MSRP-anchored (Mercury only, 1-20 years old) and Bracket-based (all brands, fallback)
2. **MSRP anchor logic**: Median selling price by default, Max selling price for electric-start motors
3. **Age brackets**: 1-3yr, 4-7yr, 8-12yr, 13-17yr, 18-20yr (MSRP path); 5-year ranges for bracket path
4. **Brand penalties**: Mercury (1.0), Yamaha (0.92), Honda/Suzuki/Tohatsu (0.7), Johnson/Evinrude/OMC/Mariner/Force/Other (0.5)
5. **Engine type adjustments**: 2-stroke/OptiMax penalty (default 17.5%)
6. **Engine hours adjustments**: ≤100h bonus (+7.5%), 500-999h moderate penalty (-10%), 1000h+ severe penalty (-17.5%)
7. **HP-class floors**: Under 25HP ($200), 25-75HP ($1,000), 90-150HP ($1,500), 200HP+ ($2,500)
8. **Mercury bonus**: 10% bonus for motors under 3 years old (bracket path only)
9. **Confidence levels**: High/Medium/Low based on age and HP match accuracy
10. **Range calculation**: ±15% around base value, median rounded to nearest $25
11. **Pre-2005 motors**: Generic age-based formula with heavier depreciation
12. **Database configurability**: All values adjustable via `trade_valuation_config` table

## File
`/mnt/documents/trade-in-valuation-rules.md` — generated via script

