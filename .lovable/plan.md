

## Migrate `mercuryrepower.ca` from Lovable to Vercel — DNS Walkthrough

The domain is registered through Lovable, so DNS is managed in **Project Settings → Domains → ⋯ (three-dot menu) → Configure → Manage DNS records**. Here's the safe sequence to flip hosting without downtime.

### Pre-flight (do these first, before touching anything)

1. **Screenshot your current DNS records** in Lovable's DNS manager. Specifically capture any **MX**, **TXT** (SPF/DKIM/DMARC), or **CNAME** records — these are for email and unrelated services and must be preserved.
2. **Lower the TTL** on the existing A records (`@` and `www` → `185.158.133.1`) to **300 seconds** if the option is available. Wait ~1 hour before step 1 of the migration so the lower TTL propagates. Skip if Lovable's DNS UI doesn't expose TTL — it just means propagation will be slower (up to a few hours).
3. **Confirm email impact**: if you receive email at `@mercuryrepower.ca`, list the MX records from your screenshot. They will NOT be touched by this migration (only A and CNAME change), but verify they exist before you start.

### Migration sequence (order matters)

**Step 1 — Add domain to Vercel (no live impact yet)**
- In your Vercel project: **Settings → Domains → Add**
- Add both `mercuryrepower.ca` and `www.mercuryrepower.ca`
- Vercel will show the exact records it wants. Expect:
  - Apex (`mercuryrepower.ca`): A record → `76.76.21.21`
  - `www`: CNAME → `cname.vercel-dns.com`
- Vercel will show "Invalid Configuration" until DNS is updated — that's expected. Leave it.

**Step 2 — Update DNS in Lovable**
- **Project Settings → Domains** (in Lovable) → find `mercuryrepower.ca` → **⋯ → Configure → Manage DNS records**
- Edit the **A record for `@`**: change value from `185.158.133.1` → `76.76.21.21`
- Edit the **A record for `www`** (if present) → delete it, then add a new **CNAME for `www`** → `cname.vercel-dns.com`
  (If Lovable's DNS UI won't let you replace an A with a CNAME on `www`, just edit the A record value to `76.76.21.21` — Vercel accepts apex-style A records on subdomains.)
- **Do NOT touch** any MX, TXT, or other CNAME records.

**Step 3 — Wait & verify (5 min to a few hours)**
- Watch Vercel's Domains page: status flips from "Invalid Configuration" → "Valid Configuration" → SSL issued.
- Verify with: `curl -I https://mercuryrepower.ca/repower` — `server:` header should show `Vercel`.
- Verify all 8 prerendered routes return distinct content (not the homepage).

**Step 4 — Release the domain in Lovable (LAST step)**
- Once `curl` confirms Vercel is serving and SSL is green, go back to **Lovable Project Settings → Domains** and **remove** `mercuryrepower.ca` and `www.mercuryrepower.ca`.
- This releases Lovable's claim on the SSL cert. Doing this BEFORE Vercel is live = downtime for users still hitting cached DNS.

### What I'll do for you

I cannot click buttons in the Lovable or Vercel dashboards, edit DNS, or move domains — those are dashboard-only actions on your account. After you complete the migration, I can:

- Run `curl` checks against all 8 routes to confirm Vercel is serving the right per-route HTML and JSON-LD schemas.
- Compare SHAs across routes to prove they're distinct (not all returning the homepage).
- Verify Googlebot user-agent gets the prerendered content with FAQ/Service schema present.

### If Lovable's DNS UI is missing or limited

Some Lovable-purchased domains expose full DNS editing; some don't. If you can't find the **Manage DNS records** option, or it won't let you change the A record value:
- Open a Lovable support ticket asking them to either (a) update the apex A record to `76.76.21.21` and add a CNAME `www → cname.vercel-dns.com`, or (b) transfer the domain to a registrar with full DNS control (Cloudflare Registrar is free at cost, takes 5–7 days).

### Fallback during transition

`quote.harrisboatworks.ca` is already serving the correct prerendered build on Vercel. If anything goes wrong mid-migration, that subdomain stays up — crawlers and any direct-link traffic still see the SEO-correct content. No need to rush or panic.

