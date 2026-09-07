import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { requireAdmin } from "../_shared/admin-auth.ts";
import {
  forbiddenAdminBrowserOrigin,
  resolveAdminBrowserCors,
} from "../_shared/admin-browser-cors.ts";
import { verifyDropboxOAuthState } from "../_shared/dropbox-oauth-state.ts";

interface DropboxTokenResponse {
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  account_id?: string;
}

serve(async (req) => {
  const { origin, headers: corsHeaders } = resolveAdminBrowserCors(req);
  if (req.method === "OPTIONS") {
    return origin ? new Response(null, { headers: corsHeaders }) : forbiddenAdminBrowserOrigin(corsHeaders);
  }
  if (!origin) return forbiddenAdminBrowserOrigin(corsHeaders);
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = await requireAdmin(req, corsHeaders);
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const state = typeof body?.state === "string" ? body.state : "";
    if (!code || !state) {
      return new Response(JSON.stringify({ error: "Authorization code and state are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appKey = Deno.env.get("DROPBOX_APP_KEY") || "";
    const appSecret = Deno.env.get("DROPBOX_APP_SECRET") || "";
    if (!appKey || !appSecret) {
      return new Response(JSON.stringify({ error: "Dropbox app not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const redirectUri = `${origin}/admin/motor-images`;
    const verifiedState = await verifyDropboxOAuthState(
      state,
      { sub: admin.userId, origin, redirectUri },
      appSecret,
    );
    if (!verifiedState) {
      return new Response(JSON.stringify({ error: "Invalid or expired OAuth state" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenResponse = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${appKey}:${appSecret}`)}`,
      },
      body: new URLSearchParams({ code, grant_type: "authorization_code", redirect_uri: redirectUri }),
    });
    if (!tokenResponse.ok) {
      console.error("Dropbox token exchange failed with status", tokenResponse.status);
      return new Response(JSON.stringify({ error: "Dropbox authorization failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenData = await tokenResponse.json() as DropboxTokenResponse;
    if (!tokenData.access_token) throw new Error("Dropbox token response did not include an access token");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } },
    );
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null;
    const { error: storeError } = await supabase.rpc("store_dropbox_oauth_token", {
      p_token: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_type: tokenData.token_type || "bearer",
        expires_at: expiresAt,
        scope: tokenData.scope || null,
        account_id: tokenData.account_id || null,
        connected_by: admin.userId,
        connected_at: new Date().toISOString(),
      },
    });
    if (storeError) {
      console.error("Dropbox token storage failed:", storeError.message);
      throw new Error("Dropbox token could not be stored securely");
    }

    return new Response(JSON.stringify({ ok: true, connected: true, expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Dropbox OAuth handler failed:", error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: "OAuth exchange failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
