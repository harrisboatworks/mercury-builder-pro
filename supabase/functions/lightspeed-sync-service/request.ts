import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";
import { authorizeServerCaller, readServerCallerEnv } from "../_shared/server-caller-auth.ts";
import type { ServerCallerEnv } from "../_shared/server-caller-auth.ts";
import { runServiceSync } from "./sync.ts";

export type ServiceSyncDeps = {
  env?: ServerCallerEnv;
  createDb?: () => { end: () => Promise<unknown> };
  fetch?: typeof fetch;
};

function defaultCreateDb() {
  return postgres(Deno.env.get("SUPABASE_DB_URL")!, { prepare: false, max: 1 });
}

export async function handleLightspeedServiceSync(req: Request, deps: ServiceSyncDeps = {}): Promise<Response> {
  const denied = authorizeServerCaller(req, deps.env ?? readServerCallerEnv());
  if (denied) return denied;
  const sql = (deps.createDb ?? defaultCreateDb)();
  try {
    return await runServiceSync(req, sql, deps.fetch ?? fetch);
  } finally {
    await sql.end();
  }
}
