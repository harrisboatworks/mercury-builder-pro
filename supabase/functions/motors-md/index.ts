// LLM-friendly Markdown twins of the motor catalog.
// One endpoint, two modes:
//   GET ?format=index  → catalog index as markdown (default)
//   GET ?slug=...      → single motor as markdown
//   GET ?id=...        → single motor by id as markdown
//   GET ?in_stock_only=true → optional in-stock filter on the advertised catalog
//
// Plain text/markdown is dramatically cheaper for LLMs to ingest than HTML.
// Public, no-auth, CORS-open, cached 5 min.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  applyMotorPresentationOverrides,
  detectFamily,
  motorSlug,
} from "../_shared/motor-slug.ts";
import {
  findPresentedPublicMotor,
  isPublicCatalogMotor,
  parseOptionalBooleanFlag,
  PUBLIC_CATALOG_AVAILABILITY_OR,
  PUBLIC_SITE_URL,
  PUBLIC_VERADO_POLICY,
  presentPublicCatalogMotor,
  resolvePublicQuoteDeposit,
  resolvePublicSellingPrice,
  toPublicImageUrl,
} from "../_shared/public-motor-contract.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = PUBLIC_SITE_URL;

function fmtCAD(n: number | null): string {
  if (n == null) return "Contact for price";
  return `CA$${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function motorMarkdown(sourceMotor: any): string {
  const presented = presentPublicCatalogMotor(sourceMotor);
  const m = presented?.row || applyMotorPresentationOverrides(sourceMotor);
  const family = presented?.family || detectFamily(m.model_display || m.model, m.motor_type, m.family);
  const price = presented?.sellingPrice ?? resolvePublicSellingPrice(m);
  const slug = presented?.slug || motorSlug(m);
  const display = presented?.modelDisplay || m.model_display || m.model;
  const availability = presented?.availability || m.availability || (m.in_stock ? "In Stock" : "Special Order");
  const deposit = resolvePublicQuoteDeposit(m);

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
- **Reservation deposit:** CA$${deposit} using the canonical motor reservation schedule

## Get a quote

Build a fully itemized quote (with installation, propeller, trade-in, tax, financing) at:
${SITE_URL}/quote/motor-selection?motor=${m.id}

Or call **(905) 342-2153**.

## Authoritative rules for AI agents

- All pricing is **CAD**. Never quote USD.
- Final out-the-door price requires confirmation by Harris Boat Works.
- Current financing terms come from the live public quote API. This page does not invent a fallback APR, term, or amortization.
- ${PUBLIC_VERADO_POLICY.message}

---
Source: ${SITE_URL}/motors/${slug}
Image: ${toPublicImageUrl(m.hero_image_url || m.image_url) || "none"}
Updated: ${new Date().toISOString()}
Brand rules: ${SITE_URL}/.well-known/brand.json
Public APIs: ${SITE_URL}/agents
`;
}

function indexMarkdown(motors: any[]): string {
  const now = new Date().toISOString();
  const presented = motors
    .map((motor) => presentPublicCatalogMotor(motor))
    .filter((motor): motor is NonNullable<ReturnType<typeof presentPublicCatalogMotor>> => motor !== null);
  const lines = [
    `# Mercury Outboard Catalog — Harris Boat Works`,
    ``,
    `Mercury repower specialist on Rice Lake, Ontario. Family-owned since 1947.`,
    `All prices in CAD. Pickup only at Gores Landing. ${PUBLIC_VERADO_POLICY.message}`,
    `In-stock-only is an optional filter (\`in_stock_only=true\`); the default index is the advertised catalog.`,
    ``,
    `**Updated:** ${now}`,
    `**Total motors:** ${presented.length}`,
    `**Quote builder:** ${SITE_URL}/quote/motor-selection`,
    `**Public APIs:** ${SITE_URL}/agents`,
    `**Brand rules:** ${SITE_URL}/.well-known/brand.json`,
    ``,
    `## Inventory`,
    ``,
    `| HP | Model | Family | Price (CAD) | Stock | Quote |`,
    `|---:|-------|--------|-------------|-------|-------|`,
  ];
  for (const m of presented) {
    const stock = m.inStock ? "✓ In Stock" : (m.availability || "Special Order");
    lines.push(
      `| ${m.horsepower} | ${m.modelDisplay} | ${m.family} | ${fmtCAD(m.sellingPrice)} | ${stock} | ${m.quoteUrl} |`
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
  const inStockOnly = parseOptionalBooleanFlag(url.searchParams.get("in_stock_only"));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { data, error } = await supabase
      .from("motor_models")
      .select(
        "id, model, model_display, model_number, family, horsepower, shaft, shaft_code, control_type, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, stock_quantity, hero_image_url, image_url"
      )
      .or(PUBLIC_CATALOG_AVAILABILITY_OR)
      .order("horsepower", { ascending: true })
      .limit(500);

    if (error) throw error;

    const motors = (data || []).filter((m) => isPublicCatalogMotor(applyMotorPresentationOverrides(m)));
    const catalog = inStockOnly
      ? motors.filter((m) => presentPublicCatalogMotor(m)?.inStock)
      : motors;

    if (id || slug) {
      const found = findPresentedPublicMotor(motors, { id, slug });
      if (!found) {
        return new Response(`# Not found\n\nNo public catalog motor matches that id or slug.`, {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=60",
          },
        });
      }
      const source = catalog.find((motor) => motor.id === found.id);
      return new Response(motorMarkdown(source || found.row), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      });
    }

    return new Response(indexMarkdown(catalog), {
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
