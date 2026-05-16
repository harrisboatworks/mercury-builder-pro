// supabase/functions/subscribe-walkaround/index.ts
// Subscribes an email to the HBW Mailchimp list and tags them with
// `used-boat-walkaround-pdf` so we can attribute the lead magnet.
import md5 from "npm:blueimp-md5@2.19.0";

const LIST_ID = "8ba7309b73";
const DC = "us2";
const TAG = "used-boat-walkaround-pdf";

const ALLOWED_ORIGINS = new Set([
  "https://www.mercuryrepower.ca",
  "https://mercuryrepower.ca",
  "http://localhost:5173",
  "http://localhost:8080",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://www.mercuryrepower.ca";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, origin);

  const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
  if (!apiKey) return json({ ok: false, error: "missing_api_key" }, 500, origin);

  let body: { email?: unknown; firstName?: unknown } = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400, origin); }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
  if (!EMAIL_RE.test(email) || email.length > 255) return json({ ok: false, error: "invalid_email" }, 400, origin);

  const hash = md5(email);
  const baseUrl = `https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${hash}`;
  const auth = "Basic " + btoa(`anystring:${apiKey}`);

  try {
    const upsert = await fetch(baseUrl, {
      method: "PUT",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        merge_fields: firstName ? { FNAME: firstName } : {},
      }),
    });
    if (!upsert.ok) {
      const text = await upsert.text();
      console.error("mailchimp upsert failed", upsert.status, text);
      return json({ ok: false, error: "mailchimp_upsert_failed", status: upsert.status }, 502, origin);
    }

    const tagRes = await fetch(`${baseUrl}/tags`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ tags: [{ name: TAG, status: "active" }] }),
    });
    if (!tagRes.ok && tagRes.status !== 204) {
      const text = await tagRes.text();
      console.error("mailchimp tag failed", tagRes.status, text);
      return json({ ok: false, error: "mailchimp_tag_failed", status: tagRes.status }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
  } catch (err) {
    console.error("subscribe-walkaround error", err);
    return json({ ok: false, error: "internal_error" }, 500, origin);
  }
});
