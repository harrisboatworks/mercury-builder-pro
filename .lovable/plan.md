

## Fix Email Templates: Broken Logos, Wrong Contact Info, Old Domain References

### Problem Summary

1. **Broken logo images in deposit confirmation email**: The logos reference `${appUrl}/email-assets/harris-logo.png`. The `APP_URL` secret controls `appUrl`. The files exist in `public/email-assets/` but emails are rendered by email clients that fetch from the live domain. If `APP_URL` doesn't match the deployed domain, or the assets aren't deployed to Vercel, logos break.

2. **Wrong contact info in saved-quote email** (`send-saved-quote-email`):
   - Phone: `(705) 327-2002` — wrong number, should be `(905) 342-2153`
   - Email: `sales@hbwsales.ca` — should be `info@harrisboatworks.ca`
   - Hours listed don't match (this may be from a template copy)

3. **Placeholder phone numbers in quote delivery email** (`send-quote-email`):
   - `(555) 123-4567` appears twice — completely fake placeholder
   - Says "The Mercury Motors Team" instead of "Harris Boat Works"

4. **Old domain references in chatbot/parts functions** (`elevenlabs-mcp-server`, `ai-chatbot-stream`, `mercury-parts-lookup`):
   - Multiple references to `harrisboatworks.ca/quote` and `harrisboatworks.ca/mercuryparts` — should be `mercuryrepower.ca`

### Files to Edit

**1. `supabase/functions/send-saved-quote-email/index.ts`**
- Fix phone: `(705) 327-2002` → `(905) 342-2153`
- Fix email: `sales@hbwsales.ca` → `info@harrisboatworks.ca`
- Remove or fix business hours (confirm with owner, or remove)
- Upgrade to use branded template with logos (like deposit email does)

**2. `supabase/functions/send-quote-email/index.ts`**
- Replace `(555) 123-4567` with `(905) 342-2153` (two places)
- Replace "The Mercury Motors Team" with "Harris Boat Works"
- Same fixes in the follow-up email template

**3. `supabase/functions/_shared/email-template.ts`**
- Verify `appUrl` defaults to `https://mercuryrepower.ca` (it does, this is fine)

**4. `supabase/functions/send-deposit-confirmation-email/index.ts`**
- Already uses correct `APP_URL` fallback to `mercuryrepower.ca` — logos should work if the `APP_URL` secret is set correctly. Need to verify the secret value.

**5. `supabase/functions/elevenlabs-mcp-server/index.ts`**
- Replace `harrisboatworks.ca/quote` → `mercuryrepower.ca/quote`
- Replace `harrisboatworks.ca/mercuryparts` → `mercuryrepower.ca/mercuryparts`
- Replace `harrisboatworks.ca` general references → `mercuryrepower.ca`

**6. `supabase/functions/ai-chatbot-stream/index.ts`**
- Replace all `harrisboatworks.ca/mercuryparts` → `mercuryrepower.ca/mercuryparts`
- Update knowledge base text references

**7. `supabase/functions/mercury-parts-lookup/index.ts`**
- Replace `harrisboatworks.ca/mercuryparts` → `mercuryrepower.ca/mercuryparts`

### Logo Fix Strategy

The logos at `public/email-assets/harris-logo.png` and `mercury-logo.png` are served by Vercel at `mercuryrepower.ca/email-assets/`. As long as `APP_URL` is set to `https://mercuryrepower.ca`, the URLs will resolve. I will verify the secret is correct and ensure all templates use the correct fallback.

### Contact Info Standard (from `companyInfo.ts`)
- Phone: `(905) 342-2153`
- Email: `info@harrisboatworks.ca`
- Address: `5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0`

