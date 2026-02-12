

# Terms and Conditions Page

## Overview
Create a standalone `/terms` page for Harris Boat Works, adapted from the existing terms on harrisboatworks.ca. This page will support TikTok developer account verification and domain verification requirements. It won't be added to any navigation or menu.

## Content Structure
The page will include the same two-part structure from the main website, updated for the quote tool domain (mercuryrepower.ca):

- **Part A -- Service, Repair and Storage Terms** (sections 1-7: Authorization, Liability, Estimates, Payment, Liens, Governing Law)
- **Part B -- Website Use Terms** (Ownership, Site Use, Compliance, Third Party Sites, Indemnification, Disclaimer, Limitation of Liability, Privacy, Communication, Copyright, Governing Law)

References to "DealerSpike" and "LeadVenture" from Part B will be removed/replaced since this site is not hosted by DealerSpike. The copyright agent contact will point to Harris Boat Works directly.

## Technical Details

### New Files
- **`src/pages/Terms.tsx`** -- Static content page using the same layout pattern as `About.tsx` (LuxuryHeader, container layout, clean typography). Content rendered as styled HTML sections with proper heading hierarchy.

### Modified Files
- **`src/App.tsx`** -- Add a single route: `<Route path="/terms" element={<Terms />} />`

### Design
- Clean, readable layout with proper spacing between sections
- Uses existing `LuxuryHeader` component for consistency
- Responsive typography with `prose` styling for the legal text
- "Last Updated" date displayed at the top
- No navigation links added anywhere -- accessible only via direct URL

### TikTok Domain Verification
After this page is live, you'll be able to point TikTok to `https://mercuryrepower.ca/terms` during the developer account setup. Domain verification typically involves adding a meta tag or uploading a verification file -- we can handle that as a follow-up once TikTok provides the specific verification method.

