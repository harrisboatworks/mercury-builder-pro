import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Missing authorization code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientKey = Deno.env.get("TIKTOK_CLIENT_KEY");
    const clientSecret = Deno.env.get("TIKTOK_CLIENT_SECRET");

    if (!clientKey || !clientSecret) {
      console.error("TikTok credentials not configured");
      return new Response(
        JSON.stringify({ error: "TikTok integration not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange authorization code for access token
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: "https://mercuryrepower.ca/auth/tiktok/callback",
      }),
    });

    const tokenData = await tokenRes.json();
    console.log("TikTok token response status:", tokenRes.status);

    if (tokenData.error || !tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || "Token exchange failed";
      console.error("TikTok token error:", errMsg);
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client to store tokens
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the calling user is an admin (if auth header present)
    let userId: string | null = null;
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await anonClient.auth.getUser();
      if (user) {
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "Unauthorized: admin access required" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userId = user.id;
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate expiration
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 86400) * 1000).toISOString();

    // Upsert token (replace existing token for this user)
    const { error: dbError } = await adminClient
      .from("tiktok_tokens")
      .upsert(
        {
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
          expires_at: expiresAt,
          scope: tokenData.scope || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (dbError) {
      console.error("DB error storing token:", dbError);
      // Fallback: try insert if upsert fails (no unique constraint on user_id yet)
      const { error: insertError } = await adminClient
        .from("tiktok_tokens")
        .insert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || "",
          expires_at: expiresAt,
          scope: tokenData.scope || "",
        });

      if (insertError) {
        console.error("Insert fallback error:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to store TikTok tokens" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("TikTok tokens stored successfully for user:", userId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("TikTok callback error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
