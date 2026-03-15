

# Update TestPDFButton with Trade-In Data and QR Code

## What

Update `src/components/ui/pdf-test-button.tsx` to include trade-in fields, accessory breakdown, financing fields, and a dummy QR code so the PDF can be tested without going through the full quote flow.

## Changes

**`src/components/ui/pdf-test-button.tsx`** — Add these fields to `sampleQuoteData`:

- `tradeInValue: 3500` and `tradeInInfo: { brand: 'Yamaha', year: 2018, horsepower: 115, model: 'F115' }`
- `accessoryBreakdown` with 2-3 sample rigging items (controls, harness, gauges)
- `financingQrCode` — generate a small QR code inline using a data URL (a simple black-on-white PNG placeholder, or use `qrcode` library if already available; otherwise a static base64-encoded QR image pointing to `https://mercuryrepower.ca`)
- `monthlyPayment: 165`, `financingTerm: 60`, `financingRate: 7.99`
- `includesInstallation: true`
- `selectedPromoOption: 'cash_rebate'`, `selectedPromoValue: '$500'`

For the QR code, check if the `qrcode` library (used elsewhere in the project) can be called at render time via `useEffect` + `useState` to generate a data URL, keeping the component self-contained.

