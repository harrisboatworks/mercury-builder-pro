import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.53.1";

import { corsHeaders as sharedCorsHeaders } from "../_shared/cors.ts";
import { isAllowedOrigin } from "../_shared/origin-check.ts";
import { checkRateLimit, getClientIdentifier, rateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS,
  CONSULTATION_DOCUMENTS_BUCKET,
  ConsultationDocumentRequestError,
  ConsultationDocumentUnavailableError,
  authorizeConsultationRedemption,
  canonicalConsultationDocumentPath,
  consultationCapabilityExpiry,
  consultationDeliverySnapshot,
  consultationDocumentAccessUrl,
  createConsultationAccessToken,
  hashConsultationToken,
  parseConsultationMultipart,
  parseConsultationRedeemRequest,
  sha256Hex,
  type ConsultationUploadMeta,
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

function internalHeaders(serviceRoleKey: string): HeadersInit {
  const internalSecret = Deno.env.get("EDGE_INTERNAL_SECRET") || Deno.env.get("CRON_SECRET") || "";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${serviceRoleKey}`,
    "apikey": serviceRoleKey,
    ...(internalSecret ? { "x-internal-secret": internalSecret } : {}),
  };
}

async function requireExistingCustomerQuote(
  service: SupabaseClient,
  customerQuoteId: string,
): Promise<void> {
  const { data, error } = await service
    .from("customer_quotes")
    .select("id")
    .eq("id", customerQuoteId)
    .maybeSingle();
  if (error || !data?.id) {
    throw new ConsultationDocumentRequestError("Customer quote is required");
  }
}

async function persistConsultationDocument(options: {
  service: SupabaseClient;
  meta: ConsultationUploadMeta;
  pdfBytes: Uint8Array;
}): Promise<{ documentId: string; token: string }> {
  const { service, meta, pdfBytes } = options;
  if (meta.flow === "submit") {
    if (!meta.customerQuoteId) {
      throw new ConsultationDocumentRequestError("Customer quote is required");
    }
    await requireExistingCustomerQuote(service, meta.customerQuoteId);
  }

  const documentId = crypto.randomUUID();
  const storageKey = canonicalConsultationDocumentPath(documentId);
  const digest = await sha256Hex(pdfBytes);
  const { token, tokenHash } = await createConsultationAccessToken();
  const snapshot = consultationDeliverySnapshot(meta);

  const { error: insertError } = await service.from("consultation_documents").insert({
    id: documentId,
    customer_quote_id: meta.customerQuoteId,
    storage_key: storageKey,
    sha256: digest,
    byte_size: pdfBytes.byteLength,
    content_type: "application/pdf",
    quote_number: meta.quoteNumber,
    delivery_snapshot: snapshot,
  });
  if (insertError) throw new Error("Unable to store consultation document");

  const { error: uploadError } = await service.storage
    .from(CONSULTATION_DOCUMENTS_BUCKET)
    .upload(storageKey, pdfBytes, {
      contentType: "application/pdf",
      cacheControl: "60",
      upsert: false,
    });
  if (uploadError) throw new Error("Unable to store consultation document");

  const { error: capabilityError } = await service.from("consultation_document_capabilities").insert({
    document_id: documentId,
    token_hash: tokenHash,
    purpose: meta.flow,
    bound_email: snapshot.customerEmail,
    bound_phone: snapshot.customerPhone,
    expires_at: consultationCapabilityExpiry(),
  });
  if (capabilityError) throw new Error("Unable to create consultation access");

  return { documentId, token };
}

async function deliverConsultationDocument(options: {
  req: Request;
  supabaseUrl: string;
  serviceRoleKey: string;
  meta: ConsultationUploadMeta;
  documentId: string;
  token: string;
}): Promise<void> {
  const documentAccessUrl = consultationDocumentAccessUrl(options.token);
  const headers = internalHeaders(options.serviceRoleKey);

  if (options.meta.flow === "send_sms") {
    const message =
      `Hi ${options.meta.customerName}! Here's your Mercury motor quote for ${options.meta.motorModel}: ${documentAccessUrl} - Harris Boat Works`;
    const response = await fetch(`${options.supabaseUrl}/functions/v1/send-sms`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: options.meta.customerPhone,
        message,
        messageType: "quote_confirmation",
        auditMessage: `Consultation quote ${options.meta.quoteNumber} access link sent`,
      }),
    });
    if (!response.ok) throw new Error("Consultation SMS delivery failed");
    return;
  }

  const response = await fetch(`${options.supabaseUrl}/functions/v1/send-quote-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customerEmail: options.meta.customerEmail,
      customerName: options.meta.customerName,
      quoteNumber: options.meta.quoteNumber,
      motorModel: options.meta.motorModel,
      totalPrice: options.meta.totalPrice,
      emailType: "quote_delivery",
      documentId: options.documentId,
      documentAccessUrl,
    }),
  });
  if (!response.ok) throw new Error("Consultation email delivery failed");
}

async function redeemConsultationDocument(options: {
  req: Request;
  service: SupabaseClient;
  token: string;
}): Promise<Response> {
  const tokenHash = await hashConsultationToken(options.token);
  const ipAllowed = await checkRateLimit(options.req, {
    action: "consultation_document_redeem_ip",
    maxAttempts: 20,
    windowMinutes: 15,
    failClosed: true,
  });
  if (!ipAllowed) return rateLimitedResponse(responseHeaders(options.req), 60);

  const tokenAllowed = await checkRateLimit(options.req, {
    identifier: `${getClientIdentifier(options.req)}:${tokenHash}`,
    action: "consultation_document_redeem_token",
    maxAttempts: 10,
    windowMinutes: 15,
    failClosed: true,
  });
  if (!tokenAllowed) return rateLimitedResponse(responseHeaders(options.req), 60);

  const { data: capability, error } = await options.service
    .from("consultation_document_capabilities")
    .select("document_id, token_hash, purpose, bound_email, bound_phone, expires_at, revoked_at, use_count")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error || !capability) throw new ConsultationDocumentUnavailableError();

  const canonicalPath = authorizeConsultationRedemption({
    capability: {
      documentId: capability.document_id,
      tokenHash: capability.token_hash,
      purpose: capability.purpose,
      boundEmail: capability.bound_email,
      boundPhone: capability.bound_phone,
      expiresAt: capability.expires_at,
      revokedAt: capability.revoked_at,
    },
    documentId: capability.document_id,
    tokenHash,
  });

  const { data: signed, error: signedError } = await options.service.storage
    .from(CONSULTATION_DOCUMENTS_BUCKET)
    .createSignedUrl(canonicalPath, CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS, {
      download: `Mercury-Quote-${capability.document_id.slice(0, 8)}.pdf`,
    });
  if (signedError || !signed?.signedUrl) throw new ConsultationDocumentUnavailableError();

  await options.service
    .from("consultation_document_capabilities")
    .update({
      last_used_at: new Date().toISOString(),
      use_count: (Number.isFinite(Number(capability.use_count)) ? Number(capability.use_count) : 0) + 1,
    })
    .eq("token_hash", tokenHash);

  return jsonResponse(options.req, {
    signedUrl: signed.signedUrl,
    expiresIn: CONSULTATION_DOCUMENT_SIGNED_URL_SECONDS,
  });
}

serve(async (req) => {
  const headers = responseHeaders(req);
  if (req.method === "OPTIONS") {
    return isAllowedOrigin(req)
      ? new Response(null, { status: 204, headers })
      : jsonResponse(req, { error: "Forbidden origin" }, 403);
  }
  if (req.method !== "POST") return jsonResponse(req, { error: "Method not allowed" }, 405);
  if (!isAllowedOrigin(req)) return jsonResponse(req, { error: "Forbidden origin" }, 403);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Consultation document service unavailable");

    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    if (contentType.startsWith("multipart/form-data")) {
      const uploadAllowed = await checkRateLimit(req, {
        action: "consultation_document_upload_ip",
        maxAttempts: 20,
        windowMinutes: 15,
        failClosed: true,
      });
      if (!uploadAllowed) return rateLimitedResponse(headers, 60);

      const { meta, pdfBytes } = await parseConsultationMultipart(req);
      const { documentId, token } = await persistConsultationDocument({ service, meta, pdfBytes });
      await deliverConsultationDocument({
        req,
        supabaseUrl,
        serviceRoleKey,
        meta,
        documentId,
        token,
      });
      return jsonResponse(req, { success: true, documentId });
    }

    if (!contentType.startsWith("application/json")) {
      throw new ConsultationDocumentRequestError();
    }
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ConsultationDocumentUnavailableError();
    }
    const { token } = parseConsultationRedeemRequest(body);
    return await redeemConsultationDocument({ req, service, token });
  } catch (error) {
    if (error instanceof ConsultationDocumentRequestError) {
      return jsonResponse(req, { error: error.message }, 400);
    }
    if (error instanceof ConsultationDocumentUnavailableError) {
      return notFound(req);
    }
    console.error("consultation-document-api failed", error instanceof Error ? error.name : "unknown");
    return jsonResponse(req, { error: "Consultation document service unavailable" }, 500);
  }
});
