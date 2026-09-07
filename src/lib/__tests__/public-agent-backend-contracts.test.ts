import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  EXPRESS_MOTOR_ID,
  EXPRESS_MOTOR_MODEL_NUMBER,
} from "../../../supabase/functions/_shared/deposit-policy.ts";
import {
  filterPublicCatalogMotors,
  findPresentedPublicMotor,
  presentPublicCatalogMotor,
  resolvePublicQuoteDeposit,
  resolvePublicSellingPrice,
  toFinitePositiveCents,
} from "../../../supabase/functions/_shared/public-motor-contract.ts";
import {
  insertPublicQuoteLead,
  PUBLIC_QUOTE_LEAD_FAILURE,
} from "../../../supabase/functions/_shared/public-quote-lead.ts";
import {
  mcpUpstreamErrorResult,
  parseMcpJsonRpc,
  parseMcpToolArguments,
  parsePublicQuoteFlags,
  presentPublicAgentBrandRules,
} from "../../../supabase/functions/_shared/public-agent-mcp.ts";
import {
  checkUcpPlatformProfile,
  inspectUcpProfileUrl,
  parseUcpAllowedOrigins,
  parseUcpCheckoutLineItems,
  resolveUcpPricedItem,
  ucpTaxAndTotal,
  UcpClientError,
  UCP_QUOTE_SCOPE_NOTICE,
} from "../../../supabase/functions/_shared/ucp-checkout-contract.ts";

const source = (path: string) => readFileSync(path, "utf8");

const AG01_MOTOR = {
  id: "11111111-1111-4111-8111-111111111111",
  model: "90 ELPT FourStroke",
  model_display: "90 ELPT FourStroke",
  model_number: "1F904113D",
  family: "FourStroke",
  horsepower: 90,
  sale_price: 15000,
  dealer_price: 16000,
  msrp: 18000,
  base_price: 9000,
  manual_overrides: { base_price: 14000 },
  availability: null,
  in_stock: true,
  stock_quantity: 2,
};

const EXPRESS_MOTOR = {
  id: EXPRESS_MOTOR_ID,
  model_number: EXPRESS_MOTOR_MODEL_NUMBER,
  horsepower: 9.9,
  family: "FourStroke",
  model_display: "9.9 MH FourStroke",
  sale_price: 3200,
  availability: "In Stock",
  in_stock: true,
};

describe("AG01 public selling-price resolver", () => {
  it("expires manual sale overrides consistently across consumers", () => {
    const row = { ...AG01_MOTOR, manual_overrides: { sale_price: 12000, base_price: 14000, sale_price_expires: "2026-09-01T00:00:00Z" } };
    expect(resolvePublicSellingPrice(row, new Date("2026-08-31"))).toBe(12000);
    expect(resolvePublicSellingPrice(row, new Date("2026-09-02"))).toBe(14000);
  });
  it("uses override base ahead of row sale_price for the same synthetic motor", () => {
    expect(resolvePublicSellingPrice(AG01_MOTOR)).toBe(14000);
    expect(presentPublicCatalogMotor(AG01_MOTOR)?.sellingPrice).toBe(14000);
    expect(toFinitePositiveCents(resolvePublicSellingPrice(AG01_MOTOR))).toBe(1_400_000);

    const ucp = resolveUcpPricedItem(AG01_MOTOR, 1);
    expect(ucp).toMatchObject({ cents: 1_400_000, lineTotal: 1_400_000 });
  });

  it("rejects unavailable, non-finite, and non-positive prices instead of substituting another field", () => {
    expect(resolvePublicSellingPrice({
      ...AG01_MOTOR,
      sale_price: Number.NaN,
      dealer_price: Number.POSITIVE_INFINITY,
      msrp: -12,
      base_price: 0,
      manual_overrides: { sale_price: "oops", base_price: null },
    })).toBeNull();
    expect(toFinitePositiveCents(Number.NaN)).toBeNull();
    expect(toFinitePositiveCents(0)).toBeNull();
    expect(resolveUcpPricedItem({
      ...AG01_MOTOR,
      sale_price: Number.NaN,
      dealer_price: Number.NaN,
      msrp: Number.NaN,
      base_price: Number.NaN,
      manual_overrides: {},
    }, 1)).toMatchObject({ problem: { code: "price_unavailable" } });
  });

  it("keeps UCP arithmetic on finite integer cents", () => {
    const money = ucpTaxAndTotal(1_400_000, 0.13);
    expect(money).toEqual({ tax: 182_000, total: 1_582_000 });
    expect(ucpTaxAndTotal(Number.NaN, 0.13)).toBeNull();
  });
});

describe("AG03 UCP request validation", () => {
  it("rejects malformed quantities and IDs before any session or lead write", async () => {
    const writes: string[] = [];
    const client = {
      from(table: string) {
        return {
          async insert(_row: unknown) {
            writes.push(`insert:${table}`);
            return { error: null };
          },
          async upsert(_row: unknown) {
            writes.push(`upsert:${table}`);
            return { error: null };
          },
        };
      },
    };

    async function attemptCreate(rawItems: unknown) {
      parseUcpCheckoutLineItems(rawItems);
      await client.from("customer_quotes").insert({});
      await client.from("ucp_checkout_sessions").upsert({});
    }

    for (const quantity of [-1, 0, 1.5, "oops"]) {
      await expect(attemptCreate([{
        item: { id: AG01_MOTOR.id },
        quantity,
      }])).rejects.toBeInstanceOf(UcpClientError);
    }
    await expect(attemptCreate([])).rejects.toBeInstanceOf(UcpClientError);
    await expect(attemptCreate([{ quantity: 1 }])).rejects.toBeInstanceOf(UcpClientError);
    expect(writes).toEqual([]);
  });

  it("accepts a bounded positive integer and valid motor id", () => {
    expect(parseUcpCheckoutLineItems([{
      item: { id: AG01_MOTOR.id },
      quantity: 2,
    }])).toEqual([{ itemId: AG01_MOTOR.id, quantity: 2 }]);
  });

  it("keeps Verado as a special-order handoff rather than a client-error write barrier", () => {
    const priced = resolveUcpPricedItem({
      ...AG01_MOTOR,
      family: "Verado",
      model_display: "300 Verado",
    }, 1);
    expect(priced).toMatchObject({ problem: { code: "special_order_only" } });
    expect("problem" in priced && priced.problem.content).toMatch(/special-order/i);
    expect("problem" in priced && priced.problem.content).not.toMatch(/does not sell or service/i);
  });
});

describe("AG04 public quote lead capture", () => {
  it("signals insert failure independently of a successful estimate", async () => {
    const failed = await insertPublicQuoteLead({
      from: () => ({ insert: async () => ({ error: { message: "insert failed" } }) }),
    }, { customer_email: "buyer@example.com" });
    const succeeded = await insertPublicQuoteLead({
      from: () => ({ insert: async () => ({ error: null }) }),
    }, { customer_email: "buyer@example.com" });
    const exploded = await insertPublicQuoteLead({
      from: () => ({
        insert: async () => {
          throw new Error("network");
        },
      }),
    }, { customer_email: "buyer@example.com" });

    expect(failed).toEqual({ captured: false, error: PUBLIC_QUOTE_LEAD_FAILURE });
    expect(succeeded).toEqual({ captured: true, error: null });
    expect(exploded).toEqual({ captured: false, error: PUBLIC_QUOTE_LEAD_FAILURE });
    expect(failed.captured).not.toBe(true);
  });
});

describe("AG05 financing, deposit, and Verado policy", () => {
  it("keeps offers above the probe subtotal without claiming buyer eligibility", () => {
    const rules = presentPublicAgentBrandRules({ financing: [{id: "higher-minimum", name: "Fixture", rate: 6, term_months: 120, min_amount: 20000, is_active: true}], promotions: [] });
    expect(rules.financing.available).toBe(true);
    expect(rules.financing.offers[0]).toMatchObject({minimum_before_tax_cad: 20000});
    expect(rules.financing.offers[0]).not.toHaveProperty("eligible");
    expect(rules.financing.offers[0]).not.toHaveProperty("amortization_months");
  });
  it("uses the canonical express deposit instead of the generic portable $200", () => {
    expect(resolvePublicQuoteDeposit(EXPRESS_MOTOR)).toBe(100);
    expect(resolvePublicQuoteDeposit({
      ...EXPRESS_MOTOR,
      id: "22222222-2222-4222-8222-222222222222",
    })).toBe(200);
    expect(resolvePublicQuoteDeposit({ ...AG01_MOTOR, horsepower: 90 })).toBe(500);
  });

  it("lists live financing with term distinct from amortization and never invents current rates", () => {
    const live = presentPublicAgentBrandRules({
      financing: [{
        id: "td-always-on",
        name: "TD Auto Finance — Always On",
        rate: 5.48,
        term_months: 180,
        min_amount: 5000,
        is_active: true,
      }],
      promotions: [],
      now: new Date("2026-08-15T12:00:00Z"),
    });
    expect(live.financing).toMatchObject({
      available: true,
      offers: [expect.objectContaining({
        apr_percent: 5.48,
        contract_term_months: 60,
        maximum_amortization_months: 240,
      })],
    });
    expect(live.financing.available && "offers" in live.financing ? live.financing.offers[0] : {}).not.toHaveProperty("monthly_payment");
    expect(live.financing.available && "offers" in live.financing ? live.financing.offers[0] : {}).not.toHaveProperty("amortization_months");
    expect(JSON.stringify(live)).not.toMatch(/8\.99%|7\.99%|144/);

    const unavailable = presentPublicAgentBrandRules({
      financing: [],
      promotions: [],
      available: false,
    });
    expect(unavailable.financing.available).toBe(false);
    expect(unavailable.financing.reason).toMatch(/unavailable/i);
    expect(unavailable.financing.offers).toEqual([]);
    expect(unavailable.verado.proactive_quote).toBe(false);
    expect(unavailable.verado.policy).toBe("special_order_only");
  });
});

describe("AG06 UCP profile fetch allowlist", () => {
  it("never fetches caller-selected private, IP, userinfo, or nonstandard-port URLs", async () => {
    const fetchImpl = vi.fn();
    const blocked = [
      "https://127.0.0.1/private",
      "https://[::1]/private",
      "https://user:pass@example.com/profile",
      "https://example.com:8443/profile",
      "http://example.com/profile",
    ];

    expect(parseUcpAllowedOrigins("")).toEqual([]);
    expect(parseUcpAllowedOrigins("https://127.0.0.1,https://user:pass@evil.example")).toEqual([]);
    for (const url of blocked) {
      expect(inspectUcpProfileUrl(url, ["https://trusted.example"])).toMatchObject({
        action: "skip",
      });
      const open = await checkUcpPlatformProfile({
        url,
        strict: false,
        allowedOrigins: [],
        fetchImpl,
      });
      const strict = await checkUcpPlatformProfile({
        url,
        strict: true,
        allowedOrigins: ["https://trusted.example"],
        fetchImpl,
      });
      expect(open.warning?.code).toBe("profile_fetch_skipped");
      expect(strict.reject?.code).toBe("invalid_profile_url");
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("skips fetch when the allowlist is empty and only fetches an allowlisted HTTPS origin", async () => {
    const fetchImpl = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const empty = await checkUcpPlatformProfile({
      url: "https://trusted.example/ucp.json",
      strict: false,
      allowedOrigins: [],
      fetchImpl,
    });
    expect(empty.warning?.content).toMatch(/disabled until allowed HTTPS origins/i);
    expect(fetchImpl).not.toHaveBeenCalled();

    await checkUcpPlatformProfile({
      url: "https://trusted.example/ucp.json",
      strict: false,
      allowedOrigins: ["https://trusted.example"],
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://trusted.example/ucp.json");
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ redirect: "error" });
  });
});

describe("AG07 public catalog coverage", () => {
  it("includes NULL-availability motors in the advertised catalog and treats in-stock as an optional filter", () => {
    const rows = [
      AG01_MOTOR,
      { ...AG01_MOTOR, id: "33333333-3333-4333-8333-333333333333", in_stock: false, stock_quantity: 0, availability: "Available" },
      { ...AG01_MOTOR, id: "44444444-4444-4444-8444-444444444444", family: "Verado", model_display: "300 Verado" },
      { ...AG01_MOTOR, id: "55555555-5555-4555-8555-555555555555", availability: "Exclude" },
    ];
    const advertised = filterPublicCatalogMotors(rows);
    const inStock = filterPublicCatalogMotors(rows, { inStockOnly: true });
    expect(advertised.map((motor) => motor.id)).toEqual([
      AG01_MOTOR.id,
      "33333333-3333-4333-8333-333333333333",
    ]);
    expect(inStock.map((motor) => motor.id)).toEqual([AG01_MOTOR.id]);
    expect(findPresentedPublicMotor(rows, { slug: "missing-motor" })).toBeNull();
    expect(findPresentedPublicMotor(rows, { id: "55555555-5555-4555-8555-555555555555" })).toBeNull();
  });
});

describe("AG10 MCP envelopes, tool args, and upstream errors", () => {
  it("rejects JSON-null envelopes and invalid build_quote arguments", () => {
    expect(() => parseMcpJsonRpc(null)).toThrow(/Invalid Request/);
    expect(() => parseMcpJsonRpc({ method: "tools/call", params: null })).toThrow(/Invalid Request/);
    expect(() => parsePublicQuoteFlags({ purchase_path: "banana" })).toThrow(/installed or loose/);
    expect(() => parsePublicQuoteFlags({ customer_has_propeller: "false" })).toThrow(/boolean/);
    expect(() => parseMcpToolArguments("build_quote", {
      motor_id: AG01_MOTOR.id,
      purchase_path: "banana",
    })).toThrow(/installed or loose/);
    expect(() => parseMcpToolArguments("build_quote", {
      motor_id: AG01_MOTOR.id,
      customer_has_propeller: "false",
    })).toThrow(/boolean/);
    expect(parseMcpToolArguments("build_quote", {
      motor_id: AG01_MOTOR.id,
      purchase_path: "loose",
      customer_has_propeller: false,
    })).toMatchObject({
      motor_id: AG01_MOTOR.id,
      purchase_path: "loose",
      customer_has_propeller: false,
    });
  });

  it("marks explicit upstream errors without dropping the error payload", () => {
    const errored = mcpUpstreamErrorResult({ error: "valuation unavailable", code: "upstream" });
    const ok = mcpUpstreamErrorResult({ estimate: { average: 1200 } });
    expect(errored.isError).toBe(true);
    expect(errored.content[0].text).toContain("valuation unavailable");
    expect(ok.isError).toBeUndefined();
    expect(ok.content[0].text).toContain("1200");
  });

  it("accepts canonical engine types and model-only HP for trade tools", () => {
    expect(parseMcpToolArguments("estimate_trade_in", {
      brand: "Mercury",
      year: 2020,
      model: "90 FourStroke",
      engine_type: "proxs",
    })).toMatchObject({
      horsepower: 90,
      engine_type: "proxs",
    });
    expect(parseMcpToolArguments("build_quote", {
      motor_id: AG01_MOTOR.id,
      trade_in: {
        brand: "Evinrude",
        year: 2016,
        model: "90 E-TEC",
        engine_type: "etec",
      },
    }).trade_in).toMatchObject({
      horsepower: 90,
      engine_type: "etec",
    });
  });

  it("rejects a present trade without HP or a validated model", () => {
    expect(() => parseMcpToolArguments("build_quote", {
      motor_id: AG01_MOTOR.id,
      trade_in: { brand: "Mercury", year: 2020, model: "ELPT EFI" },
    })).toThrow(/horsepower/);
  });
});

describe("AG11 UCP quote-mode scope", () => {
  it("states that installation, propeller, and trade-in are outside UCP checkout", () => {
    expect(UCP_QUOTE_SCOPE_NOTICE).toMatch(/Installation, propeller, and trade-in are not included/);
    expect(UCP_QUOTE_SCOPE_NOTICE).toMatch(/build_quote/);
    expect(UCP_QUOTE_SCOPE_NOTICE).toMatch(/Payment is not collected/);
  });
});

describe("authorized transport wiring", () => {
  it("routes the five public transports through the shared resolver and leaves valuation/notification paths in place", () => {
    const motorsApi = source("supabase/functions/public-motors-api/index.ts");
    const quoteApi = source("supabase/functions/public-quote-api/index.ts");
    const mcp = source("supabase/functions/agent-mcp-server/index.ts");
    const ucp = source("supabase/functions/ucp-checkout/index.ts");
    const markdown = source("supabase/functions/motors-md/index.ts");

    for (const handler of [motorsApi, quoteApi, mcp, markdown]) {
      expect(handler).toContain("resolvePublicSellingPrice(");
      expect(handler).toContain("PUBLIC_CATALOG_AVAILABILITY_OR");
    }
    expect(ucp).toContain("resolveUcpPricedItem(");
    expect(ucp).toContain("parseUcpCheckoutLineItems(");
    expect(ucp).toContain("UCP_QUOTE_SCOPE_NOTICE");
    expect(quoteApi).toContain("insertPublicQuoteLead(");
    expect(quoteApi).toContain("fetchCanonicalHbwValuation");
    expect(quoteApi).toContain('lead_source: "public-quote-api"');
    expect(mcp).not.toContain("8.99% APR");
    expect(mcp).not.toContain("max_term_months: 144");
    expect(markdown).not.toContain("7.99% APR");
    expect(markdown).toContain("status: 404");
  });
});
