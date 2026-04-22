

## Diagnose & Fix Vercel Prerender Silent-Fail

The Wave D `robots.txt` and `.well-known` fixes are now live in production, but per-route prerendering is still not running on Vercel — every route serves the same 83 KB SPA shell. Before I touch code again, I need to confirm which failure mode is happening.

### Step 1 — You check Vercel (2 minutes, no code)

1. Open Vercel dashboard → this project → **Settings → Environment Variables**.
   - Confirm `STRICT_PRERENDER=1` exists in **Production** scope.
   - If missing: add it, then **Deployments → ⋯ → Redeploy** the latest production deploy.
2. Open the most recent production **Build Logs** and search for `[prerender]`.
   - Copy any line containing `[prerender]` (success, warn, fail, or fatal) and paste it back to me.

This tells me whether the prerender script is even being invoked and, if so, where it's dying.

### Step 2 — I fix based on what the build log shows

Three branches, depending on what you find:

**Branch A — `STRICT_PRERENDER` was missing**
- Adding it + redeploying will make the build fail loudly on the next attempt with the real error.
- I then fix whatever the real error is (Branch B or C).

**Branch B — `[prerender] FATAL: failed to launch Chromium: …`**
- `@sparticuz/chromium` binary mismatch with Vercel's Node 20 / Amazon Linux 2023 build image.
- Fix: pin `@sparticuz/chromium@138` (current tested-against-Vercel version) and `puppeteer-core@23.x`. Add `NODE_OPTIONS=--max-old-space-size=4096` to the build env so the 50 MB binary extracts cleanly.

**Branch C — `[prerender] FAIL /route: …` for specific routes**
- Page-level error (e.g., Supabase fetch timeout during prerender, missing env var, hydration crash).
- Fix per route: increase `networkidle2` timeout, add fetch-failure tolerance to the wait condition, or stub the offending data fetch when `navigator.userAgent` matches `LovablePrerender`.

### Step 3 — Re-verify (I run automatically after the fix deploys)

Same acceptance suite as today, expecting:
- 8 distinct SHAs across the 8 routes (not all `d29dd04e…`)
- `/faq` HTML contains `"@type":"FAQPage"` with the photo-ID Q&A inside `mainEntity`
- `/repower` HTML contains `"@type":"Service"` with `DeliveryModePickUp` (already present from global schema, but should now also appear in the route-specific block)
- Each route's `<title>` is route-specific
- Every prerendered file ≥ 50 KB

### Optional cleanup while we're here

Once prerender works, send me your real Bing verification token and I'll swap `BING_VERIFICATION_TBD` in `index.html` (one-line change).

### What I need from you to proceed

Either:
- (a) the `[prerender]` lines from the Vercel build log, OR
- (b) confirmation that `STRICT_PRERENDER=1` was missing and you've now added it + redeployed (then send me the new build log)

Without one of these I'd be guessing between Branches B and C, and `@sparticuz/chromium` version churn is the kind of fix that needs evidence before I bump pins.

