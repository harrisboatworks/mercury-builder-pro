
# Streamline Schedule Page: Remove Redundant Elements

## Problem

On `/quote/schedule`, there are two issues:

1. **Duplicate Quote Summary**: The left-side "Quote Summary" card repeats everything the customer just reviewed on the Summary page
2. **Two Bottom Bars**: Both `GlobalStickyQuoteBar` (desktop) and `UnifiedMobileBar` are showing, creating visual clutter

## Changes

### 1. Remove Quote Summary Card from ScheduleConsultation

**File: `src/components/quote-builder/ScheduleConsultation.tsx`**

Remove the entire "Quote Summary" card (lines 746-825). The customer has already reviewed their quote - this page should focus only on:
- Contact form (already there)
- Harris Boat Works contact info
- "What happens next?" section (useful expectation-setting)

The layout will shift from a two-column grid to a single, focused contact form.

### 2. Hide GlobalStickyQuoteBar on Schedule Page

**File: `src/components/quote/GlobalStickyQuoteBar.tsx`**

Add `/quote/schedule` to the `hideOnPages` array (around line 19-40). This removes the redundant desktop sticky bar since the UnifiedMobileBar handles mobile navigation and the page doesn't need a "Continue" action (submitting the form IS the final action).

---

## Technical Details

| File | Change |
|------|--------|
| `src/components/quote-builder/ScheduleConsultation.tsx` | Remove Quote Summary card (lines 746-825), adjust grid layout to single column |
| `src/components/quote/GlobalStickyQuoteBar.tsx` | Add `/quote/schedule` to `hideOnPages` array |

### Layout After Changes

```text
+------------------------------------------+
|        Submit Your Quote                 |
|  Complete your contact information...    |
+------------------------------------------+
|                                          |
|    [ Contact Information Form ]          |
|    - Name                                |
|    - Email                               |
|    - Phone                               |
|    - Preferred Contact Method            |
|    - Notes                               |
|    - Send Quote Options                  |
|    - Submit Quote Button                 |
|                                          |
+------------------------------------------+
|    Harris Boat Works                     |
|    Phone | Email | Location              |
|                                          |
|    What happens next?                    |
|    - We'll contact you within 24 hrs... |
+------------------------------------------+
```

The page becomes cleaner and more focused on the single goal: capturing customer contact info.
