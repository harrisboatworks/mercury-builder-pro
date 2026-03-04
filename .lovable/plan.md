

## Fix: Deep Link Close Behavior + Pro XS 115 Image Issues

### What's Happening

Two issues when visiting `/motors/pxs-115-exlpt`:

1. **Close behavior**: When the details modal closes, it reveals the configurator step UI underneath (start type, shaft, etc.) instead of dismissing everything. For deep-link visitors, this is confusing — they came for a specific motor, not a step-by-step wizard.

2. **Image not fitting frame**: This is likely specific to the Pro XS 115 because the image source (from the database or CDN fallback) has different dimensions/aspect ratio than typical motors. The `MotorImageGallery` uses `h-96` in enhanced mode with `object-contain`, so unusually sized images leave whitespace. The container-aware scale hook should handle this, but if the natural image dimensions are close to the container size, `minScale: 1.0` prevents any upscaling.

### Plan

**File 1: `src/components/motors/MotorConfiguratorModal.tsx`**

- Line 904: Update the `onClose` callback so that when `initialMotorId` is set (deep link), closing the details modal calls `onClose()` (dismisses the entire configurator) instead of just `setMotorForDetails(null)` (which reveals the step wizard underneath).

**File 2: `src/components/motors/MotorImageGallery.tsx`**

- The `enhanced` mode container (`h-96`) combined with `useContainerAwareScale` already tries to fill optimally, but `minScale: 1.0` means images that nearly fill the container won't get the small boost they need. Lower `minScale` isn't the answer — instead, ensure the `object-contain` image uses `w-full h-full` so the browser's native fitting maximizes the image within the container before the scale hook applies. This is a small CSS tweak to the `<img>` tag (around line 196) to replace `max-h-full max-w-full` with `w-full h-full` while keeping `object-contain`.

### Scope

Two files, two targeted changes. No other files affected.

