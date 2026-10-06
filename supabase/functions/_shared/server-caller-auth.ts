export type ServerCallerEnv = {
  serviceRoleKey?: string | null;
  edgeInternalSecret?: string | null;
  cronSecret?: string | null;
};

function nonempty(value: string | null | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function authorizeServerCaller(req: Request, env: ServerCallerEnv): Response | null {
  const serviceRoleKey = nonempty(env.serviceRoleKey);
  const internalSecret = nonempty(env.edgeInternalSecret) ?? nonempty(env.cronSecret);
  const serviceRoleMatch = serviceRoleKey !== null && req.headers.get("Authorization") === `Bearer ${serviceRoleKey}`;
  const internalMatch = internalSecret !== null && req.headers.get("x-internal-secret") === internalSecret;
  if (serviceRoleMatch || internalMatch) return null;
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function readServerCallerEnv(
  read: (name: string) => string | undefined = (name) => Deno.env.get(name),
): ServerCallerEnv {
  return {
    serviceRoleKey: read("SUPABASE_SERVICE_ROLE_KEY"),
    edgeInternalSecret: read("EDGE_INTERNAL_SECRET"),
    cronSecret: read("CRON_SECRET"),
  };
}
