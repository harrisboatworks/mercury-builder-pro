

# Fix: Infinite Loop in Options Page

## The Problem

The console shows **"Maximum update depth exceeded"** - an infinite render loop caused by two `useEffect` hooks fighting each other:

```text
Effect A (initialization):
  Dependencies: [categorizedOptions, state.selectedOptions]
  Action: setLocalSelectedIds(initialIds)
      ↓
Effect B (sync to context):
  Dependencies: [localSelectedIds, categorizedOptions, dispatch]
  Action: dispatch SET_SELECTED_OPTIONS
      ↓
state.selectedOptions changes → triggers Effect A again → LOOP!
```

## Solution

Remove `state.selectedOptions` from Effect A's dependency array. The initialization logic should only run once when `categorizedOptions` first loads, not every time the context updates (since we're the ones updating it).

---

## Implementation

### File: `src/pages/quote/OptionsPage.tsx`

**Change the initialization effect (lines 63-82):**

Before:
```tsx
useEffect(() => {
  if (categorizedOptions) {
    const initialIds = new Set<string>();
    categorizedOptions.required.forEach(opt => initialIds.add(opt.id));
    state.selectedOptions?.forEach(opt => initialIds.add(opt.optionId));
    categorizedOptions.recommended.forEach(opt => {
      if (opt.is_included) initialIds.add(opt.id);
    });
    setLocalSelectedIds(initialIds);
  }
}, [categorizedOptions, state.selectedOptions]);  // ← PROBLEM: triggers on every dispatch
```

After:
```tsx
// Use a ref to track if we've already initialized
const initializedRef = useRef(false);

useEffect(() => {
  // Only initialize once when categorizedOptions loads
  if (categorizedOptions && !initializedRef.current) {
    initializedRef.current = true;
    
    const initialIds = new Set<string>();
    categorizedOptions.required.forEach(opt => initialIds.add(opt.id));
    state.selectedOptions?.forEach(opt => initialIds.add(opt.optionId));
    categorizedOptions.recommended.forEach(opt => {
      if (opt.is_included) initialIds.add(opt.id);
    });
    setLocalSelectedIds(initialIds);
  }
}, [categorizedOptions]); // ← Removed state.selectedOptions dependency
```

---

## Why This Works

| Before | After |
|--------|-------|
| Effect A triggers on every `state.selectedOptions` change | Effect A only runs once when options load |
| Effect B dispatches → triggers Effect A → loop | Effect B dispatches → Effect A doesn't re-run → no loop |
| App crashes with max update depth error | Selections sync smoothly to bottom bar |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/quote/OptionsPage.tsx` | Add `initializedRef` guard to prevent re-initialization on context updates |

