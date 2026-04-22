

## Save hosting model as a Core project rule

No code change. Just persisting the hosting/deploy model to memory so I never re-propose Lovable as production or try to reconnect the domain.

### Memory updates

**1. New file: `mem://infrastructure/hosting-and-deploy-model.md`**

Records the production hosting setup:
- Production host: **Vercel**, deployed from GitHub repo `harrisboatworks/mercury-builder-pro`
- Lovable's role: code editor only — pushes to GitHub, Vercel auto-deploys from `main`
- Production domain: `mercuryrepower.ca` (DNS at IONOS → Vercel: apex A `216.150.1.1`, www CNAME `e9563c91757c0a64.vercel-dns-017.com`)
- Lovable custom-domain binding: removed (do not re-add)
- Staging: `.lovable.app` preview URL (Lovable-hosted)
- To change the live site: edit code → commit pushes to GitHub → Vercel deploys
- Static prerender: handled by `scripts/static-prerender.mjs` during `vite build` on Vercel
- **Why:** Lovable hosting served a plain SPA shell (no per-route prerendering). Vercel runs the prerender script and serves the 8 stamped HTML files needed for SEO/AI discovery.

**2. Update `mem://index.md` Core section**

Add one line so it's applied to every action:
```
Production hosting is Vercel (from GitHub repo harrisboatworks/mercury-builder-pro). Lovable = code editor only. Never reconnect domain to Lovable.
```

All existing Core rules and Memories list preserved exactly.

### What this changes for future requests

- "Update the live site" → I make a code change, it commits to GitHub, Vercel deploys. No Lovable publish step matters for production.
- I won't suggest reconnecting `mercuryrepower.ca` to Lovable, won't propose Lovable-side domain configuration, and won't treat the `.lovable.app` URL as production.
- SEO/prerender changes → edit `scripts/static-prerender.mjs` or `vercel.json`; verify by checking the Vercel deploy, not the Lovable preview.

