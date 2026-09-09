/**
 * Typecheck-only stand-in for `deno.land/std@0.168.0|0.190.0/http/server.ts`.
 *
 * Every current Edge caller imports `{ serve }` and passes a single handler.
 * Runtime still loads std from deno.land; this file is reached only through
 * `supabase/functions/deno.check.json`.
 *
 * Drift: a new export or a `serve(handler, options)` call would fail this
 * check (missing export / extra args), which is the intended signal. Handler
 * arity beyond `(Request, optional connInfo)` is not modeled.
 */
export type ServeHandler = (
  request: Request,
  connInfo?: { localAddr: Deno.Addr; remoteAddr: Deno.Addr },
) => Response | Promise<Response>;

export function serve(handler: ServeHandler): void {
  Deno.serve((request) => handler(request));
}
