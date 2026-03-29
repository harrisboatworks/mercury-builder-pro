

# Export Trade Valuation Bracket Data to CSV

## What
Export all 257 bracket rows for Yamaha, Honda, Suzuki, Tohatsu, Evinrude, and Johnson from the `trade_valuation_brackets` table as a clean CSV file you can plug directly into the other HBW trade value tool.

## How
Run a single `psql` COPY command to export directly to `/mnt/documents/trade_valuation_brackets_export.csv`:

```sql
COPY (
  SELECT brand, year_range, horsepower, excellent, good, fair, poor
  FROM trade_valuation_brackets
  WHERE brand IN ('Yamaha','Honda','Suzuki','Tohatsu','Evinrude','Johnson')
  ORDER BY brand, year_range, horsepower
) TO STDOUT WITH CSV HEADER
```

## Output
- **File**: `trade_valuation_brackets_export.csv`
- **Columns**: `brand, year_range, horsepower, excellent, good, fair, poor`
- **Rows**: 257 (all 6 brands x year ranges x HP classes)

Ready to import into any system — same structure as the `trade_valuation_brackets` table schema.

