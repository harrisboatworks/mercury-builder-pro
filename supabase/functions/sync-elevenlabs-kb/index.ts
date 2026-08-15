import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Legacy endpoint retained so the existing hourly scheduler and admin links do
 * not fail. Customer-changing facts are deliberately not copied into RAG:
 * prices, stock, financing, promotions, hours, and policies are supplied by
 * live tools and the per-session shared customer-knowledge snapshot.
 *
 * Long-form articles and stable company guidance are managed separately by
 * sync-elevenlabs-static-kb, which waits for RAG indexing before attachment.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  return new Response(JSON.stringify({
    success: true,
    deprecated: true,
    dynamicAuthority: "live-tools-and-session-knowledge",
    staticAuthority: "sync-elevenlabs-static-kb",
    message: "No hourly inventory KB write performed.",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
