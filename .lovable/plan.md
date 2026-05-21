## Answer to Steve's question (now, no code)

I checked the database directly. There is **no quote in any table** with the name "Steve", a Steve email, or a Steve phone number in the last 21 days — not in `customer_quotes`, `saved_quotes`, `contact_inquiries`, or `trade_valuation_leads`.

What DOES exist: on the morning of **May 21, 2026 between 6:58 AM and 7:04 AM**, six anonymous quotes for the **40 ELPT Command Thrust FourStroke** were built back-to-back from the public site, all soft-leads with no contact info attached:

| Ref # | Time (UTC) | Motor |
|---|---|---|
| HBW-00823 | 06:58 | 40 ELPT CT FourStroke |
| HBW-00824 | 07:02 | 40 ELPT CT FourStroke |
| HBW-00825 | 07:03 | 40 ELPT CT FourStroke |
| HBW-00826 | 07:03 | 40 ELPT CT FourStroke |
| HBW-00827 | 07:04 | 40 ELPT CT FourStroke |
| HBW-00828 | 07:04 | 40 ELPT CT FourStroke |

That run of six in six minutes for the exact motor Steve asked about is almost certainly him iterating on options. He never gave the system his name, email, or phone, so it saved as anonymous. If you ask him for a reference number, any HBW-008xx in that range will pull up his configuration. Otherwise, ask him roughly when he built it and offer to reproduce.

## What's wrong with the admin Quotes page

`src/pages/AdminQuotes.tsx` already has a search box (top-left, "Search name, email, motor...") and source/status/source filters. Three real problems:

1. **You can't search by reference number visibly.** It actually does search ref # under the hood (line 205), but the placeholder doesn't say so, so nobody tries `HBW-00827`.
2. **Anonymous quotes have no customer name to match on**, so name search returns nothing for the most common case — exactly Steve's situation.
3. **No motor / HP / date-range filter.** When a customer says "I built a 40 ELPT CT", you have to scan the whole list. Also no pagination — saved_quotes pulls 500 rows and dumps them in one scroll.

## Plan (admin-only UX, no schema changes)

Edit `src/pages/AdminQuotes.tsx` only:

1. **Better search**
   - Change placeholder to `"Search name, email, motor, ref # (e.g. HBW-00827)..."`.
   - Auto-detect `HBW-` prefix and prioritize ref-number match (exact, case-insensitive) so a single keystroke jumps to the row.

2. **New filters in the existing filter row**
   - **HP** dropdown: All / 2.5–9.9 / 15–25 / 30–60 / 75–115 / 150+. Filters on parsed HP from `_motor_info`.
   - **Model contains** small text input (e.g. type `Command Thrust` or `ELPT CT`).
   - **Date range** quick chips: Today, Last 7 days, Last 30 days, All.

3. **Pagination / virtualization**
   - Show 50 rows per page with prev/next + "Showing X–Y of Z" counter. Pure client-side over the already-fetched array, no DB change.

4. **Highlight anonymous / recent activity**
   - Add a "Recent anonymous quotes (last 24h)" collapsible panel above the table, grouped by motor model, so phone-in cases like Steve's are surfaced immediately. Each group shows count + ref-number range + "View configurations" expander.

5. **Sticky table header** so scrolling a long list keeps Date / Customer / Motor / Ref # visible.

## Out of scope (not doing unless you ask)

- No changes to `saved_quotes`/`customer_quotes` schema or RLS.
- No change to the public quote flow (i.e. not going to force customers to enter name/phone before saving — that's a separate product decision).
- No bulk delete or merging of anonymous duplicates.

## Files touched

- `src/pages/AdminQuotes.tsx` only.

## Quick question before I build

Do you want me to also add an **"Outreach" button on each anonymous row** that lets you mark it as "Followed up by phone — Steve" with a free-text contact name, so next time the row carries a label? Or keep the anonymous rows truly anonymous and rely on ref # only?
