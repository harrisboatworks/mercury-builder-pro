

# Generate Trade-In Valuation Rules Document

## What
Create a comprehensive markdown reference document at `/mnt/documents/trade-in-valuation-rules.md` that documents every calculation, rule, and configuration option in the trade-in valuation engine — written so someone could reimplement it from scratch.

## Document Structure

1. **Overview** — Two-path architecture (MSRP-anchored vs bracket-based)
2. **Input Parameters** — All fields the estimator accepts
3. **Path 1: MSRP-Anchored (Mercury only)** — Age brackets, condition percentages, MSRP lookup, electric-start anchoring
4. **Path 2: Bracket-Based** — Year ranges, HP lookup, Mercury bonus
5. **Fallback Paths** — Unknown brand (tiered base formula), Pre-2005 motors
6. **Adjustments (apply to all paths)** — 2-stroke/OptiMax penalty, engine hours bonus/penalty
7. **Brand Penalty System** — All brand factors, config override keys
8. **HP-Class Floors** — Minimum values by HP range
9. **Display Rounding** — Median rounded to $25
10. **Confidence Levels** — How confidence is determined
11. **Database Configuration** — All config keys and their schemas
12. **Worked Examples** — Step-by-step calculations for common scenarios

## File
| File | Action |
|------|--------|
| `/mnt/documents/trade-in-valuation-rules.md` | Create — full reference document |

