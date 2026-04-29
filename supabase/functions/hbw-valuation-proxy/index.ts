// HBW Motor Valuation Proxy
// Public, no-auth proxy that injects HBW_API_KEY server-side and forwards
// to the canonical hbw-valuation tool on Vercel. Keeps the API key out of
// browser code so frontend, public-quote-api, and the standalone tool all
// return identical valuations.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HBW_URL = "https://hbw-valuation-hbw.vercel.app/api/motor-valuation";
const ALLOWED_STROKES = new Set(["4-stroke", "2-stroke", "proxs", "optimax", "etec"]);
const ALLOWED_CONDITIONS = new Set(["excellent", "good", "fair", "poor"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  const apiKey = Deno.env.get("HBW_API_KEY");
  if (!apiKey) {
    console.error("HBW_API_KEY not configured");
    return json({ error: "Valuation service not configured" }, 500);
  }

  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Lightweight validation (avoid extra deps)
  const brand = typeof raw?.brand === "string" ? raw.brand.trim() : "";
  const year = Number(raw?.year);
  const hasHp = raw?.hp !== undefined && raw?.hp !== null && raw?.hp !== "";
  const hp = hasHp ? Number(raw.hp) : undefined;
  const condition = typeof raw?.condition === "string" ? raw.condition.toLowerCase() : "";
  const hasStroke = typeof raw?.stroke === "string" && raw.stroke.trim().length > 0;
  const stroke = hasStroke ? raw.stroke.toLowerCase() : undefined;
  const hours = raw?.hours === undefined || raw?.hours === null ? undefined : Number(raw.hours);
  const model = typeof raw?.model === "string" && raw.model.trim() ? raw.model.trim() : undefined;

  const errors: Record<string, string> = {};
  if (!brand || brand.length > 64) errors.brand = "required (1-64 chars)";
  if (!Number.isFinite(year) || year < 1950 || year > 2100) errors.year = "required (1950-2100)";
  if (!model && (hp === undefined || !Number.isFinite(hp) || hp < 1 || hp > 1000)) {
    errors.model = "model code or hp (1-1000) required";
  }
  if (hp !== undefined && (!Number.isFinite(hp) || hp < 1 || hp > 1000)) {
    errors.hp = "1-1000";
  }
  if (!ALLOWED_CONDITIONS.has(condition)) errors.condition = "excellent|good|fair|poor";
  if (stroke !== undefined && !ALLOWED_STROKES.has(stroke)) {
    errors.stroke = "4-stroke|2-stroke|proxs|optimax|etec";
  }
  if (hours !== undefined && (!Number.isFinite(hours) || hours < 0 || hours > 100000)) {
    errors.hours = "0-100000";
  }
  if (model && model.length > 120) errors.model = "max 120 chars";

  if (Object.keys(errors).length > 0) {
    return json({ error: "Invalid request", details: errors }, 400);
  }

  // Build upstream payload — omit undefined fields so the API's decoder can
  // infer hp/stroke from the model code when those aren't provided.
  const upstreamBody: Record<string, unknown> = { brand, year, condition };
  if (hp !== undefined) upstreamBody.hp = hp;
  if (stroke !== undefined) upstreamBody.stroke = stroke;
  if (hours !== undefined) upstreamBody.hours = hours;
  if (model) upstreamBody.model = model;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const upstream = await fetch(HBW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(upstreamBody),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await upstream.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // pass-through raw text on parse failure
    }

    if (!upstream.ok) {
      console.error("HBW upstream error", upstream.status, text);
      return json(
        {
          error: "Upstream valuation API error",
          status: upstream.status,
          details: data ?? text,
        },
        upstream.status === 401 || upstream.status === 403 ? 502 : upstream.status,
      );
    }

    return json(data ?? {}, 200);
  } catch (err) {
    clearTimeout(timer);
    console.error("HBW proxy fetch failed:", err);
    return json(
      { error: "Failed to reach valuation API", message: String(err) },
      502,
    );
  }
});
