import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import md5 from "npm:blueimp-md5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DC = "us2";
const LIST_ID = "8ba7309b73";
const TAG = "used-boat-walkaround-pdf";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  const apiKey = Deno.env.get("MAILCHIMP_API_KEY");
  if (!apiKey) return Response.json({ ok: false, error: "Mailchimp not configured" }, { status: 500, headers: CORS });

  let body: { email?: string; firstName?: string } = {};
  try { body = await req.json(); } catch { return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400, headers: CORS }); }

  const email = (body.email ?? "").trim().toLowerCase();
  const firstName = (body.firstName ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, error: "Valid email required" }, { status: 400, headers: CORS });
  }

  const hash = md5(email);
  const auth = "Basic " + btoa(`anystring:${apiKey}`);
  const base = `https://${DC}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${hash}`;

  const putRes = await fetch(base, {
    method: "PUT",
    headers: { "Authorization": auth, "Content-Type": "application/json" },
    body: JSON.stringify({
      email_address: email,
      status_if_new: "subscribed",
      merge_fields: firstName ? { FNAME: firstName } : {},
    }),
  });
  if (!putRes.ok) {
    const err = await putRes.text();
    console.error("Mailchimp PUT failed:", putRes.status, err);
    return Response.json({ ok: false, error: "Subscription failed" }, { status: 502, headers: CORS });
  }

  const tagRes = await fetch(`${base}/tags`, {
    method: "POST",
    headers: { "Authorization": auth, "Content-Type": "application/json" },
    body: JSON.stringify({ tags: [{ name: TAG, status: "active" }] }),
  });
  if (!tagRes.ok) {
    console.error("Mailchimp tag failed:", tagRes.status, await tagRes.text());
  }

  return Response.json({ ok: true }, { headers: CORS });
});
