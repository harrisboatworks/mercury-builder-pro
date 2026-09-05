import { requireAdmin } from "../_shared/admin-auth.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.53.1";

import { corsHeaders as sharedCorsHeaders } from "../_shared/cors.ts";
import { isAllowedOrigin } from "../_shared/origin-check.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS,
  CONSULTATION_DOCUMENTS_BUCKET,
  ConsultationDocumentRequestError,
  ConsultationDocumentUnavailableError,
  parseConsultationDocumentId,
  assertConsultationStoredDocument,
  createConsultationAccessToken,
  consultationCapabilityExpiry,
  consultationDocumentAccessUrl,
  sha256Hex,
  validateQuotePdf,
} from "../_shared/consultation-document-policy.ts";

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

// Staff actions resolve only persisted quote/document bindings. Neither callers
// nor a restored builder may supply a replacement PDF, price, or recipient.
async function adminDocumentAction(req: Request, service: SupabaseClient, body: Record<string, unknown>) {
  const authorization = await requireAdmin(req, responseHeaders(req));
  if (authorization instanceof Response) return authorization;
  const allowed = await checkRateLimit(req, {
    action: 'consultation_document_admin', identifier: authorization.userId,
    maxAttempts: 30, windowMinutes: 15, failClosed: true,
  });
  if (!allowed) return rateLimitedResponse(responseHeaders(req), 60);
  let quoteId = parseConsultationDocumentId(body.quoteId);
  const { data: saved } = await service.from('saved_quotes')
    .select('converted_to_quote_id, quote_state').eq('id', quoteId).maybeSingle();
  if (saved) {
    if (saved.quote_state?.source !== 'consultation-submit') throw new ConsultationDocumentUnavailableError();
    quoteId = parseConsultationDocumentId(saved.converted_to_quote_id || saved.quote_state?.customerQuoteId);
  }
  const { data: document, error } = await service.from('consultation_documents')
    .select('id, storage_key, sha256, byte_size, content_type, quote_number, delivery_snapshot')
    .eq('customer_quote_id', quoteId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error || !document) throw new ConsultationDocumentUnavailableError();
  const binding = assertConsultationStoredDocument({
    documentId: document.id, storageKey: document.storage_key, sha256: document.sha256,
    byteSize: document.byte_size, contentType: document.content_type,
  });
  const { data: object, error: objectError } = await service.storage.from(CONSULTATION_DOCUMENTS_BUCKET).download(binding.path);
  if (objectError || !object) throw new ConsultationDocumentUnavailableError();
  const bytes = new Uint8Array(await object.arrayBuffer());
  validateQuotePdf(bytes, document.content_type);
  if (bytes.length !== document.byte_size || await sha256Hex(bytes) !== binding.sha256) {
    throw new ConsultationDocumentUnavailableError();
  }
  if (body.action === 'admin-download') {
    const { data: signed, error: signError } = await service.storage.from(CONSULTATION_DOCUMENTS_BUCKET)
      .createSignedUrl(binding.path, CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS, { download: `Quote-${document.quote_number}.pdf` });
    if (signError || !signed?.signedUrl) throw new ConsultationDocumentUnavailableError();
    return jsonResponse(req, { signedUrl: signed.signedUrl, expiresIn: CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS });
  }
  const { token, tokenHash } = await createConsultationAccessToken();
  const expiresAt = consultationCapabilityExpiry();
  const snapshot = document.delivery_snapshot;
  const { error: capabilityError } = await service.from('consultation_document_capabilities').insert({
    document_id: document.id, token_hash: tokenHash, purpose: 'send_email',
    bound_email: snapshot.customerEmail, bound_phone: snapshot.customerPhone, expires_at: expiresAt,
  });
  if (capabilityError) throw new ConsultationDocumentUnavailableError();
  const documentAccessUrl = consultationDocumentAccessUrl(token);
  if (body.action === 'admin-share') return jsonResponse(req, { documentAccessUrl, expiresAt });
  const result = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-quote-email`, {
    method: 'POST', headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerEmail: snapshot.customerEmail, customerName: snapshot.customerName,
      quoteNumber: document.quote_number, motorModel: snapshot.motorModel, totalPrice: snapshot.totalPrice,
      emailType: 'quote_delivery', documentId: document.id, documentAccessUrl,
    }),
  });
  const sent = await result.json();
  if (!result.ok || sent?.success !== true) {
    await service.from('consultation_document_capabilities').update({ revoked_at: new Date().toISOString() }).eq('token_hash', tokenHash);
    return jsonResponse(req, { error: 'Quote email could not be sent' }, 502);
  }
  return jsonResponse(req, { success: true });
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
