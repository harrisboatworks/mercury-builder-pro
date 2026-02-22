import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Edge function proxy for anonymous voice session access.
 * 
 * RLS cannot read HTTP headers, so anonymous users must go through this
 * edge function which validates session_id ownership server-side before
 * querying with service_role.
 * 
 * Actions:
 *   - list:   Load previous sessions by session_id
 *   - update: End a session / update motor context (requires record id + session_id match)
 */

// Validate session_id format: voice_<32 hex chars>
const SESSION_ID_RE = /^voice_[a-f0-9]{32}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, session_id } = body;

    // ── Validate session_id ──────────────────────────────────
    if (!session_id || typeof session_id !== "string" || !SESSION_ID_RE.test(session_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Also check if the caller is authenticated (optional)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data } = await userClient.auth.getUser();
      userId = data?.user?.id ?? null;
    }

    // ── LIST: load previous sessions ─────────────────────────
    if (action === "list") {
      const limit = Math.min(Math.max(Number(body.limit) || 5, 1), 20);

      let query = admin
        .from("voice_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq("user_id", userId);
      } else {
        query = query.eq("session_id", session_id);
      }

      const { data: sessions, error } = await query;

      if (error) {
        console.error("Error loading voice sessions:", error);
        return new Response(
          JSON.stringify({ error: "Failed to load sessions" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ sessions: sessions || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── UPDATE: update an existing session ────────────────────
    if (action === "update") {
      const { record_id, updates } = body;

      if (!record_id || typeof record_id !== "string") {
        return new Response(
          JSON.stringify({ error: "Missing record_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(record_id)) {
        return new Response(
          JSON.stringify({ error: "Invalid record_id format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Only allow safe fields to be updated
      const allowedFields = ["ended_at", "duration_seconds", "messages_exchanged", "end_reason", "summary", "motor_context"];
      const safeUpdates: Record<string, unknown> = {};
      if (updates && typeof updates === "object") {
        for (const key of allowedFields) {
          if (key in updates) {
            safeUpdates[key] = updates[key];
          }
        }
      }

      if (Object.keys(safeUpdates).length === 0) {
        return new Response(
          JSON.stringify({ error: "No valid fields to update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Verify ownership: the record must belong to this session_id
      const { data: existing, error: lookupError } = await admin
        .from("voice_sessions")
        .select("id, session_id, user_id")
        .eq("id", record_id)
        .single();

      if (lookupError || !existing) {
        return new Response(
          JSON.stringify({ error: "Session not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Ownership check: session_id must match (or user_id for authenticated users)
      const ownsRecord =
        existing.session_id === session_id ||
        (userId && existing.user_id === userId);

      if (!ownsRecord) {
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: updateError } = await admin
        .from("voice_sessions")
        .update(safeUpdates)
        .eq("id", record_id);

      if (updateError) {
        console.error("Error updating voice session:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use 'list' or 'update'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Voice sessions proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
