
# Fix: Null Error When Adding Option in Motor Options Catalog

## Problem
When trying to add a new option on the Motor Options Catalog page, a "null error" occurs. The form submission fails because **Radix UI Select components don't integrate with native HTML FormData** like regular `<select>` elements.

## Root Cause
The current code uses `formData.get('category')`, `formData.get('is_active')`, and `formData.get('is_taxable')` to extract values from the form. However, Radix UI's `<Select>` component doesn't populate native form data — those calls return `null`.

**Current broken code (lines 143, 148, 149):**
```typescript
category: formData.get('category') as string,  // Returns null!
is_active: formData.get('is_active') === 'true',  // Always false!
is_taxable: formData.get('is_taxable') === 'true',  // Always false!
```

## Solution
Use React controlled state for the Select components instead of relying on native FormData. We'll track the selected values with `useState` hooks and read from state during form submission.

---

## Implementation Plan

### Step 1: Add controlled state for Select components

Add three new state variables to track the form values:

```typescript
const [formCategory, setFormCategory] = useState('accessory');
const [formIsActive, setFormIsActive] = useState(true);
const [formIsTaxable, setFormIsTaxable] = useState(true);
```

### Step 2: Reset state when opening the dialog

When opening the dialog (for new or editing), sync the state with the editing option:

```typescript
const openCreateDialog = () => {
  setEditingOption(null);
  setFormCategory('accessory');
  setFormIsActive(true);
  setFormIsTaxable(true);
  setIsDialogOpen(true);
};

const openEditDialog = (option: MotorOption) => {
  setEditingOption(option);
  setFormCategory(option.category);
  setFormIsActive(option.is_active);
  setFormIsTaxable(option.is_taxable);
  setIsDialogOpen(true);
};
```

### Step 3: Update Select components to use controlled values

Replace `defaultValue` with `value` and add `onValueChange`:

```tsx
<Select value={formCategory} onValueChange={setFormCategory}>
  ...
</Select>

<Select value={formIsActive ? 'true' : 'false'} onValueChange={(v) => setFormIsActive(v === 'true')}>
  ...
</Select>

<Select value={formIsTaxable ? 'true' : 'false'} onValueChange={(v) => setFormIsTaxable(v === 'true')}>
  ...
</Select>
```

### Step 4: Update handleSubmit to read from state

```typescript
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  
  const option: MotorOption = {
    id: editingOption?.id,
    name: formData.get('name') as string,
    description: formData.get('description') as string || null,
    short_description: formData.get('short_description') as string || null,
    category: formCategory,  // Read from state
    base_price: parseFloat(formData.get('base_price') as string) || 0,
    msrp: parseFloat(formData.get('msrp') as string) || null,
    image_url: formData.get('image_url') as string || null,
    part_number: formData.get('part_number') as string || null,
    is_active: formIsActive,  // Read from state
    is_taxable: formIsTaxable,  // Read from state
    display_order: parseInt(formData.get('display_order') as string) || 0,
  };

  saveMutation.mutate(option);
};
```

### Step 5: Update button click handlers

Update the "Add Option" button and edit button to use the new helper functions:

```tsx
<Button onClick={openCreateDialog}>
  <Plus className="h-4 w-4 mr-2" />
  Add Option
</Button>

// In card edit button:
onClick={() => openEditDialog(option)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/options/MotorOptionsCatalog.tsx` | Add state for form values, update Select components to controlled mode, update handleSubmit to read from state |

## Why This Works

1. **Controlled Components**: React state ensures we always have the correct value
2. **Proper Initialization**: Values are reset when opening the dialog, preventing stale data
3. **Reliable Submission**: The form now reads from guaranteed state values, not potentially-null FormData
