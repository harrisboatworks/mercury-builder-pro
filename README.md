# Mercury Repower

Mercury Repower is Harris Boat Works' public Mercury outboard catalogue and quote builder.

## Source and release authority

- GitHub [`harrisboatworks/mercury-builder-pro`](https://github.com/harrisboatworks/mercury-builder-pro) on `main` is the authoritative source.
- HBW's Vercel project is the production release path. Merges and production deployments require explicit authorization.
- [Lovable](https://lovable.dev/projects/bc5f0a45-f6d8-495a-8ac7-81047b4a4121) may be used as an optional editor, but do not rely on automatic GitHub synchronization without verifying it first.

## Local setup

Use Node 22, as declared in `engines.node`.

```sh
npm ci --ignore-scripts
npm run dev
```

The Vite development server runs on `http://localhost:8080`.

## Quick validation

For a normal small change, run:

```sh
npm run verify:small
```

This runs TypeScript checking followed by the Vitest suite. To run one test file directly:

```sh
npx vitest run path/to/file.test.ts
```

`npm run build` is the full release/content pipeline, not the routine small-change check. Its lifecycle regenerates and validates many content artifacts, fetches live Google Places data, and runs `scripts/indexnow-ping.mjs` in `postbuild`. Treat it as release-adjacent external work and require the same authorization as a production trigger.

## Generated artifacts

Do not hand-edit files marked as generated. Change the owning source or generator, run the relevant `generate:*`, `rewrite:agent-urls`, or other named generator script from `package.json`, and review the resulting diff before committing it.

## Environment and secrets

- The tracked `.env` is public-only.
- Private local overrides belong in `.env.local`; `*.local` is already ignored.
- Keep secrets in Vercel or Supabase secret storage. Never paste them into shell history, documentation, commits, issues, logs, or model-worker prompts.

## Inventory sync safety

Inventory is synced directly from Lightspeed DMS (the `mercury_motor_inventory` view). The public quote builder must not invoke `sync-lightspeed-inventory`.

For a manual sync, use the authenticated admin Stock Sync or inventory dashboard. Never put an internal secret in frontend code or paste a service-role key into a local curl.

Nightly Lightspeed sync remains a server-side scheduler concern. Changing Edge Function auth or cron is a separate production configuration change.

Inventory sync is production-adjacent. Do not document service-role keys, bearer tokens, customer-private data, or copy-and-paste production requests in this repository. Any manual production trigger or write requires explicit authorization and must use approved stored-secret tooling.
