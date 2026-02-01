
# Convert "Not Sure?" to Skip Action

## The Problem

When the user clicks "Not Sure?" on the boat type step, it reveals an overwhelming wall of text with multiple bullet points about primary use and hull shape. This is frustrating because:

1. **Information overload** - Too much text to process
2. **Doesn't actually help** - Users who don't know won't suddenly know from reading
3. **Dealer confirms anyway** - The details will be verified during consultation

## The Solution

Transform "Not Sure?" from a help toggle into a skip action. The code already has a `handleSkip()` function that:
- Sets a sensible default boat type based on motor HP
- Sets a typical boat length based on motor HP
- Advances to the next step

Simply change the "Not Sure?" button to call `handleSkip()` instead of toggling help content.

---

## Implementation

### File: `src/components/quote-builder/BoatInformation.tsx`

**Change 1: Update the "Not Sure?" button (lines 589-595)**

Before:
```tsx
<button type="button" onClick={() => setShowHelp(s => !s)} className="group relative rounded-xl border-2 ...">
  <div className="mb-3 h-24 overflow-hidden ...">
    <img src="/lovable-uploads/1d6d06c4-3b2d-477c-ae3c-042a3ca1a076.png" alt="Not sure?..." />
  </div>
  <h3 className="font-light ...">Not Sure?</h3>
  <p className="text-sm font-light ...">We'll help you figure it out</p>
</button>
```

After:
```tsx
<button type="button" onClick={handleSkip} className="group relative rounded-xl border-2 ...">
  <div className="mb-3 h-24 overflow-hidden ...">
    <img src="/lovable-uploads/1d6d06c4-3b2d-477c-ae3c-042a3ca1a076.png" alt="Skip boat type selection" />
  </div>
  <h3 className="font-light ...">Not Sure?</h3>
  <p className="text-sm font-light ...">Skip — we'll confirm later</p>
</button>
```

**Change 2: Remove the help content block (lines 598-628)**

Delete the entire `{showHelp && ...}` block since it's no longer triggered.

**Change 3 (optional cleanup): Remove unused state**

The `showHelp` state (line 398) is no longer needed:
```tsx
// DELETE: const [showHelp, setShowHelp] = useState(false);
```

---

## What Happens When User Clicks "Not Sure?"

The existing `handleSkip()` function (line 401-411) runs:

```text
Motor HP < 25  → Default to 14' Utility Boat
Motor HP 25-59 → Default to 16' Utility Boat  
Motor HP 60-114 → Default to 18' Utility Boat
Motor HP 115+  → Default to 20' Utility Boat
```

Then advances to the next step (transom height).

---

## Result

| Before | After |
|--------|-------|
| Shows overwhelming help text with 10+ bullet points | Immediately skips to next step |
| User still has to make a selection after reading | User continues quote with sensible defaults |
| Frustrating cognitive load | Zero friction |

The dealer will confirm exact boat details during consultation anyway, so collecting precise information upfront isn't critical.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/BoatInformation.tsx` | Change button onClick to `handleSkip`, update description text, remove help content block |
