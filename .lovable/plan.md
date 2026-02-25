

# Fix: Excluded Motors Appearing in Search Results

## Problem

The `AICommandBar` component (the global search/command bar) queries the `motor_models` table directly without filtering out motors with `availability = 'Exclude'`. This means excluded motors show up in search results even though they're properly hidden from the motor selection grid.

## Root Cause

In `src/components/chat/AICommandBar.tsx` (lines 112-116), the Supabase query searches motors by name but does not add `.neq('availability', 'Exclude')`:

```typescript
const { data: motors, error } = await supabase
  .from('motor_models')
  .select('id, model, model_display, horsepower, shaft, msrp, sale_price')
  .or(`model.ilike.%${query}%,model_display.ilike.%${query}%`)
  .limit(5);
```

## Fix

Add `.neq('availability', 'Exclude')` to the query in `AICommandBar.tsx` so excluded motors are filtered out of search results.

### File: `src/components/chat/AICommandBar.tsx`

Add the exclusion filter to the motor search query at line ~114:

```typescript
const { data: motors, error } = await supabase
  .from('motor_models')
  .select('id, model, model_display, horsepower, shaft, msrp, sale_price')
  .or(`model.ilike.%${query}%,model_display.ilike.%${query}%`)
  .neq('availability', 'Exclude')
  .limit(5);
```

This is a one-line addition. The other search paths (HybridMotorSearch, SearchOverlay, MotorSelectionPage) already receive pre-filtered motor lists and are not affected.

