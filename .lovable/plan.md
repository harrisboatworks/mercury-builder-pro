

# Move Spec Sheet Download Button to Specs Tab

## The Change

Move the "Download Spec Sheet" button from the Resources tab to the bottom of the Specs tab, where it logically belongs since the button downloads a PDF of the specifications.

## Current Location
- **Resources Tab** → "Quick Actions" section at the very bottom (lines 816-823)

## New Location  
- **Specs Tab** → After the "Requirements" section (around line 739)

## Implementation

### File: `src/components/motors/MotorDetailsPremiumModal.tsx`

**1. Add the button at the end of the Specs tab content (before line 740):**

```tsx
{/* Requirements */}
<div>
  <h3 className="text-lg font-semibold tracking-wide text-gray-900 mb-4 flex items-center gap-2">
    <AlertCircle className="w-5 h-5 text-primary" />
    Requirements
  </h3>
  <div className="bg-slate-50 rounded-lg divide-y divide-gray-200">
    <SpecRow label="Battery" value={getBatteryRequirement(motor)} />
    <SpecRow label="Recommended Fuel" value={getFuelRequirement(motor)} />
    <SpecRow label="Oil Type" value={getOilRequirement(motor)} />
  </div>
</div>

{/* NEW: Download Spec Sheet - natural place after viewing specs */}
<div className="border-t border-gray-100 pt-6">
  <SpecSheetPDFDownload
    motor={motor}
    promotions={activePromotions}
    motorModel={motor?.model || title}
  />
</div>
```

**2. Remove from Resources tab (lines 816-823):**

Delete the "Quick Actions" section that currently contains the button.

## Visual Result

### Specs Tab (After)
```
┌─────────────────────────────────────┐
│ 📖 Model Code Breakdown             │
│ ⚙️ Engine Specifications            │
│ 📦 Physical Specifications          │
│ 🎯 Performance Estimates            │
│ ⚠️ Requirements                      │
├─────────────────────────────────────┤
│  [📥 Download Spec Sheet]           │  ← NEW: Natural CTA after specs
└─────────────────────────────────────┘
```

### Resources Tab (After)
```
┌─────────────────────────────────────┐
│ 🎬 Videos & Demonstrations          │
│ 📄 Downloads & Documentation        │
│                                     │  ← Button removed (was redundant)
└─────────────────────────────────────┘
```

## Why This Makes Sense

1. **Logical flow** - After reviewing specs, user naturally wants to save/share them
2. **Clear call-to-action** - "I've seen the specs, now let me download them"
3. **Resources tab cleanup** - That tab is for videos and Mercury docs, not our generated PDF
4. **Matches mobile** - The mobile `MotorDetailsSheet` already has this in the specs section

## Files to Modify

| File | Change |
|------|--------|
| `src/components/motors/MotorDetailsPremiumModal.tsx` | Move button from Resources to Specs tab |

