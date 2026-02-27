

## Findings

### Database for quote `108736e2-...`:
- **`adminCustomItems`**: `[]` (empty) — no custom items were saved for this quote
- **`customerNotes`**: empty — no notes were saved
- **`looseMotorBattery`**: `{wantsBattery: true, batteryCost: 179.99}` — battery IS saved

### Root Causes

**1. Custom items empty in DB:** The admin saved this quote before adding any custom items, OR the items were added after saving. The code correctly saves `customItems` to `enhancedQuoteData.adminCustomItems`. You need to re-save the quote after adding custom items.

**2. Battery not on PDF:** The battery data is correctly stored and the restore/render code is correct in the source. The most likely cause is that the **production site has not been republished** since these code changes were made. The Lovable preview should work correctly — the production site at `mercuryrepower.ca` needs a fresh publish.

**3. Customer notes not on PDF:** Same reason — the `customerNotes` rendering was just added to `ProfessionalQuotePDF.tsx` and needs to be published. Also, this particular quote has no customer notes saved.

### Action Items

1. **Publish the latest changes** to production so `mercuryrepower.ca` picks up the new PDF rendering (battery in accessories, customer notes section, custom line items)
2. **Re-save the test quote** after adding custom items and customer notes in the admin controls, then re-open the shared link to verify

No code changes needed — the implementation is correct. This is a deployment/workflow issue.

