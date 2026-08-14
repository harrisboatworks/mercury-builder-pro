import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { requireAdmin } from "../_shared/admin-auth.ts";
import {
  forbiddenAdminBrowserOrigin,
  resolveAdminBrowserCors,
} from "../_shared/admin-browser-cors.ts";
import { issueDropboxOAuthState } from "../_shared/dropbox-oauth-state.ts";
import { getDropboxAccessToken } from "../_shared/dropbox-token.ts";

async function readAction(req: Request): Promise<string> {
  const queryAction = new URL(req.url).searchParams.get("action");
  if (queryAction) return queryAction;
  if (req.method !== "POST") return "config";
  try {
    const body = await req.json();
    return typeof body?.action === "string" ? body.action : "config";
  } catch {
    return "config";
  }
}

serve(async (req) => {
  const { origin, headers: corsHeaders } = resolveAdminBrowserCors(req, "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return origin ? new Response(null, { headers: corsHeaders }) : forbiddenAdminBrowserOrigin(corsHeaders);
  }
  if (!origin) return forbiddenAdminBrowserOrigin(corsHeaders);

  const admin = await requireAdmin(req, corsHeaders);
  if (admin instanceof Response) return admin;

  try {
    const appKey = Deno.env.get("DROPBOX_APP_KEY") || "";
    const appSecret = Deno.env.get("DROPBOX_APP_SECRET") || "";
    if (!appKey) {
      return new Response(JSON.stringify({ error: "Dropbox app key not configured", appKey: null }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } },
    );
    const { accessToken, expiresAt } = await getDropboxAccessToken(supabase);
    const connected = Boolean(accessToken);
    const action = await readAction(req);

    if (action === "oauth-url") {
      if (!appSecret) {
        return new Response(JSON.stringify({ error: "Dropbox OAuth is not configured" }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const redirectUri = `${origin}/admin/motor-images`;
      const state = await issueDropboxOAuthState(
        { sub: admin.userId, origin, redirectUri },
        appSecret,
      );
      const oauthUrl = new URL("https://www.dropbox.com/oauth2/authorize");
      oauthUrl.search = new URLSearchParams({
        client_id: appKey,
        response_type: "code",
        token_access_type: "offline",
        redirect_uri: redirectUri,
        state,
      }).toString();

      return new Response(JSON.stringify({
        oauthUrl: oauthUrl.toString(),
        state,
        redirectUri,
        hasOAuth: true,
        connected,
        expiresAt,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      appKey,
      hasOAuth: Boolean(appSecret),
      connected,
      expiresAt,
      success: true,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Dropbox config lookup failed:", error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: "Failed to get Dropbox configuration" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
