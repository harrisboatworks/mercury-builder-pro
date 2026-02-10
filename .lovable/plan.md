

# Fix Unverified harrisboatworks.ca Sender Addresses

## Problem

Resend only has the `hbwsales.ca` domain verified. Three edge functions still send FROM `@harrisboatworks.ca` addresses, which Resend rejects with a 403 "domain not verified" error. The deposit confirmation email test confirmed this failure.

## Also Fix: SMS Logging Bug

The `send-sms` function logs the Twilio message SID (e.g., `SM4048db...`) into a `notification_id` column that expects a UUID format, causing a database error on every SMS. The SMS still sends, but the activity log fails silently.

## Changes

### 1. `supabase/functions/send-deposit-confirmation-email/index.ts`
- Change `from: "Harris Boat Works <deposits@harrisboatworks.ca>"` to `from: "Harris Boat Works <deposits@hbwsales.ca>"`

### 2. `supabase/functions/send-contact-inquiry/index.ts`
- Change `from: "Harris Boat Works <info@harrisboatworks.ca>"` to `from: "Harris Boat Works <info@hbwsales.ca>"` (appears twice -- customer confirmation and admin notification)

### 3. `supabase/functions/send-get7-campaign/index.ts`
- Change `from: "Harris Boat Works <promotions@harrisboatworks.ca>"` to `from: "Harris Boat Works <promotions@hbwsales.ca>"`

### 4. `supabase/functions/send-sms/index.ts`
- Change the `notification_id` field to a text-compatible column name or store the Twilio SID in a text field instead (the column expects UUID but Twilio SIDs are not UUIDs)

## After Changes

- Deploy all 4 updated functions
- Re-run the deposit confirmation and contact inquiry tests to verify emails arrive
- Verify SMS logging no longer throws errors

## Summary of All Sender Addresses After Fix

| Function | From Address | Status |
|----------|-------------|--------|
| send-quote-email | `noreply@hbwsales.ca` | Already working |
| cron-failure-notifications | `noreply@hbwsales.ca` | Already working |
| send-blog-notification | `updates@hbwsales.ca` | Already working |
| subscribe-blog | `updates@hbwsales.ca` | Already working |
| send-saved-quote-email | `quotes@hbwsales.ca` | Already working |
| send-deposit-confirmation-email | `deposits@hbwsales.ca` | **Fix needed** |
| send-contact-inquiry | `info@hbwsales.ca` | **Fix needed** |
| send-get7-campaign | `promotions@hbwsales.ca` | **Fix needed** |

Note: `harrisboatworks.ca` addresses are still fine as **recipient** addresses (e.g., `to: info@harrisboatworks.ca`) -- only the **sender** domain needs to be verified in Resend.
