/** Typecheck-only. Vitest loads the real Deno module via package.json#imports. */
export function isAllowedOrigin(req: Request): boolean;
export function forbiddenOriginResponse(corsHeaders: Record<string, string>): Response;
export function isServiceRoleBearer(req: Request): boolean;
export function authenticatedBrowserCors(req: Request): {
  allowedOrigin: string | null;
  headers: Record<string, string>;
  forbiddenOrigin: boolean;
};
