
# Fix: "null value in column 'id'" Error When Creating New Option

## Problem
When creating a new motor option, the error appears:
> "null value in column 'id' of relation 'motor_options' violates not-null constraint"

## Root Cause
The `handleSubmit` function creates an option object with `id: editingOption?.id`. When creating a NEW option (not editing), `editingOption` is `null`, so `id` becomes `undefined`. 

When this object is passed to `supabase.insert()`, Supabase converts `undefined` to `null`, which violates the database's not-null constraint on the `id` column.

**Current code (line 159-160):**
```typescript
const option: MotorOption = {
  id: editingOption?.id,  // undefined for new options!
  ...
};
```

**In mutation (lines 118-122):**
```typescript
const { error } = await supabase
  .from('motor_options')
  .insert([option]);  // Includes id: undefined → null
```

## Solution
Remove the `id` field from the object when inserting a new record. The database will auto-generate a UUID.

### Option 1: Exclude `id` when inserting (Recommended)

Modify the mutation to destructure out the `id` field before inserting:

```typescript
const saveMutation = useMutation({
  mutationFn: async (option: MotorOption) => {
    if (option.id) {
      const { error } = await supabase
        .from('motor_options')
        .update(option)
        .eq('id', option.id);
      if (error) throw error;
    } else {
      // Remove id from the object before inserting
      const { id, ...optionWithoutId } = option;
      const { error } = await supabase
        .from('motor_options')
        .insert([optionWithoutId]);
      if (error) throw error;
    }
  },
  ...
});
```

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/admin/options/MotorOptionsCatalog.tsx` | Destructure out `id` before insert to let database auto-generate it |

## Why This Works
- For **updates**: We use the existing `id` to find and update the record
- For **inserts**: We exclude `id` entirely, allowing the database to generate a new UUID automatically
- No changes needed to the form or state logic
