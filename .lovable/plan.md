

# Add CC Email to Weekly Report

## Change
Add `hbwbot00@gmail.com` as a CC recipient on the weekly report email.

## File to modify
**`supabase/functions/weekly-quote-report/index.ts`** (line ~511-514)

The Resend API `emails.send()` call currently sends only to `ADMIN_EMAIL`. Adding a `cc` field:

```typescript
await resend.emails.send({
  from: "Mercury Quotes <noreply@hbwsales.ca>",
  to: [ADMIN_EMAIL],
  cc: ["hbwbot00@gmail.com"],
  subject: `...`,
  html: emailHtml,
});
```

That's the only change needed -- the Resend SDK supports `cc` natively.

