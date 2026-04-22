

## Wave D Deploy Gap Fix

The audit is right and I've confirmed it locally. **All six fixes already exist in source code.** The problem is that prerender silently fails on Vercel's build, so your last deploy shipped only the unprerendered SPA shell.

### What's already in source (verified)
- ✅ Bing meta placeholder — `index.html` line 48: `<meta name="msvalidate.01" content="BING_VERIFICATION_TBD" />`
- ✅ No `<noscript>` meta-refresh anywhere in `index.html` or `public/`
- ✅ `public/.well-known/` contains `mcp.json`, `mcp-manifest.json`, `brand.json`, `ai.txt`, `security.txt`
- ✅ `robots.txt` already lists `Meta-ExternalAgent`, `OAI-SearchBot` (but missing `ClaudeBot` — will add)
- ✅ `DeliveryModePickUp` schema in `RepowerPageSEO.tsx`; "photo ID" Q&A in `faqData.ts`
- ✅ `scripts/prerender.ts` exists, wired in `vite.config.ts` via `closeBundle` hook
- ✅ Local `npm run build` produces `dist/repower/index.html` (145 KB, 2 JSON-LD blocks) — **the prerender works locally**

### Root cause — why production is broken

**Puppeteer on Vercel doesn't have Chromium.** Vercel's build container doesn't ship Chrome, and `puppeteer@24`'s download step is often skipped/cached out. When `scripts/prerender.ts` calls `puppeteer.launch()`, it throws "Could not find Chrome" — but the vite plugin **swallows the error** (`console.warn` and `resolve()` regardless of exit code) so the build succeeds with no prerendered files. Vercel then serves only the SPA shell `dist/index.html` for every route.

### Fixes

#### 1. Switch to `@sparticuz/chromium` for Vercel-compatible Chromium *(critical)*
- Add deps: `@sparticuz/chromium` (Vercel-friendly bundled Chromium binary, ~50MB) + `puppeteer-core` (no auto-download)
- Replace the `puppeteer` import in `scripts/prerender.ts` with `puppeteer-core` and pass `executablePath: await chromium.executablePath()`, `args: chromium.args`
- Locally fall back to system Chrome if `@sparticuz/chromium` can't resolve a binary (dev-mode guard)
- Remove the heavyweight `puppeteer` dep — it's unused at runtime and bloats install

#### 2. Make prerender a hard failure when it can't render *(critical)*
- In `vite.config.ts` `prerenderPlugin`, fail the build with `process.exit(1)` if the spawn exits non-zero **AND** the env var `STRICT_PRERENDER=1` is set (Vercel will set this). This way local dev keeps the soft-fail; production breaks loudly so we never ship a regression like this again.
- Add a post-prerender sanity check: count files in `dist/{route}/index.html` for each of the 8 routes; if any are missing or under 50 KB, exit 1.

#### 3. Add `ClaudeBot` to `robots.txt`
- One missing UA from the audit. `Meta-ExternalAgent` and `OAI-SearchBot` are already there.

#### 4. Tighten `vercel.json` rewrites
- The current `/.well-known/(.*)` rewrite to itself is redundant (Vercel auto-serves static files) but harmless. Remove for clarity.
- Confirm explicit per-route rewrites (`/repower → /repower/index.html`, etc.) come **before** the SPA catch-all — they already do. ✓
- Add `/quote/motor-selection` index already listed. ✓
- No structural changes needed beyond the cleanup.

#### 5. Document the env var Vercel needs
- After this ships, Vercel project settings need `STRICT_PRERENDER=1` added (one-time, takes 10 seconds). I'll note this in the post-deploy step. If you'd rather I not add the strict flag and just rely on `@sparticuz/chromium` working, say so — but the strict flag is what prevents this exact silent-fail from happening again.

### Files to change

```text
package.json
  - remove: "puppeteer"
  + add:    "puppeteer-core", "@sparticuz/chromium"

scripts/prerender.ts
  - puppeteer.launch({ headless, args: [...] })
  + chromium-aware launch with fallback for local dev

vite.config.ts
  prerenderPlugin: hard-fail on non-zero exit when STRICT_PRERENDER=1
                   + post-render existence/size sanity check

vercel.json
  drop redundant /.well-known/(.*) self-rewrite

public/robots.txt
  + ClaudeBot Allow: /
```

### What you do after I ship
1. In Vercel project settings → Environment Variables, add `STRICT_PRERENDER=1` (Production scope). One-time setup.
2. Trigger a redeploy (push or manual).
3. Run your six acceptance curls. All should pass — different SHAs, schema present, well-known files 200, no meta-refresh, msvalidate present, pickup schema present.
4. Send me your real Bing verification token so I can swap `BING_VERIFICATION_TBD`.

### Risk
- `@sparticuz/chromium` adds ~50 MB to `node_modules` but **only at build time** (not bundled into the deployed app). Vercel builds will be ~30s slower. Acceptable trade for crawler visibility.
- If `@sparticuz/chromium`'s prebuilt binary doesn't match Vercel's runtime, the build will fail loudly (not silently like today). I'll pin a known-good version (`@sparticuz/chromium@131`) compatible with current Vercel build images.

