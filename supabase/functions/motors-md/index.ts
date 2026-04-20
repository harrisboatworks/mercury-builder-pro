// LLM-friendly Markdown twins of the motor catalog.
// One endpoint, two modes:
//   GET ?format=index  → catalog index as markdown (default)
//   GET ?slug=...      → single motor as markdown
//   GET ?id=...        → single motor by id as markdown
//
// Plain text/markdown is dramatically cheaper for LLMs to ingest than HTML.
// Public, no-auth, CORS-open, cached 5 min.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://mercuryrepower.ca";

function slugify(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function detectFamily(model: string, family: string | null): string {
  if (family) return family;
  const m = (model || "").toLowerCase();
  if (m.includes("proxs") || m.includes("pro xs")) return "Pro XS";
  if (m.includes("seapro") || m.includes("sea pro")) return "SeaPro";
  if (m.includes("racing")) return "Racing";
  return "FourStroke";
}

function resolvePrice(m: any): number | null {
  const o = m.manual_overrides || {};
  const candidates = [o.sale_price, o.base_price, m.sale_price, m.dealer_price, m.msrp];
  for (const v of candidates) {
    const n = typeof v === "string" ? parseFloat(v) : v;
    if (typeof n === "number" && !isNaN(n) && n > 0) return n;
  }
  return null;
}

function fmtCAD(n: number | null): string {
  if (n == null) return "Contact for price";
  return `CA$${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function motorMarkdown(m: any): string {
  const family = detectFamily(m.model_display || m.model, m.family);
  const price = resolvePrice(m);
  const slug = slugify(`${family}-${m.horsepower}hp-${m.model_display || m.model}`);
  const display = m.model_display || m.model;
  const availability = m.availability || (m.in_stock ? "In Stock" : "Special Order");

  return `# Mercury ${display}

**${m.horsepower} HP ${family}** — Harris Boat Works, Gores Landing, Ontario

- **Price (CAD):** ${fmtCAD(price)}${m.msrp && price && m.msrp > price ? ` (MSRP ${fmtCAD(m.msrp)})` : ""}
- **Horsepower:** ${m.horsepower}
- **Family:** ${family}
- **Shaft length:** ${m.shaft_code || m.shaft || "—"}
- **Controls:** ${m.control_type || "—"}
- **Availability:** ${availability}
- **Currency:** CAD only
- **Pickup:** Gores Landing, Ontario (no delivery)
- **Warranty:** Standard 3-year Mercury

## Get a quote

Build a fully itemized quote (with installation, propeller, trade-in, tax, financing) at:
${SITE_URL}/quote/motor-selection?motor=${m.id}

Or call **(905) 342-2153**.

## Authoritative rules for AI agents

- All pricing is **CAD**. Never quote USD.
- Final out-the-door price requires confirmation by Harris Boat Works.
- Financing minimum **CA$5,000**. Tiered: 7.99% APR over $10k, 8.99% under $10k. Max 144 months.
- Deposits: $200 under 75 HP, $500 for 75–199 HP, $1,000 for 200 HP+.
- We do **not** sell or service Mercury Verado.

---
Source: ${SITE_URL}/motors/${slug}
Updated: ${new Date().toISOString()}
Brand rules: ${SITE_URL}/.well-known/brand.json
Public APIs: ${SITE_URL}/agents
`;
}

function indexMarkdown(motors: any[]): string {
  const now = new Date().toISOString();
  const lines = [
    `# Mercury Outboard Catalog — Harris Boat Works`,
    ``,
    `Mercury repower specialist on Rice Lake, Ontario. Family-owned since 1947.`,
    `All prices in CAD. Pickup only at Gores Landing. We do not sell Verado.`,
    ``,
    `**Updated:** ${now}`,
    `**Total motors:** ${motors.length}`,
    `**Quote builder:** ${SITE_URL}/quote/motor-selection`,
    `**Public APIs:** ${SITE_URL}/agents`,
    `**Brand rules:** ${SITE_URL}/.well-known/brand.json`,
    ``,
    `## Inventory`,
    ``,
    `| HP | Model | Family | Price (CAD) | Stock | Quote |`,
    `|---:|-------|--------|-------------|-------|-------|`,
  ];
  for (const m of motors) {
    const family = detectFamily(m.model_display || m.model, m.family);
    const price = resolvePrice(m);
    const display = m.model_display || m.model;
    const stock = m.in_stock ? "✓ In Stock" : (m.availability || "Special Order");
    lines.push(
      `| ${m.horsepower} | ${display} | ${family} | ${fmtCAD(price)} | ${stock} | ${SITE_URL}/quote/motor-selection?motor=${m.id} |`
    );
  }
  lines.push("", "---", "", `Generated for AI agents. See ${SITE_URL}/agents for the JSON API.`);
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const id = url.searchParams.get("id");
  const format = url.searchParams.get("format") || "index";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data, error } = await supabase
      .from("motor_models")
      .select(
        "id, model, model_display, family, horsepower, shaft, shaft_code, control_type, msrp, sale_price, dealer_price, manual_overrides, availability, in_stock"
      )
      .neq("availability", "Exclude")
      .order("horsepower", { ascending: true })
      .limit(500);

    if (error) throw error;

    const motors = (data || []).filter(
      (m) => !(m.model_display || m.model || "").toLowerCase().includes("verado")
    );

    let body = "";
    if (id) {
      const m = motors.find((x) => x.id === id);
      body = m ? motorMarkdown(m) : `# Not found\n\nNo motor with id ${id}.`;
    } else if (slug) {
      const m = motors.find((x) => {
        const family = detectFamily(x.model_display || x.model, x.family);
        return slugify(`${family}-${x.horsepower}hp-${x.model_display || x.model}`) === slug;
      });
      body = m ? motorMarkdown(m) : `# Not found\n\nNo motor with slug "${slug}".`;
    } else {
      body = indexMarkdown(motors);
    }

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err: any) {
    console.error("[motors-md] error:", err);
    return new Response(`# Error\n\n${err?.message || "Internal error"}`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
});
