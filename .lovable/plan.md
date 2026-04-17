

## Investigation findings: no financing application was submitted last night

I checked every relevant table and edge function. **No financing application was successfully submitted in the last 36 hours.** Here's what I actually found:

### `financing_applications` table
- Last 36 hours: **0 records**
- Last 12 months: only 5 records total — and 3 are `Test Applicant` rows from Nov 11, 2025, plus 2 anonymous drafts from Nov 25, 2025 that never collected an applicant name/email (stuck at step 1-2)
- Edge function logs for `send-financing-confirmation-email`: **no logs at all**, ever

So whatever your contact did, it never reached `status = submitted` and never triggered the confirmation email function. That's why no notification fired — there's nothing to notify on.

### What DID happen last night
Two anonymous "soft lead" quote saves from the QA/preview environment:

| Time (UTC) | Reference | Motor | Email |
|---|---|---|---|
| Apr 17 13:32 | HBW-00658 | 200 ELPT ProXS | anonymous@soft-lead.local |
| Apr 17 01:47 | HBW-00657 | 25 ELHPT FourStroke | anonymous@soft-lead.local |
| Apr 16 18:09 | HBW-00656 | 60 ELPT CT FourStroke | pdf-download@placeholder.com |

These are quote-builder saves, not financing applications, and all are anonymous (no contact info). One legit admin-created quote: **Glen Krawec (c.krawec63@gmail.com, 705-930-5783)** at Apr 16 18:11 — but that's an admin entry, not a self-submission, and it's from your end.

### Most likely explanations
1. **He thinks he submitted but didn't.** He probably reached the Review & Submit step but bailed before clicking "Submit Application" (a very common pattern — the review step is long).
2. **He submitted on a different site/form.** Worth asking which URL he was on and whether he got a confirmation screen or email.
3. **He submitted the quote-builder lead form**, not the full financing application — the saved_quotes above have no contact info, suggesting he hit "Save quote" without entering email/name.

### What I recommend (plan)

If you want me to act on this, here's what I'd build/fix:

**1. Reply to the customer** — ask: (a) what time, (b) which URL, (c) did he see a "Thank you / Application Received" screen, (d) what email did he enter. 30 seconds of clarification will save guessing.

**2. Add an admin alert for partial financing apps** — right now you only get notified on `status = submitted`. I'd add a daily digest (or instant alert) for any financing_application that:
- Has reached step ≥ 4 (employment data captured)
- Has applicant email/phone
- Is still `draft` after 6+ hours
This catches "almost-submitted" prospects exactly like this one before they go cold.

**3. Add a "submission attempted" event log** — wire a tracking insert in `ReviewSubmitStep.onSubmit` that writes a row at the moment Submit is clicked, BEFORE the DB write. If the DB write fails (RLS, network, validation), we still see the attempt. Today, a failed submission leaves zero trace.

**4. Verify the submission flow itself** — I'll do a test submission in the preview, watch for the row to land in `financing_applications` with `status = submitted` and confirm the confirmation email fires from `send-financing-confirmation-email`. If it's broken, fix it.

Approve and I'll start with #4 (verify flow works end-to-end) + #2 (partial-app alert), then send you a copy-paste reply for #1.

