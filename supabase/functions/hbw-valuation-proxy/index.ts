// HBW Motor Valuation Proxy
// Public, no-auth proxy that injects HBW_API_KEY server-side and forwards
// to the canonical hbw-valuation tool on Vercel. Keeps the API key out of
// browser code so frontend, public-quote-api, and the standalone tool all
// return identical valuations.
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import {
  ALLOWED_HBW_STROKES,
  fetchCanonicalHbwValuation,
  HbwValuationError,
  normalizeHbwStroke,
} from "../_shared/hbw-valuation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

  // Cap upstream paid API calls: 20 valuations / 10 minutes per IP
  const allowed = await checkRateLimit(req, {
    action: "hbw_valuation",
    maxAttempts: 20,
    windowMinutes: 10,
  });
  if (!allowed) return rateLimitedResponse(corsHeaders, 600);

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
  let stroke: string | undefined;
  try {
    stroke = normalizeHbwStroke(raw?.stroke);
  } catch (error) {
    if (error instanceof HbwValuationError) {
      return json({ error: error.message, code: error.code }, error.status);
    }
    throw error;
  }
  const hours = raw?.hours === undefined || raw?.hours === null ? undefined : Number(raw.hours);
  const model = typeof raw?.model === "string" && raw.model.trim() ? raw.model.trim() : undefined;

  const errors: Record<string, string> = {};
  if (!brand || brand.length > 64) errors.brand = "required (1-64 chars)";
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1950 || year > currentYear) {
    errors.year = `required integer (1950-${currentYear})`;
  }
  if (!model && (hp === undefined || !Number.isFinite(hp) || hp < 1 || hp > 1000)) {
    errors.model = "model code or hp (1-1000) required";
  }
  if (hp !== undefined && (!Number.isFinite(hp) || hp < 1 || hp > 1000)) {
    errors.hp = "1-1000";
  }
  if (!ALLOWED_CONDITIONS.has(condition)) errors.condition = "excellent|good|fair|poor";
  if (stroke !== undefined && !ALLOWED_HBW_STROKES.has(stroke)) {
    errors.stroke = "4-stroke|2-stroke|proxs|optimax|etec";
  }
  if (hours !== undefined && (!Number.isFinite(hours) || hours < 0 || hours > 100000)) {
    errors.hours = "0-100000";
  }
  if (model && model.length > 120) errors.model = "max 120 chars";

  if (Object.keys(errors).length > 0) {
    return json({ error: "Invalid request", details: errors }, 400);
  }

  try {
    const data = await fetchCanonicalHbwValuation({
      brand,
      year,
      hp,
      condition,
      stroke,
      hours,
      model,
    });
    return json(data, 200);
  } catch (err) {
    console.error("HBW proxy fetch failed:", err);
    if (err instanceof HbwValuationError) {
      return json(
        { error: err.message, code: err.code },
        err.status,
      );
    }
    return json({ error: "Failed to reach valuation API" }, 502);
  }
});
