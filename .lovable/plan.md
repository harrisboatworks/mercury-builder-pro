
# Hide Accessories Page (Temporary)

## Summary
Remove the Accessories page from all navigation menus while preserving the code for future use.

---

## Changes

### Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/luxury-header.tsx` | Remove desktop nav link (lines 258-267) |
| `src/components/ui/hamburger-menu.tsx` | Remove mobile nav link (line 66) |
| `src/components/ui/site-footer.tsx` | Remove footer link from `navigationLinks` array (line 17) |

---

## What Stays Unchanged

The following will remain **untouched** so you can easily restore the page later:

| Item | Reason |
|------|--------|
| `src/pages/Accessories.tsx` | Keep the page component |
| `src/App.tsx` route | Route stays defined (direct URL still works for testing) |
| `src/lib/accessories-data.ts` | Keep the data file |
| `GlobalStickyQuoteBar.tsx` | Already excludes accessories page |
| `UnifiedMobileBar.tsx` | No visible link, just visibility logic |
| Contact form "Parts & Accessories" option | Useful for general inquiries |
| `llms.txt` | Can update later when ready |

---

## Result

- **Accessories** link removed from header, mobile menu, and footer
- Direct URL `/accessories` still works (for internal testing)
- All code preserved for easy re-enablement later
- No visible way for customers to navigate to the page

---

## To Re-Enable Later

Simply revert these 3 changes to restore the navigation links.
