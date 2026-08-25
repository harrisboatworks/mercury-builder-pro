import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  CONSULTATION_RETENTION_BATCH,
  applyConsultationRetention,
  createSupabaseConsultationRetentionStore,
  planConsultationRetention,
  type ConsultationRetentionDocument,
  type ConsultationRetentionJob,
} from "../_shared/consultation-document-retention.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.mercuryrepower.ca",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  const allowed = await checkRateLimit(req, {
    action: "consultation_document_retention_ip",
    maxAttempts: 12,
    windowMinutes: 60,
    failClosed: true,
  });
  if (!allowed) return rateLimitedResponse(corsHeaders, 60);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const now = new Date();

    const { data: jobRows, error: jobError } = await supabase
      .from("consultation_document_jobs")
      .select("id, status, document_id, storage_key, updated_at")
      .in("status", ["started", "failed"])
      .order("updated_at", { ascending: true })
      .limit(CONSULTATION_RETENTION_BATCH);
    if (jobError) throw jobError;

    const { data: documentRows, error: documentError } = await supabase
      .from("consultation_documents")
      .select("id, storage_key, created_at, consultation_document_capabilities(id, expires_at, revoked_at)")
      .order("created_at", { ascending: true })
      .limit(CONSULTATION_RETENTION_BATCH);
    if (documentError) throw documentError;

    const jobs: ConsultationRetentionJob[] = (jobRows || []).map((row) => ({
      id: String(row.id),
      status: row.status,
      documentId: row.document_id ? String(row.document_id) : null,
      storageKey: row.storage_key ? String(row.storage_key) : null,
      updatedAt: String(row.updated_at),
    }));

    const documents: ConsultationRetentionDocument[] = (documentRows || []).map((row) => {
      const capabilities = Array.isArray(row.consultation_document_capabilities)
        ? row.consultation_document_capabilities
        : [];
      return {
        id: String(row.id),
        storageKey: String(row.storage_key),
        createdAt: String(row.created_at),
        capabilities: capabilities.map((capability) => ({
          id: String(capability.id),
          expiresAt: String(capability.expires_at),
          revokedAt: capability.revoked_at ? String(capability.revoked_at) : null,
        })),
      };
    });

    const actions = planConsultationRetention({ now, jobs, documents });
    const summary = await applyConsultationRetention(
      actions,
      createSupabaseConsultationRetentionStore(supabase),
      now,
    );

    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      "consultation-document-retention failed",
      error instanceof Error ? error.name : "unknown",
    );
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
