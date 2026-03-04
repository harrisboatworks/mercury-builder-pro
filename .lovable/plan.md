

## Fix: Deep Link Motor Experience (Images + Configure Flow)

### What's Still Wrong

**1. "Configure" button reveals step wizard briefly**

When clicking "Configure This Motor" from a deep-linked motor details modal, the flow is:
- `onSelect()` runs → sets motor in quote context + `setMotorForDetails(null)` (reveals configurator steps underneath)
- Navigation to `/quote/options` only fires after a 500ms `setTimeout`
- During that 500ms gap, the user sees the configurator's step wizard (shaft selector, etc.)

Even though the close fix was added, the `onSelect` callback runs *before* `onClose` in the details modal's `handleSelectMotor`, so `setMotorForDetails(null)` exposes the step wizard momentarily.

**Fix**: In `MotorConfiguratorModal.tsx` line 912-914, when `initialMotorId` is set, the `onSelect` callback should call `onSelectMotor(motor)` and then immediately call `onClose()` (the parent's close) without calling `setMotorForDetails(null)`. This prevents the step wizard from ever becoming visible.

**2. Image sizing may need the gallery container adjusted**

The `w-full h-full` change on the `<img>` tag is correct but may not visually help for the Pro XS 115 because the containing `div` at line 470 in `MotorDetailsPremiumModal.tsx` adds padding (`pt-4 pb-6`) that shrinks the available space. The image gallery container should use full width without extra vertical padding to maximize the image area.

### Changes

**File 1: `src/components/motors/MotorConfiguratorModal.tsx`** (lines 912-914)
- When `initialMotorId` is set, the `onSelect` callback should call `onSelectMotor(motor)` then `onClose()` directly, skipping `setMotorForDetails(null)` to avoid flashing the step wizard.

**File 2: `src/components/motors/MotorDetailsPremiumModal.tsx`** (line 470)
- Remove extra padding from the image gallery wrapper (`pt-4 pb-6` → `py-2`) so images have more room to fill the frame.

