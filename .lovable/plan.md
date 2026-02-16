

## Fix: Remove Misleading Fallback Hours

### What's Happening

The financing page footer is already correctly pulling hours from Google Places (your winter hours of 8:00-8:01 AM / Closed are accurate). The Google API call is already limited to once per day via 24-hour caching on both client and server -- no changes needed there.

The only problem: if the Google API ever fails temporarily, the `OpeningHoursDisplay` component falls back to **hardcoded summer hours** (Mon-Fri 8-5, Sat 9-2) which would be completely wrong during winter. This fallback needs to go.

### Changes

**File: `src/components/business/OpeningHoursDisplay.tsx`**

- Remove the `FALLBACK_HOURS` constant entirely
- When no Google data is available (API error or loading), show a simple "Contact us for current hours" message with the phone number instead of fake hours
- Import `COMPANY_INFO` to pull the phone number
- Keep the "Open Now / Closed" badge logic unchanged (it calculates from whatever hours are available)

This is a small, targeted change. One file, no other pages affected. The footer on every page (including financing) will either show real Google hours or a graceful fallback that doesn't lie about your schedule.

