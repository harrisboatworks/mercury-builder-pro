# Deposit deal-packet release plan

Checklist only. This is not a production trigger, deploy script, or
authorization to apply migrations. Do not put credentials, tokens, or
project URLs in this file.

## Required order

1. **Migration first**
   - Apply `20260823120000_deposit_deal_packet.sql` before any Edge
     revision that reads `deposit_email_deliveries` or the new claim RPCs.
2. **Edge functions second**
   - `create-payment`
   - `stripe-webhook`
   - `send-deposit-confirmation-email`
   - `quote-document-api`
3. **Frontend last**
   - Ship the admin deal-packet UI and checkout clients only after the
     migration and the four Edge slugs above are live.

Migration before Edge before frontend. Do not reverse that order.

## Rollback notes

- Keep the previous Edge revisions of `create-payment`, `stripe-webhook`,
  `send-deposit-confirmation-email`, and `quote-document-api` ready to
  redeploy if a function fails closed.
- Do not reverse `20260823120000_deposit_deal_packet.sql` if paid deposit
  rows or delivery outbox rows already exist.
- Frontend rollback is independent after Edge and the migration are stable.
- Isolated staging bootstrap SQL is not a production rollback path.
