
# Skip Control Selection When User Has Existing Controls

## Problem

When users select "I have Mercury controls (2004+)" or "I have compatible controls ready" on the Boat Information page, the Installation page still asks them to choose a control system. This is redundant and confusing since they've already indicated they have controls.

---

## Solution

Modify the `InstallationConfig` component to:
1. Check the user's `controlsOption` from the quote context
2. Skip "Step 1: Choose Your Control System" if the user has existing controls
3. Start directly at Step 2 (Steering) with a pre-filled `controls` value indicating their selection

---

## User Experience After Fix

| Boat Info Selection | Installation Page Behavior |
|---------------------|---------------------------|
| "I need new controls" | Shows Step 1: Controls → Step 2: Steering → Step 3: Gauges |
| "I have Mercury controls (2004+)" | **Skips Step 1** → Shows Step 2: Steering → Step 3: Gauges |
| "I have compatible controls ready" | **Skips Step 1** → Shows Step 2: Steering → Step 3: Gauges |

---

## Technical Changes

### 1. Update InstallationPage to Pass boatInfo

**File: `src/pages/quote/InstallationPage.tsx`**

Pass the `boatInfo` from context to the `InstallationConfig` component:

```tsx
<InstallationConfig 
  selectedMotor={state.motor}
  boatInfo={state.boatInfo}  // ADD THIS
  onComplete={handleStepComplete}
/>
```

### 2. Update InstallationConfig to Accept and Use boatInfo

**File: `src/components/quote-builder/InstallationConfig.tsx`**

**Props interface:**
```tsx
interface InstallationConfigProps {
  selectedMotor: any;
  boatInfo?: BoatInfo | null;  // ADD THIS
  onComplete: (config: any) => void;
}
```

**Initial step logic:**
```tsx
// Determine if we should skip controls step
const hasExistingControls = boatInfo?.controlsOption === 'adapter' || 
                            boatInfo?.controlsOption === 'compatible';

// Start at step 2 if user has existing controls
const [step, setStep] = useState(hasExistingControls ? 2 : 1);

// Pre-fill controls value based on user's selection
const [config, setConfig] = useState({
  controls: hasExistingControls 
    ? (boatInfo?.controlsOption === 'adapter' ? 'existing_adapter' : 'existing_compatible')
    : '',
  steering: '',
  gauges: '',
  mounting: '',
  waterTest: true
});
```

**Update step progression:**
- When `hasExistingControls` is true, the component starts at step 2
- The controls step (Step 1) is never rendered
- The `controls` field is pre-filled with a marker value indicating the user's prior selection

### 3. Add Visual Confirmation (Optional Enhancement)

Show a small confirmation banner when controls are skipped:

```tsx
{hasExistingControls && (
  <Alert className="mb-6 border-green-500 bg-green-50">
    <CheckCircle className="w-4 h-4" />
    <AlertDescription>
      <strong>Using your existing controls</strong> — 
      {boatInfo?.controlsOption === 'adapter' 
        ? "We'll install a harness adapter (+$125)"
        : "No additional control hardware needed"}
    </AlertDescription>
  </Alert>
)}
```

---

## Files to Modify

1. **`src/pages/quote/InstallationPage.tsx`** — Pass `state.boatInfo` to InstallationConfig
2. **`src/components/quote-builder/InstallationConfig.tsx`** — Add logic to skip controls step when user has existing controls
