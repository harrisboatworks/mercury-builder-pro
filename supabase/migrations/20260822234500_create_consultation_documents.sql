-- Private consultation documents. Historical public spec-sheets objects stay
-- public and are not moved, deleted, rewritten, or backfilled.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consultation-documents',
  'consultation-documents',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf']::text[];

DROP POLICY IF EXISTS "Service role manages consultation documents" ON storage.objects;
CREATE POLICY "Service role manages consultation documents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'consultation-documents')
WITH CHECK (bucket_id = 'consultation-documents');

CREATE TABLE IF NOT EXISTS public.consultation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_quote_id uuid REFERENCES public.customer_quotes(id),
  storage_key text NOT NULL,
  sha256 text NOT NULL,
  byte_size integer NOT NULL,
  content_type text NOT NULL DEFAULT 'application/pdf',
  quote_number text NOT NULL,
  delivery_snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consultation_documents_storage_key_canonical
    CHECK (storage_key = ('consultation/' || id::text || '/quote.pdf')),
  CONSTRAINT consultation_documents_sha256_hex
    CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT consultation_documents_byte_size
    CHECK (byte_size > 0 AND byte_size <= 5242880),
  CONSTRAINT consultation_documents_content_type
    CHECK (content_type = 'application/pdf'),
  CONSTRAINT consultation_documents_quote_number
    CHECK (quote_number ~ '^HBW-[0-9]{6}$'),
  CONSTRAINT consultation_documents_snapshot_shape
    CHECK (
      jsonb_typeof(delivery_snapshot) = 'object'
      AND delivery_snapshot ? 'customerName'
      AND delivery_snapshot ? 'customerEmail'
      AND delivery_snapshot ? 'customerPhone'
      AND delivery_snapshot ? 'motorModel'
      AND delivery_snapshot ? 'totalPrice'
    )
);

CREATE TABLE IF NOT EXISTS public.consultation_document_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.consultation_documents(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  purpose text NOT NULL,
  bound_email text,
  bound_phone text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  use_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consultation_document_capabilities_token_hash_hex
    CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT consultation_document_capabilities_purpose
    CHECK (purpose IN ('submit', 'send_email', 'send_sms')),
  CONSTRAINT consultation_document_capabilities_use_count
    CHECK (use_count >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS consultation_document_capabilities_token_hash_uidx
  ON public.consultation_document_capabilities (token_hash);

CREATE INDEX IF NOT EXISTS consultation_document_capabilities_document_id_idx
  ON public.consultation_document_capabilities (document_id);

CREATE INDEX IF NOT EXISTS consultation_documents_customer_quote_id_idx
  ON public.consultation_documents (customer_quote_id);

ALTER TABLE public.consultation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_document_capabilities ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.consultation_documents FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.consultation_document_capabilities FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.consultation_documents TO service_role;
GRANT ALL ON TABLE public.consultation_document_capabilities TO service_role;

COMMENT ON TABLE public.consultation_documents IS
  'Server-owned private consultation PDFs. Browser RLS is denied; Edge Functions use the service role.';
COMMENT ON TABLE public.consultation_document_capabilities IS
  'SHA-256 hashes of 30-day revocable fragment bearer tokens. Raw tokens are never stored.';
COMMENT ON COLUMN public.consultation_document_capabilities.token_hash IS
  'Lowercase SHA-256 of the cd_<64hex> fragment token. Never store the raw token.';

CREATE OR REPLACE FUNCTION public.enforce_consultation_document_authority()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'consultation documents are service-managed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_consultation_document_authority()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_consultation_document_write
ON public.consultation_documents;
CREATE TRIGGER enforce_consultation_document_write
BEFORE INSERT OR UPDATE ON public.consultation_documents
FOR EACH ROW
EXECUTE FUNCTION public.enforce_consultation_document_authority();

DROP TRIGGER IF EXISTS enforce_consultation_capability_write
ON public.consultation_document_capabilities;
CREATE TRIGGER enforce_consultation_capability_write
BEFORE INSERT OR UPDATE ON public.consultation_document_capabilities
FOR EACH ROW
EXECUTE FUNCTION public.enforce_consultation_document_authority();

UPDATE public.email_templates
SET html_content = $tpl$<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Harris Boat Works</title>
</head>
<body style="margin:0;padding:0;background-color:#f1ece4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2430;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f1ece4;opacity:0;">Your Mercury {{motorModel}} quote, ref {{quoteNumber}}.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f1ece4" style="background-color:#f1ece4;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;border:1px solid #e5e0d6;">
<tr><td bgcolor="#0f2a43" style="background-color:#0f2a43;padding:32px 32px 22px 32px;text-align:center;">
<a href="https://www.mercuryrepower.ca" style="text-decoration:none;color:#ffffff;display:inline-block;">
<img src="https://www.mercuryrepower.ca/email-assets/harris-logo-white.png" alt="Harris Boat Works" width="120" height="84" style="display:block;margin:0 auto 14px auto;border:0;outline:none;width:120px;height:84px;max-width:120px;" />
<div style="font-family:Georgia,'Times New Roman',Times,serif;font-size:18px;font-weight:400;letter-spacing:6px;color:#ffffff;text-transform:uppercase;">Harris Boat Works</div>
</a>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:3px;color:#c5a572;text-transform:uppercase;margin-top:10px;font-weight:600;">Authorized Mercury Marine Dealer</div>
</td></tr>
<tr><td bgcolor="#0f2a43" style="background-color:#0f2a43;padding:0;"><div style="height:2px;background-color:#c8102e;line-height:2px;font-size:2px;">&nbsp;</div></td></tr>
<tr><td style="padding:44px 40px 32px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2430;">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2.5px;color:#c5a572;text-transform:uppercase;font-weight:700;margin:0 0 14px 0;">Your saved quote</div>
<h1 style="margin:0 0 22px 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:30px;line-height:1.2;font-weight:400;color:#0f2a43;letter-spacing:-0.3px;">Your Mercury {{motorModel}} quote</h1>
<div style="height:1px;background:#d9d3c7;line-height:1px;font-size:1px;margin:0 0 26px 0;">&nbsp;</div>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1f2430;">
<p style="margin:0 0 14px 0;">Hi {{customerName}},</p>
<p style="margin:0 0 14px 0;">Thanks for your interest. Here is the quote we prepared for you. Take your time, and reply with any questions.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#faf8f4;border:1px solid #e5e0d6;border-radius:4px;margin:24px 0;">
<tr><td style="padding:4px 22px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding:14px 0 14px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;vertical-align:top;width:150px;font-weight:600;">Reference</td><td style="padding:14px 0 14px 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;color:#1f2430;vertical-align:top;line-height:1.5;">{{quoteNumber}}</td></tr>
<tr><td style="padding:14px 0 14px 0;border-top:1px solid #d9d3c7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;vertical-align:top;width:150px;font-weight:600;">Motor</td><td style="padding:14px 0 14px 0;border-top:1px solid #d9d3c7;font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;color:#1f2430;vertical-align:top;line-height:1.5;">{{motorModel}}</td></tr>
<tr><td style="padding:14px 0 14px 0;border-top:1px solid #d9d3c7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;vertical-align:top;width:150px;font-weight:600;">Total</td><td style="padding:14px 0 14px 0;border-top:1px solid #d9d3c7;font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;color:#1f2430;vertical-align:top;line-height:1.5;">${{totalPrice}} CAD</td></tr>
</table>
</td></tr></table>
<p style="margin:0 0 18px 0;">A PDF copy of your full quote is attached to this email.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px 0;">
<tr><td align="center" bgcolor="#c8102e" style="border-radius:4px;background-color:#c8102e;">
<a href="{{documentAccessUrl}}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;">Open your private quote</a>
</td></tr>
</table>
<p style="margin:0 0 18px 0;font-size:14px;color:#6b7280;">This private link stays valid for 30 days and can be revoked if needed.</p>
<h2 style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#0f2a43;margin:28px 0 12px 0;font-weight:400;">What is next</h2>
<div style="height:1px;background:#d9d3c7;line-height:1px;font-size:1px;margin:0 0 14px 0;">&nbsp;</div>
<ul style="margin:0 0 18px 0;padding-left:20px;line-height:1.8;">
<li style="margin:0 0 8px 0;">Review the details at your own pace.</li>
<li style="margin:0 0 8px 0;">Reply with any questions about rigging, install, or financing.</li>
<li style="margin:0 0 8px 0;">When you are ready, we can lock in the price and schedule pickup at our Gores Landing shop.</li>
</ul>
<p style="margin:18px 0 0 0;">This quote is valid for 30 days.</p>
<p style="margin:16px 0 0 0;">Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
</div>
</td></tr>
<tr><td bgcolor="#0a1f33" style="background-color:#0a1f33;padding:32px 36px 28px 36px;">
<p style="margin:0 0 18px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.65;color:#cbd5e1;text-align:center;">Pickup is in person at our Gores Landing shop. Please bring valid photo ID.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td align="center" style="padding-bottom:14px;">
<img src="https://www.mercuryrepower.ca/email-assets/mercury-logo-white.png" alt="Mercury Marine" width="140" height="27" style="display:block;border:0;outline:none;width:140px;height:27px;max-width:140px;opacity:0.85;" />
</td></tr></table>
<p style="margin:0 0 6px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:2.5px;color:#c5a572;text-align:center;font-weight:700;text-transform:uppercase;">Mercury Premier Dealer</p>
<div style="height:1px;background:rgba(255,255,255,0.12);line-height:1px;font-size:1px;margin:18px 0;">&nbsp;</div>
<p style="margin:0 0 6px 0;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;line-height:1.6;color:#ffffff;text-align:center;letter-spacing:2px;text-transform:uppercase;">Harris Boat Works</p>
<p style="margin:0 0 10px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#cbd5e1;text-align:center;">5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</p>
<p style="margin:0 0 12px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#cbd5e1;text-align:center;"><a href="tel:9053422153" style="color:#cbd5e1;text-decoration:none;">(905) 342-2153</a> &nbsp;&middot;&nbsp; <a href="mailto:info@harrisboatworks.ca" style="color:#cbd5e1;text-decoration:none;">info@harrisboatworks.ca</a></p>
<p style="margin:14px 0 0 0;font-family:Georgia,'Times New Roman',Times,serif;font-style:italic;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">Family-owned on Rice Lake since 1947. Mercury dealer since 1965.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>$tpl$,
    updated_at = now()
WHERE type = 'quote_delivery';
