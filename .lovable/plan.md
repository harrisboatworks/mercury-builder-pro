

## Make controls description accurate on PackageSelectionPage

Yes, this is worth doing for consistency. Currently line 209 shows a generic "Standard controls & rigging" feature text regardless of whether the customer has existing controls (adapter) or needs new ones.

### Change

**`src/pages/quote/PackageSelectionPage.tsx`** (line 209)

Replace the static feature string with a context-aware one:
- `controlsOption === 'adapter'` → "Control adaptor harness (uses your existing controls)"
- `controlsOption === 'compatible'` → "Compatible with your existing controls (no extra hardware)"
- `controlsOption === 'none'` or default → "New controls & rigging package"
- Tiller motors keep "Tiller-handle operation" unchanged

Single line change, no structural impact.

