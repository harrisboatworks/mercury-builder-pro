# Agent artifact canonicalization

The agent-facing business facts are generated from two canonical inputs:

- `src/data/google-places-cache.json`, refreshed from the official Harris Boat Works Google Business Profile during the production build. It owns coordinates, public rating/review count, and opening hours.
- `src/data/finance-policy.json`, which owns the active Mercury headline APR, expiry, standard post-promo tiers, minimum financed amount, and DealerPlan fee.

`scripts/sync-agent-facts.mjs` updates `brand.json`, `mcp.json`, `llms.txt`, and `ai.txt` before Vite builds. `scripts/growth-agent-live-check.mjs` compares published coordinates with live Google Places, checks UCP/Verado/financing/endpoint semantics, and compares public motors API prices with the published pricing reference.

## Automatic rebuild after database changes

Migration `20260715164000_trigger_agent_artifact_rebuild_on_motor_models_change.sql` records statement-level changes to `motor_models`, debounces bulk updates for two minutes, and dispatches one Vercel rebuild through `pg_net`.

Production requires a Supabase Vault secret named `vercel_pricing_deploy_hook_url`. Its value is the production deploy hook for `mercury-builder-pro`; do not commit or print it. If absent, the request remains pending and the dispatcher logs a warning.

Verify after setup:

1. `last_request_id` and `last_dispatched_at` are populated after a catalog change.
2. Vercel produces one deployment after the two-minute debounce.
3. `npm run growth:check` passes against production.
