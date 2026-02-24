

# Remove Misleading Prices from Installation Config Options

## What's Changing

The controls, steering, and gauge options in the Installation Config step are purely for capturing the boat's configuration -- none of their prices feed into the quote total. The price badges currently displayed on these cards ("+ $1,200", "Included") are unnecessary and potentially confusing.

## Changes

### File: `src/config/visualChoices.ts`

Remove `price` and `priceLabel` fields from all entries in:

- `controlChoices` (remove `price: 1200` and `priceLabel: "+$1,200"` from both side-mount and binnacle)
- `steeringChoices` (remove `price: 0` and `priceLabel: "Included"` from both cable and hydraulic)
- `gaugeChoices` (remove `price: 0` and `priceLabel: "Included"` from all three gauge options)

The `tillerMountingChoices` will keep their prices since those **do** flow into the quote total via `installationCost`.

The `OptionGallery` component already handles missing `priceLabel` gracefully -- it only renders the price badge when `choice.priceLabel` is present, so no other files need changes.

