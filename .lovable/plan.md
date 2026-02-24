

# Hide Gauges Selection Step

## What's Changing

The gauges selection step in the Installation Config will be hidden, similar to how the DTS control option was hidden. Users will no longer be prompted to choose between Basic Tach, Smartcraft Connect, or VesselView during installation configuration.

## Technical Details

### File: `src/components/quote-builder/InstallationConfig.tsx`

Remove or skip the gauges step from the installation flow. This means:

- Remove the gauge selection `OptionGallery` rendering
- Adjust step logic so the flow goes directly from steering selection to completion (for non-tiller motors)
- Update any step count or completion logic that references the gauges step

The `gaugeChoices` array in `visualChoices.ts` can remain in place (just unused), keeping it easy to re-enable later.

