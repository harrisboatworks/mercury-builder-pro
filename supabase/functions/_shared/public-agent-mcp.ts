import {
  buildPublicQuoteFinancing,
  PUBLIC_QUOTE_FINANCING_POLICY_VERSION,
} from "./public-quote-financing.ts";
import type { FinancingRecord } from "./customer-knowledge-context.ts";
import type { PromotionRecord } from "./promotion-context.ts";
import {
  EXPRESS_MOTOR_MODEL_NUMBER,
  getMotorReservationDeposit,
} from "./deposit-policy.ts";
import { PUBLIC_SITE_URL, PUBLIC_VERADO_POLICY } from "./public-motor-contract.ts";
import { inferValidatedTradeInHorsepower } from "./trade-in-input.ts";

export const MCP_MAX_STRING = 200;
export const MCP_MAX_NOTE = 500;
export const MCP_MAX_SLUG = 160;
export const MCP_MAX_SEARCH_LIMIT = 100;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAMILIES = new Set(["FourStroke", "Pro XS", "SeaPro", "Racing"]);
const CONDITIONS = new Set(["excellent", "good", "fair", "poor"]);
const ENGINE_TYPES = new Set(["4-stroke", "2-stroke", "optimax", "etec", "proxs"]);
const PURCHASE_PATHS = new Set(["installed", "loose"]);

export class McpInvalidParamsError extends Error {
  code = -32602;

  constructor(message: string) {
    super(message);
    this.name = "McpInvalidParamsError";
  }
}

export function mcpToolResult(payload: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

export function mcpUpstreamErrorResult(payload: unknown) {
  const record = payload !== null && typeof payload === "object"
    ? payload as Record<string, unknown>
    : null;
  const hasError = Boolean(record && record.error != null && record.error !== false && record.error !== "");
  return mcpToolResult(payload, hasError);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value: unknown, max: number, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new McpInvalidParamsError(`${field} must be a nonempty string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new McpInvalidParamsError(`${field} exceeds the ${max}-character limit.`);
  }
  return trimmed;
}

function optionalBoundedString(value: unknown, max: number, field: string): string | undefined {
  if (value == null) return undefined;
  return boundedString(value, max, field);
}

function finiteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new McpInvalidParamsError(`${field} must be a finite number.`);
  }
  return value;
}

function optionalFiniteNumber(value: unknown, field: string): number | undefined {
  if (value == null) return undefined;
  return finiteNumber(value, field);
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value == null) return undefined;
  if (typeof value !== "boolean") {
    throw new McpInvalidParamsError(`${field} must be a boolean.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  if (value == null) return undefined;
  const id = boundedString(value, 36, field);
  if (!UUID_RE.test(id)) {
    throw new McpInvalidParamsError(`${field} must be a valid motor id.`);
  }
  return id;
}

export function parseMcpJsonRpc(payload: unknown): {
  id: string | number | null;
  method: string;
  params: Record<string, unknown>;
} {
  if (!isPlainObject(payload) || payload.jsonrpc !== "2.0") {
    throw Object.assign(new Error("Invalid Request"), { code: -32600 });
  }
  const id = payload.id === undefined ? null : payload.id;
  if ((id !== null && typeof id !== "string" && typeof id !== "number") || (typeof id === "number" && !Number.isFinite(id))) {
    throw Object.assign(new Error("Invalid Request"), { code: -32600 });
  }
  if (typeof payload.method !== "string" || !payload.method.trim()) {
    throw Object.assign(new Error("Invalid Request"), { code: -32600 });
  }
  if (payload.params == null) {
    return { id: id as string | number | null, method: payload.method, params: {} };
  }
  if (!isPlainObject(payload.params)) {
    throw Object.assign(new Error("Invalid Request"), { code: -32600 });
  }
  return { id: id as string | number | null, method: payload.method, params: payload.params };
}

function parseSearchMotorsArgs(args: Record<string, unknown>) {
  const family = optionalBoundedString(args.family, 40, "family");
  if (family && !FAMILIES.has(family)) {
    throw new McpInvalidParamsError("family must be FourStroke, Pro XS, SeaPro, or Racing.");
  }
  const limit = optionalFiniteNumber(args.limit, "limit");
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1 || limit > MCP_MAX_SEARCH_LIMIT)) {
    throw new McpInvalidParamsError(`limit must be an integer from 1 to ${MCP_MAX_SEARCH_LIMIT}.`);
  }
  return {
    horsepower: optionalFiniteNumber(args.horsepower, "horsepower"),
    min_hp: optionalFiniteNumber(args.min_hp, "min_hp"),
    max_hp: optionalFiniteNumber(args.max_hp, "max_hp"),
    family,
    in_stock_only: optionalBoolean(args.in_stock_only, "in_stock_only"),
    limit,
  };
}

function parseGetMotorArgs(args: Record<string, unknown>) {
  const parsed = {
    id: optionalUuid(args.id, "id"),
    slug: optionalBoundedString(args.slug, MCP_MAX_SLUG, "slug")?.toLowerCase(),
  };
  if (!parsed.id && !parsed.slug) {
    throw new McpInvalidParamsError("id or slug required");
  }
  return parsed;
}

function parseTradeIn(value: unknown, field: string) {
  if (value == null) return undefined;
  if (!isPlainObject(value)) {
    throw new McpInvalidParamsError(`${field} must be an object.`);
  }
  const condition = optionalBoundedString(value.condition, 20, `${field}.condition`);
  if (condition && !CONDITIONS.has(condition)) {
    throw new McpInvalidParamsError(`${field}.condition must be excellent, good, fair, or poor.`);
  }
  const engineType = optionalBoundedString(value.engine_type, 20, `${field}.engine_type`);
  if (engineType && !ENGINE_TYPES.has(engineType)) {
    throw new McpInvalidParamsError(`${field}.engine_type must be 4-stroke, 2-stroke, proxs, optimax, or etec.`);
  }
  const model = optionalBoundedString(value.model, MCP_MAX_STRING, `${field}.model`);
  const horsepower = value.horsepower == null
    ? inferValidatedTradeInHorsepower(model)
    : finiteNumber(value.horsepower, `${field}.horsepower`);
  if (horsepower == null) {
    throw new McpInvalidParamsError(
      `${field}.horsepower is required, or supply a model that infers a single validated HP.`,
    );
  }
  const year = finiteNumber(value.year, `${field}.year`);
  if (!Number.isInteger(year) || year < 1950 || year > new Date().getFullYear()) throw new McpInvalidParamsError(`${field}.year must be a supported whole year.`);
  if (horsepower <= 0 || horsepower > 1000) throw new McpInvalidParamsError(`${field}.horsepower must be greater than 0 and no more than 1000.`);
  const hours = optionalFiniteNumber(value.engine_hours, `${field}.engine_hours`);
  if (hours !== undefined && (hours < 0 || hours > 100000)) throw new McpInvalidParamsError(`${field}.engine_hours must be from 0 to 100000.`);
  return {
    brand: boundedString(value.brand, MCP_MAX_STRING, `${field}.brand`),
    year,
    horsepower,
    condition,
    engine_type: engineType,
    engine_hours: hours,
    model,
  };
}

function parseContact(value: unknown) {
  if (value == null) return undefined;
  if (!isPlainObject(value)) {
    throw new McpInvalidParamsError("contact must be an object.");
  }
  return {
    name: optionalBoundedString(value.name, MCP_MAX_STRING, "contact.name"),
    email: optionalBoundedString(value.email, MCP_MAX_STRING, "contact.email"),
    phone: optionalBoundedString(value.phone, 50, "contact.phone"),
    referrer: optionalBoundedString(value.referrer, MCP_MAX_NOTE, "contact.referrer"),
  };
}

function parseBoatInfo(value: unknown) {
  if (value == null) return undefined;
  if (!isPlainObject(value)) {
    throw new McpInvalidParamsError("boat_info must be an object.");
  }
  return {
    make: optionalBoundedString(value.make, 100, "boat_info.make"),
    model: optionalBoundedString(value.model, 100, "boat_info.model"),
  };
}

function parseBuildQuoteArgs(args: Record<string, unknown>) {
  const purchasePath = optionalBoundedString(args.purchase_path, 20, "purchase_path");
  if (purchasePath && !PURCHASE_PATHS.has(purchasePath)) {
    throw new McpInvalidParamsError("purchase_path must be installed or loose.");
  }
  const parsed = {
    motor_id: optionalUuid(args.motor_id, "motor_id"),
    horsepower: optionalFiniteNumber(args.horsepower, "horsepower"),
    family: optionalBoundedString(args.family, 40, "family"),
    purchase_path: purchasePath,
    financing_offer_id: optionalBoundedString(args.financing_offer_id, 120, "financing_offer_id"),
    customer_has_propeller: optionalBoolean(args.customer_has_propeller, "customer_has_propeller"),
    boat_info: parseBoatInfo(args.boat_info),
    trade_in: parseTradeIn(args.trade_in, "trade_in"),
    contact: parseContact(args.contact),
  };
  if (!parsed.motor_id && !(parsed.horsepower && parsed.family)) {
    throw new McpInvalidParamsError("Required: motor_id, OR (horsepower + family).");
  }
  return parsed;
}

export function parseMcpToolArguments(name: string, rawArgs: unknown): Record<string, unknown> {
  if (rawArgs == null) {
    if (name === "get_brand_rules" || name === "search_motors") return {};
    throw new McpInvalidParamsError("Tool arguments must be an object.");
  }
  if (!isPlainObject(rawArgs)) {
    throw new McpInvalidParamsError("Tool arguments must be an object.");
  }
  switch (name) {
    case "search_motors":
      return parseSearchMotorsArgs(rawArgs);
    case "get_motor":
      return parseGetMotorArgs(rawArgs);
    case "estimate_trade_in":
      return parseTradeIn(rawArgs, "estimate_trade_in") as Record<string, unknown>;
    case "build_quote":
      return parseBuildQuoteArgs(rawArgs);
    case "get_brand_rules":
      return {};
    default:
      throw new McpInvalidParamsError(`Unknown tool: ${name}`);
  }
}

export function parsePublicQuoteFlags(body: Record<string, unknown>) {
  const purchasePath = body.purchase_path;
  if (purchasePath != null && purchasePath !== "installed" && purchasePath !== "loose") {
    throw new McpInvalidParamsError("purchase_path must be installed or loose.");
  }
  if (body.customer_has_propeller != null && typeof body.customer_has_propeller !== "boolean") {
    throw new McpInvalidParamsError("customer_has_propeller must be a boolean.");
  }
  return {
    purchase_path: purchasePath === "loose" || purchasePath === "installed"
      ? purchasePath
      : undefined,
    customer_has_propeller: typeof body.customer_has_propeller === "boolean"
      ? body.customer_has_propeller
      : undefined,
  };
}

export function presentPublicAgentBrandRules(input: {
  financing: FinancingRecord[];
  promotions: PromotionRecord[];
  now?: Date;
  available?: boolean;
  reason?: string;
}) {
  const financing = input.available === false
    ? {
      available: false,
      reason: input.reason ||
        "Current financing terms are unavailable; no stale fallback rate was applied",
      policy_version: PUBLIC_QUOTE_FINANCING_POLICY_VERSION,
      offers: [] as Array<Record<string, unknown>>,
    }
    : (() => {
      const result = buildPublicQuoteFinancing({
        beforeTaxSubtotal: 5000,
        finalPriceWithTax: 5650,
        financing: input.financing,
        promotions: input.promotions,
        motorInStock: true,
        now: input.now,
      });
      if (!result.available) {
        return {
          available: false,
          reason: result.reason ||
            "Current financing terms are unavailable; no stale fallback rate was applied",
          policy_version: result.policy_version,
          offers: [] as Array<Record<string, unknown>>,
        };
      }
      return {
        available: true,
        policy_version: result.policy_version,
        offers: result.available_offers.map((offer) => ({
          id: offer.id,
          name: offer.name,
          source: offer.source,
          apr_percent: offer.apr_percent,
          contract_term_months: offer.contract_term_months,
          maximum_amortization_months: offer.maximum_amortization_months,
          minimum_before_tax_cad: offer.minimum_before_tax_cad,
          eligibility: "Call build_quote for eligibility against the selected motor and quote subtotal.",
        })),
        note:
          "contract_term_months is the contract term. Maximum amortization is an offer limit; the applicable amortization and payment require public build_quote and human confirmation.",
      };
    })();

  return {
    business: "Harris Boat Works",
    location: "Gores Landing, Rice Lake, Ontario, Canada",
    phone: "+1-905-342-2153",
    family_owned_since: 1947,
    mercury_dealer_since: 1965,
    currency: "CAD",
    geography: "Ontario, primary radius ~150km from Rice Lake",
    pickup_only: true,
    delivery: false,
    pickup_policy:
      "Motor purchases are pickup only at Gores Landing, Ontario. The buyer must pick up in person with valid government photo ID. We cannot release a motor to a courier, shipping company, or any other third party.",
    verado: PUBLIC_VERADO_POLICY,
    financing,
    deposits_cad: {
      express_portable_model: EXPRESS_MOTOR_MODEL_NUMBER,
      express_verified: getMotorReservationDeposit(9.9, true),
      up_to_25hp: getMotorReservationDeposit(25),
      "25.1_to_115hp": getMotorReservationDeposit(60),
      above_115hp: getMotorReservationDeposit(150),
    },
    warranty: "Standard 3-year Mercury (promo bonuses revert to 3y if promo ends)",
    voice: "Warm, local, family-owned. No hype. Plainspoken expertise.",
    docs: `${PUBLIC_SITE_URL}/agents`,
    brand_json: `${PUBLIC_SITE_URL}/.well-known/brand.json`,
  };
}
