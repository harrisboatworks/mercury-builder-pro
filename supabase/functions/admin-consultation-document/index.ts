import { requireAdmin } from "../_shared/admin-auth.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.53.1";

import { corsHeaders as sharedCorsHeaders } from "../_shared/cors.ts";
import { isAllowedOrigin } from "../_shared/origin-check.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  ConsultationDocumentRequestError,
  ConsultationDocumentUnavailableError,
} from "../_shared/consultation-document-policy.ts";
import {
  createSupabaseAdminConsultationDocumentStore,
  handleAdminConsultationDocument,
  type AdminConsultationQuoteEmailPayload,
} from "../_shared/consultation-admin-document.ts";

function responseHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  return {
    ...sharedCorsHeaders,
    "Access-Control-Allow-Origin": origin && isAllowedOrigin(req)
      ? origin
      : "https://www.mercuryrepower.ca",
    "Cache-Control": "no-store, max-age=0",
    "Vary": "Origin",
  };
}

function jsonResponse(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders(req), "Content-Type": "application/json" },
  });
}

function notFound(req: Request): Response {
  return jsonResponse(req, { error: "Not found" }, 404);
}

async function sendPersistedConsultationQuoteEmail(
  payload: AdminConsultationQuoteEmailPayload,
): Promise<boolean> {
  const result = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-quote-email`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  try {
    const sent = await result.json();
    return result.ok && sent?.success === true;
  } catch {
    return false;
  }
}

// Staff actions resolve only persisted quote/document bindings. Neither callers
// nor a restored builder may supply a replacement PDF, price, or recipient.
async function adminDocumentAction(req: Request, service: SupabaseClient, body: Record<string, unknown>) {
  return handleAdminConsultationDocument({
    req,
    body,
    authorize: (request) => requireAdmin(request, responseHeaders(request)),
    checkRateLimit: (request, userId) => checkRateLimit(request, {
      action: 'consultation_document_admin',
      identifier: userId,
      maxAttempts: 30,
      windowMinutes: 15,
      failClosed: true,
    }),
    rateLimitedResponse: () => rateLimitedResponse(responseHeaders(req), 60),
    jsonResponse: (payload, status) => jsonResponse(req, payload, status),
    store: createSupabaseAdminConsultationDocumentStore(service),
    mailer: { sendQuoteEmail: sendPersistedConsultationQuoteEmail },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return isAllowedOrigin(req)
    ? new Response(null, { status: 204, headers: responseHeaders(req) })
    : jsonResponse(req, { error: 'Forbidden origin' }, 403);
  if (req.method !== 'POST') return jsonResponse(req, { error: 'Method not allowed' }, 405);
  if (!isAllowedOrigin(req)) return jsonResponse(req, { error: 'Forbidden origin' }, 403);
  try {
    const body = await req.json();
    if (!body || !['admin-download', 'admin-share', 'admin-email'].includes(body.action)) {
      return jsonResponse(req, { error: 'Invalid action' }, 400);
    }
    const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return await adminDocumentAction(req, service, body);
  } catch (error) {
    if (error instanceof ConsultationDocumentUnavailableError) return notFound(req);
    if (error instanceof ConsultationDocumentRequestError) return jsonResponse(req, { error: 'Invalid request' }, 400);
    console.error('admin-consultation-document failed', error instanceof Error ? error.name : 'unknown');
    return jsonResponse(req, { error: 'Quote document unavailable' }, 500);
  }
});
