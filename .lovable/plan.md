
# Fix Email Domain Issues Across Edge Functions

## Problem

After the domain switch to `mercuryrepower.ca`, a few edge functions still have stale or placeholder email domains that would cause delivery failures or look unprofessional.

## Issues Found

| File | Current (broken) | Fix to |
|------|------------------|--------|
| `cron-failure-notifications/index.ts` | `noreply@yourdomain.com` | `noreply@hbwsales.ca` |
| `cron-failure-notifications/index.ts` | `admin@yourdomain.com` | `info@harrisboatworks.ca` |
| `send-blog-notification/index.ts` | `updates@harrisboatworks.com` | `updates@hbwsales.ca` |
| `subscribe-blog/index.ts` | `updates@harrisboatworks.com` | `updates@hbwsales.ca` |
| `_shared/email-template.ts` | `https://harrisboatworks.com` | `https://mercuryrepower.ca` |

## What's Already Fine

- All core email functions (quotes, financing, promo, contact, repower guide, deposits, saved quotes, chat leads) correctly use `@hbwsales.ca` or `@harrisboatworks.ca`
- SMS/Twilio setup has no domain references -- fully functional
- All required secrets (RESEND_API_KEY, TWILIO_ACCOUNT_SID, etc.) are configured
- The shared email template already reads `APP_URL` from env for links (set to `mercuryrepower.ca`) -- only the hardcoded logo link in the HTML needs fixing

## Changes

### 1. `supabase/functions/cron-failure-notifications/index.ts`
- Replace `noreply@yourdomain.com` with `noreply@hbwsales.ca` (2 places)
- Replace `admin@yourdomain.com` with `info@harrisboatworks.ca` (2 places)

### 2. `supabase/functions/send-blog-notification/index.ts`
- Replace `updates@harrisboatworks.com` with `updates@hbwsales.ca`

### 3. `supabase/functions/subscribe-blog/index.ts`
- Replace `updates@harrisboatworks.com` with `updates@hbwsales.ca`

### 4. `supabase/functions/_shared/email-template.ts`
- Replace hardcoded `https://harrisboatworks.com` logo link with `https://mercuryrepower.ca`

All 4 files are edge functions that will auto-deploy after editing.
