

## Fix Vercel Prerender — Switch to Bundled Puppeteer

The build log confirms the failure mode: `@sparticuz/chromium` extracts to `/tmp/chromium`, then Chromium can't load `libnss3.so` because Vercel's **build container** (Amazon Linux 2023, Node 20) doesn't ship that shared library. `@sparticuz/chromium` is built for the Lambda **runtime**, not the build step.

`puppeteer@24.42.0` is already in `package.json` (it ships its own Chromium with all required `.so` files bundled). I just need to use it.

### Changes

**1. `scripts/prerender.ts` — switch to bundled puppeteer**
- Replace `import puppeteer from 'puppeteer-core'` → `import puppeteer from 'puppeteer'`
- Remove `import chromium from '@sparticuz/chromium'`
- Drop the `resolveExecutablePath()` helper entirely
- `puppeteer.launch()` with no `executablePath` — it uses its bundled Chromium, which includes NSS / NSPR / fontconfig / etc.
- Keep `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage` args
- Keep all existing route loop, JSON-LD wait, sanity-check, and exit-code logic unchanged

**2. `vite.config.ts` — flip default to strict**
- Treat any non-zero prerender exit as a build failure by default in production builds. Local dev already skips via `apply: 'build'`, and contributors who hit a Chromium issue locally can set `SKIP_PRERENDER=1`. Removes dependence on `STRICT_PRERENDER=1` being set in Vercel env.
- (`STRICT_PRERENDER` env var still honored as a no-op for backward compat; the failure becomes the default.)

**3. `package.json` cleanup (post-fix verification)**
- Keep `puppeteer` (now used by prerender)
- Remove `puppeteer-core` and `@sparticuz/chromium` (no longer used anywhere — confirmed with a search before deleting)
- Trade-off: Vercel install adds ~170 MB to `node_modules`, which is build-time only and doesn't affect runtime bundle size or cold-start.

**4. Fix the two unrelated TS errors flagged in the build log**
- `api/cron/google-sheets-sync.ts` → install `@vercel/node` as a dev dep (resolves `error TS2307`)
- `src/lib/securityMiddleware.ts` → verify the `@/integrations/supabase/client` import path resolves (the file exists at `src/integrations/supabase/client.ts`; if the error persists it's likely a `tsconfig` `include` gap — confirm and patch). These don't block the build today but pollute the log.

### Acceptance (run after Vercel redeploys)

```bash
# 1. Build log should now show:
#    [prerender] ✓ / → dist/index.html (NN.N KB)
#    [prerender] ✓ /repower → dist/repower/index.html (NN.N KB)
#    ...for all 8 routes
#    [prerender] ✓ all 8 routes prerendered

# 2. Routes serve distinct HTML (8 unique SHAs)
for r in / /repower /faq /about /contact /blog /agents /quote/motor-selection; do
  curl -A "Googlebot" -s "https://mercuryrepower.ca$r" | shasum
done

# 3. Schema present per route
curl -A "Googlebot" -s https://mercuryrepower.ca/faq     | grep -c '"@type":"FAQPage"'   # expect ≥1
curl -A "Googlebot" -s https://mercuryrepower.ca/repower | grep -c 'DeliveryModePickUp'  # expect ≥1

# 4. Each prerendered file ≥ 50 KB (script enforces, build fails otherwise)
```

### Risk
- Larger `node_modules` on Vercel build (~170 MB add). Build time +~30s for the puppeteer Chromium download on cold installs (cached after first build).
- If puppeteer's bundled Chromium fails to download on Vercel (rare; happens when `PUPPETEER_SKIP_DOWNLOAD=1` is set anywhere): build fails loudly with a clear error — much better than today's silent shell-shipping.

### Optional, only if you want it now
- Send your real Bing verification token; one-line swap of `BING_VERIFICATION_TBD` in `index.html`.

