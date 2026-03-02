

## Fix Controls Description, Custom Items Display, and PDF Generation

### Issues Found

1. **Controls description too generic**: When `controlsOption === 'adapter'` (customer has Mercury 2004+ controls), the summary shows "Controls & Rigging" with description "Premium marine controls and installation hardware" — misleading for a $125 adapter harness.

2. **Admin custom items not showing on summary**: The `accessoryBreakdown` memo at line 414-422 does push custom items, but they may not be rendering if the state isn't being restored properly from the saved quote. Need to verify the `adminCustomItems` restoration path.

3. **Neither controls description nor custom items appear on PDF**: The PDF component (`src/components/quote-pdf/ProfessionalQuotePDF.tsx`) **does** render `accessoryBreakdown` (lines 657-679), so the issue is that the `accessoryBreakdown` data passed to `generateQuotePDF` must already include the correct descriptions. The PDF will show whatever the summary page builds — so fixing the summary descriptions fixes the PDF too.

### Changes

**1. Fix controls name/description based on `controlsOption`** (`src/pages/quote/QuoteSummaryPage.tsx`, lines 352-358)

Change the generic "Controls & Rigging" / "Premium marine controls" to be context-aware:
- `controlsOption === 'adapter'` → name: "Control Adaptor Harness", description: "Adapter to connect your existing Mercury controls to the new motor"
- `controlsOption === 'none'` → name: "Controls & Rigging Package", description: "New throttle/shift controls, cables, and installation hardware"
- Default fallback keeps current text

**2. Verify admin custom items show on summary and in PDF data** (`src/pages/quote/QuoteSummaryPage.tsx`)

The `accessoryBreakdown` memo already includes `state.adminCustomItems` (lines 414-422). The `pdfData` at line 502 passes `accessoryBreakdown` to the PDF generator. The PDF component renders it at lines 657-679. So if custom items are in state, they should flow through. Need to check if the issue is that `adminCustomItems` isn't in the dependency array or isn't being restored. Looking at line 426, `state.adminCustomItems` IS in the deps array. The `SavedQuotePage` restoration (from the last diff) does restore `adminCustomItems`. So the fix should already work for newly saved quotes — but the admin may need to re-save the quote to embed custom items in `quote_data`.

However, there's a subtle issue: the `AdminQuoteControls` dispatches custom items to context, and the summary page reads from context — but the `pdfData` object is built at PDF download time from `accessoryBreakdown` which reads from `state.adminCustomItems`. This should work. Let me verify the admin controls are dispatching correctly by checking if the controls component is mounted on the summary page.

Actually, looking more carefully: the `AdminQuoteControls` component dispatches to context via `SET_ADMIN_QUOTE_DATA`. The summary page reads `state.adminCustomItems` in the `accessoryBreakdown` memo. This chain works when the admin is actively on the page. For shared quotes loaded via `SavedQuotePage`, the custom items need to be in `quote_data.adminCustomItems` — which was added in the recent fix to `AdminQuoteControls.tsx`. So existing quotes saved before this fix won't have custom items embedded. The admin needs to re-save.

**Summary of code changes:**

### File: `src/pages/quote/QuoteSummaryPage.tsx` (lines 352-358)
- Replace the generic controls entry with option-aware name and description based on `state.boatInfo?.controlsOption`

### File: `src/components/quote-builder/MobileQuoteDrawer.tsx` (line 78)
- Also update the label there from `'New Controls & Rigging'` to match the adapter case

No PDF component changes needed — the PDF already renders whatever `accessoryBreakdown` contains, including descriptions. Fixing the source data fixes the PDF.

### Re: custom items not showing
If the admin created the quote before the recent `adminCustomItems` embedding fix, the custom items won't be in `quote_data` and won't restore on the shared link. The admin should re-save the quote. No additional code change needed — the fix from the last edit already handles this.

