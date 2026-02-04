

# Trade-In Valuation Database Migration Plan

## Overview

Migrate the hardcoded trade-in valuation data from `src/lib/trade-valuation.ts` to Supabase tables, enabling admins to update market values without code deployments. This also adds support for 2025-2029 motors and updates the Mercury bonus logic.

---

## Current State Analysis

The trade-in valuation system is entirely hardcoded in `src/lib/trade-valuation.ts`:

| Component | Current Location | Issue |
|-----------|------------------|-------|
| Brand values (Mercury, Yamaha, Honda, Suzuki, Evinrude) | Lines 60-382 | ~320 lines of hardcoded data |
| Year brackets | `2020-2024`, `2015-2019`, `2010-2014`, `2005-2009` | Missing 2025-2029 bracket |
| HP levels | 5, 10, 15, 20, 25, 40, 50, 60, 75, 90, 115, 150, 200, 250, 300 | Static per brand |
| Condition multipliers | excellent, good, fair, poor | Embedded in values |
| Brand penalties | Johnson: 50%, Evinrude: 50% | Lines 37-40 |
| Mercury bonus | 10% for year >= 2020 | Line 474 (outdated logic) |

**Problem:** In 2026, a 2025 motor gets mapped to the "2020-2024" bracket at line 419, undervaluing it by treating it like a 5-year-old motor instead of a 1-year-old one.

---

## Database Schema Design

### Table 1: `trade_valuation_brackets`
Stores condition-based values for each brand/year-range/HP combination.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  trade_valuation_brackets                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  id            UUID  PRIMARY KEY                                              │
│  brand         TEXT  NOT NULL         -- 'Mercury', 'Yamaha', etc.           │
│  year_range    TEXT  NOT NULL         -- '2025-2029', '2020-2024', etc.      │
│  horsepower    INTEGER NOT NULL       -- 5, 10, 15, 20, 25, etc.             │
│  excellent     NUMERIC NOT NULL       -- Value in CAD                        │
│  good          NUMERIC NOT NULL       -- Value in CAD                        │
│  fair          NUMERIC NOT NULL       -- Value in CAD                        │
│  poor          NUMERIC NOT NULL       -- Value in CAD                        │
│  created_at    TIMESTAMPTZ            -- Auto                                │
│  updated_at    TIMESTAMPTZ            -- Auto                                │
│  UNIQUE (brand, year_range, horsepower)                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Table 2: `trade_valuation_config`
Stores global configuration (penalties, bonuses, min value).

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  trade_valuation_config                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│  key           TEXT  PRIMARY KEY      -- 'BRAND_PENALTY_JOHNSON', etc.       │
│  value         JSONB NOT NULL         -- { "factor": 0.5 } or { "value": 100 }│
│  description   TEXT                   -- Human-readable description          │
│  updated_at    TIMESTAMPTZ            -- Auto                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Configuration keys:**
- `BRAND_PENALTY_JOHNSON` → `{ "factor": 0.5 }`
- `BRAND_PENALTY_EVINRUDE` → `{ "factor": 0.5 }`
- `MERCURY_BONUS_YEARS` → `{ "max_age": 3, "factor": 1.1 }` (motors < 3 years old get 10% bonus)
- `MIN_TRADE_VALUE` → `{ "value": 100 }`

---

## Implementation Steps

### Phase 1: Database Setup

1. **Create migration file** with:
   - `trade_valuation_brackets` table with indexes on (brand, year_range)
   - `trade_valuation_config` table
   - RLS policies (public read, admin write)
   - Seed data migration from current hardcoded values

2. **Seed the 2025-2029 bracket** with ~10-15% higher values than 2020-2024:
   - Mercury 115HP excellent: $12,100 (was $11,000 for 2020-2024)
   - Apply similar increases across all brands/HP

3. **Insert configuration rows** for penalties and bonuses

### Phase 2: Frontend Data Layer

4. **Create React Query hook** `useTradeValuationData()`:
   - Fetches brackets and config on app load
   - Caches for 1 hour (stale-while-revalidate)
   - Provides fallback to current hardcoded values if fetch fails

5. **Update `src/lib/trade-valuation.ts`**:
   - Accept optional `brackets` and `config` parameters
   - Fall back to hardcoded values when database data is unavailable
   - Update Mercury bonus: check if `(currentYear - year) < config.max_age`

### Phase 3: Valuation Logic Updates

6. **Fix year bracket matching**:
   ```text
   Current (broken):
   if (year >= 2020) → yearRange = '2020-2024'
   
   Updated:
   if (year >= 2025) → yearRange = '2025-2029'
   else if (year >= 2020) → yearRange = '2020-2024'
   ```

7. **Update Mercury bonus logic**:
   ```text
   Current (outdated):
   if (brand === 'Mercury' && year >= 2020) → 10% bonus
   
   Updated:
   const maxAge = config.MERCURY_BONUS_YEARS.max_age || 3
   if (brand === 'Mercury' && (currentYear - year) < maxAge) → 10% bonus
   ```

### Phase 4: Admin UI (Optional Enhancement)

8. **Add admin interface** for editing values:
   - Read/write to `trade_valuation_brackets`
   - Edit configuration in `trade_valuation_config`
   - Preview impact before saving

---

## 2025-2029 Market Values

Based on ~10% appreciation from 2020-2024 bracket (reflecting newer inventory holding value):

| Brand | HP | Excellent | Good | Fair | Poor |
|-------|-----|-----------|------|------|------|
| Mercury | 5 | $880 | $715 | $550 | $330 |
| Mercury | 10 | $1,540 | $1,265 | $990 | $605 |
| Mercury | 25 | $3,520 | $2,860 | $2,200 | $1,320 |
| Mercury | 115 | $12,100 | $9,900 | $7,700 | $4,620 |
| Mercury | 150 | $15,950 | $13,200 | $10,450 | $6,270 |
| Mercury | 300 | $28,600 | $23,100 | $18,150 | $10,890 |
| Yamaha | 115 | $11,000 | $8,800 | $6,820 | $4,070 |
| Honda | 115 | $10,560 | $8,470 | $6,600 | $3,960 |
| Suzuki | 115 | $9,570 | $7,700 | $5,940 | $3,575 |

*(Full table will include all HP levels for all brands)*

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/XXXXXX_trade_valuation_tables.sql` | **Create** - Schema + seed data |
| `src/integrations/supabase/types.ts` | **Auto-regenerate** after migration |
| `src/hooks/useTradeValuationData.ts` | **Create** - React Query hook for data |
| `src/lib/trade-valuation.ts` | **Modify** - Accept database data, fix year logic |
| `src/components/quote-builder/TradeInValuation.tsx` | **Modify** - Use hook, pass data to estimator |

---

## Technical Details

### RLS Policies

```sql
-- Public can read (needed for quote builder)
CREATE POLICY "Public read access" ON trade_valuation_brackets
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage" ON trade_valuation_brackets
  FOR ALL USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

### React Query Hook Pattern

```typescript
export function useTradeValuationData() {
  return useQuery({
    queryKey: ['trade-valuation-data'],
    queryFn: async () => {
      const [brackets, config] = await Promise.all([
        supabase.from('trade_valuation_brackets').select('*'),
        supabase.from('trade_valuation_config').select('*')
      ]);
      return { brackets: brackets.data, config: config.data };
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
```

### Fallback Strategy

If database fetch fails, the valuation system will:
1. Log a warning to console
2. Continue using the hardcoded fallback values
3. Ensure zero downtime for users

---

## Expected Outcomes

1. **Immediate**: 2025-2026 motors valued correctly (~10% higher than 2020 models)
2. **Ongoing**: Admins can update values in Supabase without deployments
3. **Mercury bonus**: Now targets motors < 3 years old (dynamic, not hardcoded year)
4. **Data integrity**: Hardcoded fallback ensures the system works even if DB is unavailable

