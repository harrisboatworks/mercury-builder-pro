import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const DEALERPLAN_FEE = 299;
const HST_RATE = 0.13;
const FINANCING_MINIMUM = 5000;
const SITE_URL = Deno.env.get("APP_URL") || "https://mercuryrepower.ca";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // --- Auth: API key check ---
  const agentKey = req.headers.get("x-agent-key");
  const expectedKey = Deno.env.get("AGENT_QUOTE_API_KEY");
  if (!expectedKey || agentKey !== expectedKey) {
    return json({ error: "Unauthorized" }, 401);
  }

  // --- Rate limiting (simple in-memory, resets on cold start) ---
  const now = Date.now();
  if (now - rateBucket.windowStart > 60_000) {
    rateBucket.windowStart = now;
    rateBucket.count = 0;
  }
  rateBucket.count++;
  if (rateBucket.count > 30) {
    return json({ error: "Rate limit exceeded. Max 30 requests/minute." }, 429);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const action = body.action;

    switch (action) {
      case "list_motors":
        return await listMotors(supabase, body);
      case "list_promotions":
        return await listPromotions(supabase);
      case "estimate_trade_in":
        return await estimateTradeIn(supabase, body);
      case "get_warranty_pricing":
        return await getWarrantyPricing(supabase, body);
      case "create_quote":
        return await createQuote(supabase, body);
      case "update_quote":
        return await updateQuote(supabase, body);
      case "get_quote":
        return await getQuote(supabase, body);
      case "list_quotes":
        return await listQuotes(supabase, body);
      default:
        return json({
          error: `Unknown action: ${action}`,
          available_actions: [
            "list_motors", "list_promotions", "estimate_trade_in",
            "get_warranty_pricing", "create_quote", "update_quote",
            "get_quote", "list_quotes",
          ],
        }, 400);
    }
  } catch (err: any) {
    console.error("agent-quote-api error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});

// ── Helpers ──────────────────────────────────────────────

const rateBucket = { windowStart: Date.now(), count: 0 };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function shareUrl(quoteId: string) {
  return `${SITE_URL}/quote/saved/${quoteId}`;
}

function adminUrl(quoteId: string) {
  return `${SITE_URL}/admin/quotes/${quoteId}`;
}

function generateShareToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function calcPricing(opts: {
  motorPrice: number;
  customItemsTotal?: number;
  warrantyCost?: number;
  tradeInValue?: number;
  rebateAmount?: number;
  adminDiscount?: number;
}) {
  const {
    motorPrice,
    customItemsTotal = 0,
    warrantyCost = 0,
    tradeInValue = 0,
    rebateAmount = 0,
    adminDiscount = 0,
  } = opts;

  const subtotal = motorPrice + customItemsTotal + warrantyCost;
  const tradeInCredit = Math.min(tradeInValue, subtotal); // can't exceed subtotal
  const rebateCredit = Math.min(rebateAmount, subtotal - tradeInCredit);
  const adjustedSubtotal = subtotal - tradeInCredit - rebateCredit;
  const hst = adjustedSubtotal * HST_RATE;
  const totalBeforeDiscount = adjustedSubtotal + hst;
  const finalPrice = Math.max(0, totalBeforeDiscount - adminDiscount);

  return {
    subtotal,
    warrantyCost,
    tradeInCredit,
    rebateCredit,
    adjustedSubtotal,
    hst,
    totalBeforeDiscount,
    adminDiscount,
    finalPrice,
  };
}

// ── Trade-In Valuation (ported from src/lib/trade-valuation.ts) ──

const BRAND_PENALTIES: Record<string, number> = {
  JOHNSON: 0.5,
  EVINRUDE: 0.5,
  OMC: 0.5,
};
const MIN_TRADE_VALUE = 100;

function getBrandPenalty(brand: string, config?: Record<string, Record<string, number>>): number {
  const b = brand.trim().toUpperCase();
  if (!b) return 1;
  let factor = 1;
  for (const key of Object.keys(BRAND_PENALTIES)) {
    const configFactor = config?.[`BRAND_PENALTY_${key}`]?.factor;
    const penalty = configFactor ?? BRAND_PENALTIES[key];
    if (b.includes(key)) factor = Math.min(factor, penalty);
  }
  return factor;
}

function runTradeEstimate(
  brand: string, year: number, horsepower: number, condition: string,
  brackets: any[], config: Record<string, Record<string, number>>
) {
  const currentYear = new Date().getFullYear();
  const minValue = config?.MIN_TRADE_VALUE?.value ?? MIN_TRADE_VALUE;
  const mercuryMaxAge = config?.MERCURY_BONUS_YEARS?.max_age ?? 3;
  const mercuryBonusFactor = config?.MERCURY_BONUS_YEARS?.factor ?? 1.1;

  // Convert brackets to lookup
  const lookup: Record<string, Record<string, Record<string, any>>> = {};
  for (const b of brackets) {
    if (!lookup[b.brand]) lookup[b.brand] = {};
    if (!lookup[b.brand][b.year_range]) lookup[b.brand][b.year_range] = {};
    lookup[b.brand][b.year_range][b.horsepower.toString()] = {
      excellent: Number(b.excellent), good: Number(b.good),
      fair: Number(b.fair), poor: Number(b.poor),
    };
  }

  const brandData = lookup[brand];
  const factors: string[] = [];

  if (!brandData) {
    // Generic estimate
    const baseValue = horsepower * 30;
    const ageDep = Math.max(0.3, 1 - ((currentYear - year) * 0.1));
    const condMult: Record<string, number> = { excellent: 1.0, good: 0.75, fair: 0.55, poor: 0.3 };
    const est = baseValue * ageDep * (condMult[condition] || 0.55);
    let low = est * 0.85, high = est * 1.15;
    factors.push("Unknown brand", "Estimated depreciation");
    const pf = getBrandPenalty(brand, config);
    if (pf < 1) { low *= pf; high *= pf; factors.push("Brand penalty applied (-50%)"); }
    low = Math.max(low, minValue); high = Math.max(high, minValue);
    return { low: Math.round(low), high: Math.round(high), average: Math.round((low + high) / 2), confidence: "low", factors };
  }

  // Find year range
  let yearRange = "";
  if (year >= 2025) yearRange = "2025-2029";
  else if (year >= 2020) yearRange = "2020-2024";
  else if (year >= 2015) yearRange = "2015-2019";
  else if (year >= 2010) yearRange = "2010-2014";
  else if (year >= 2005) yearRange = "2005-2009";
  else {
    const motorAge = currentYear - year;
    const baseValue = horsepower * 30;
    const ageDep = Math.max(0.3, 1 - (motorAge - 20) * 0.03);
    const condMult: Record<string, number> = { excellent: 0.85, good: 0.65, fair: 0.45, poor: 0.25 };
    const est = baseValue * ageDep * (condMult[condition] || 0.45);
    let low = est * 0.8, high = est * 1.2;
    factors.push("Motor age over 20 years");
    const pf = getBrandPenalty(brand, config);
    if (pf < 1) { low *= pf; high *= pf; factors.push("Brand penalty applied (-50%)"); }
    low = Math.max(low, minValue); high = Math.max(high, minValue);
    return { low: Math.round(low), high: Math.round(high), average: Math.round((low + high) / 2), confidence: "low", factors };
  }

  const yearData = brandData[yearRange];
  if (!yearData) {
    return runTradeEstimate("Generic", year, horsepower, condition, brackets, config);
  }

  const availableHPs = Object.keys(yearData).map(Number).sort((a, b) => a - b);
  const closestHP = availableHPs.reduce((prev, curr) =>
    Math.abs(curr - horsepower) < Math.abs(prev - horsepower) ? curr : prev
  );

  const hpData = yearData[closestHP.toString()];
  if (!hpData) return runTradeEstimate("Generic", year, horsepower, condition, brackets, config);

  let baseValue = hpData[condition] || hpData.fair;
  const motorAge = currentYear - year;
  if (brand === "Mercury" && motorAge < mercuryMaxAge) {
    baseValue *= mercuryBonusFactor;
    factors.push("Mercury trade bonus applied");
  }
  if (Math.abs(closestHP - horsepower) > 15) factors.push(`Estimated from ${closestHP}HP value`);

  let low = baseValue * 0.85, high = baseValue * 1.15;
  const pf = getBrandPenalty(brand, config);
  if (pf < 1) { low *= pf; high *= pf; factors.push("Brand penalty applied (-50%)"); }
  low = Math.max(low, minValue); high = Math.max(high, minValue);

  let confidence: string = "high";
  if (Math.abs(closestHP - horsepower) > 15) confidence = "medium";
  if (year < 2015) confidence = "low";

  return {
    low: Math.round(low), high: Math.round(high),
    average: Math.round((low + high) / 2),
    confidence,
    factors: factors.length > 0 ? factors : ["Exact model match found"],
  };
}

// ── Actions ─────────────────────────────────────────────

async function listMotors(supabase: any, body: any) {
  const search = (body.search || "").trim();
  const limit = Math.min(body.limit || 20, 50);

  let query = supabase
    .from("motor_models")
    .select("id, model_display, model, horsepower, msrp, sale_price, dealer_price, in_stock, model_key, motor_type, year, base_price")
    .eq("is_brochure", true)
    .order("horsepower", { ascending: true })
    .limit(limit);

  if (search) {
    const hpNum = parseFloat(search);
    if (!isNaN(hpNum)) {
      query = query.eq("horsepower", hpNum);
    } else {
      query = query.ilike("model_display", `%${search}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(`list_motors failed: ${error.message}`);

  return json({
    ok: true,
    motors: (data || []).map((m: any) => ({
      id: m.id,
      model_display: m.model_display,
      horsepower: m.horsepower,
      msrp: m.msrp,
      sale_price: m.sale_price || (m.dealer_price && m.dealer_price < m.msrp ? m.dealer_price : null) || m.base_price,
      dealer_price: m.dealer_price,
      in_stock: m.in_stock,
      model_key: m.model_key,
      motor_type: m.motor_type,
      year: m.year,
    })),
    count: (data || []).length,
  });
}

async function listPromotions(supabase: any) {
  const { data, error } = await supabase
    .from("promotions")
    .select("id, name, kind, start_date, end_date, is_active, warranty_extra_years, promo_options, discount_fixed_amount, discount_percentage, bonus_title, bonus_description, bonus_short_badge, terms_url")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (error) throw new Error(`list_promotions failed: ${error.message}`);

  return json({
    ok: true,
    promotions: (data || []).map((p: any) => {
      const promoOpts = p.promo_options || {};
      // Options are stored in promo_options.options[] array
      const options = promoOpts.options || [];
      const chooseOneIds = options.map((o: any) => o.id);

      // Extract rebate matrix from the cash_rebate option
      const cashRebateOpt = options.find((o: any) => o.id === "cash_rebate");
      const rebateMatrix = (cashRebateOpt?.matrix || []).map((m: any) => ({
        hp_min: m.hp_min,
        hp_max: m.hp_max,
        rebate_amount: m.rebate,
      }));

      // Extract financing rates from the special_financing option
      const financingOpt = options.find((o: any) => o.id === "special_financing");
      const financingRates = (financingOpt?.rates || []).map((r: any) => ({
        term: r.months,
        rate: r.rate,
      }));

      return {
        id: p.id,
        name: p.name,
        kind: p.kind,
        start_date: p.start_date,
        end_date: p.end_date,
        warranty_extra_years: p.warranty_extra_years,
        bonus_title: p.bonus_title,
        bonus_description: p.bonus_description,
        terms_url: p.terms_url,
        choose_one_options: chooseOneIds,
        options_detail: options.map((o: any) => ({
          id: o.id,
          title: o.title,
          description: o.description,
        })),
        rebate_matrix: rebateMatrix,
        financing_rates: financingRates,
        financing_minimum: financingOpt?.minimum_amount || FINANCING_MINIMUM,
      };
    }),
    count: (data || []).length,
  });
}

async function estimateTradeIn(supabase: any, body: any) {
  const { brand, year, horsepower, condition } = body;
  if (!brand) throw new Error("brand is required (e.g. 'Mercury', 'Yamaha')");
  if (!year) throw new Error("year is required (e.g. 2018)");
  if (!horsepower) throw new Error("horsepower is required (e.g. 115)");
  const validConditions = ["excellent", "good", "fair", "poor"];
  const cond = (condition || "good").toLowerCase();
  if (!validConditions.includes(cond)) throw new Error(`condition must be one of: ${validConditions.join(", ")}`);

  // Fetch valuation data from DB
  const [bracketsRes, configRes] = await Promise.all([
    supabase.from("trade_valuation_brackets").select("*"),
    supabase.from("trade_valuation_config").select("*"),
  ]);

  const brackets = bracketsRes.data || [];
  const configMap: Record<string, Record<string, number>> = {};
  for (const item of (configRes.data || [])) {
    configMap[item.key] = item.value;
  }

  const estimate = runTradeEstimate(brand, year, horsepower, cond, brackets, configMap);

  // Compute the rounded median value (to nearest $25)
  const median = (estimate.low + estimate.high) / 2;
  const rounded = Math.max(Math.round(median / 25) * 25, configMap?.MIN_TRADE_VALUE?.value ?? MIN_TRADE_VALUE);

  return json({
    ok: true,
    trade_in: {
      brand, year, horsepower, condition: cond,
      estimated_value: rounded,
      range_low: estimate.low,
      range_high: estimate.high,
      confidence: estimate.confidence,
      factors: estimate.factors,
    },
  });
}

async function getWarrantyPricing(supabase: any, body: any) {
  const hp = body.horsepower;
  if (!hp) throw new Error("horsepower is required");

  const { data, error } = await supabase
    .from("warranty_pricing")
    .select("*")
    .lte("hp_min", hp)
    .gte("hp_max", hp);

  if (error) throw new Error(`get_warranty_pricing failed: ${error.message}`);

  const row = (data || [])[0];
  if (!row) {
    return json({
      ok: true,
      warranty_pricing: null,
      message: `No warranty pricing found for ${hp}HP. The base warranty (3 years) is included free.`,
    });
  }

  // Base warranty is 3 years. With Get 7 promo, bonus brings it to 7.
  // Extensions are priced per additional year beyond the promo coverage.
  return json({
    ok: true,
    warranty_pricing: {
      hp_range: `${row.hp_min}-${row.hp_max}`,
      base_warranty_years: 3,
      extension_costs: {
        year_4: row.year_1_price,
        year_5: row.year_2_price,
        year_6: row.year_3_price,
        year_7: row.year_4_price,
        year_8: row.year_5_price,
      },
      note: "With the active Get 7 promotion, years 4-7 are included free. Only year 8 would be an additional cost.",
    },
  });
}

async function createQuote(supabase: any, body: any) {
  // Validate required fields
  const { customer_name, customer_email, motor_id } = body;
  if (!customer_name?.trim()) throw new Error("customer_name is required");
  if (!customer_email?.trim()) throw new Error("customer_email is required");
  if (!motor_id?.trim()) throw new Error("motor_id is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) throw new Error("Invalid email format");

  // Look up motor
  const { data: motor, error: motorErr } = await supabase
    .from("motor_models")
    .select("*")
    .eq("id", motor_id)
    .single();
  if (motorErr || !motor) throw new Error(`Motor not found: ${motor_id}`);

  const motorPrice = motor.sale_price || motor.base_price || motor.msrp || 0;
  const adminDiscount = Math.max(0, body.admin_discount || 0);
  const customItems: Array<{ name: string; price: number }> = body.custom_items || [];
  const customItemsTotal = customItems.reduce((sum: number, i: any) => sum + (i.price || 0), 0);
  const purchasePath = body.purchase_path || "loose";

  // --- Promotion handling ---
  const promoOptionProvided = body.promo_option !== undefined;
  let promoOption = body.promo_option || null;
  let rebateAmount = 0;
  let promoData: any = null;
  let promoWarnings: string[] = [];

  // Always fetch promos — auto-default to cash_rebate if not specified
  {
    // Fetch active promo
    const { data: promos } = await supabase
      .from("promotions")
      .select("id, name, promo_options, warranty_extra_years, end_date")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(1);

    const activePromo = (promos || [])[0];
    if (activePromo) {
      promoData = activePromo;

      // Auto-select cash_rebate if no option specified
      if (!promoOption) {
        promoOption = "cash_rebate";
      }

      // If special_financing requested but below minimum, fall back to cash_rebate
      if (promoOption === "special_financing" || promoOption === "no_payments") {
        const estimatedTotal = motorPrice + customItemsTotal;
        if (estimatedTotal < FINANCING_MINIMUM) {
          promoWarnings.push(
            `Financing requires a minimum of $${FINANCING_MINIMUM.toLocaleString()}. ` +
            `Quote total ($${estimatedTotal.toLocaleString()}) is below this threshold. ` +
            `Automatically switched to cash_rebate.`
          );
          promoOption = "cash_rebate";
        }
      }

      // Look up rebate amount from promo_options.options[].matrix
      if (promoOption === "cash_rebate" && motor.horsepower) {
        const promoOpts = activePromo.promo_options || {};
        const cashRebateOpt = (promoOpts.options || []).find((o: any) => o.id === "cash_rebate");
        const matrix = cashRebateOpt?.matrix || [];
        for (const bracket of matrix) {
          if (motor.horsepower >= bracket.hp_min && motor.horsepower <= bracket.hp_max) {
            rebateAmount = bracket.rebate || 0;
            break;
          }
        }
      }
    }
  }

  // --- Trade-in handling ---
  let tradeInValue = 0;
  let tradeInData: any = null;
  if (body.trade_in && body.trade_in.brand && body.trade_in.year && body.trade_in.horsepower) {
    const ti = body.trade_in;
    const cond = (ti.condition || "good").toLowerCase();

    const [bracketsRes, configRes] = await Promise.all([
      supabase.from("trade_valuation_brackets").select("*"),
      supabase.from("trade_valuation_config").select("*"),
    ]);
    const brackets = bracketsRes.data || [];
    const configMap: Record<string, Record<string, number>> = {};
    for (const item of (configRes.data || [])) configMap[item.key] = item.value;

    const estimate = runTradeEstimate(ti.brand, ti.year, ti.horsepower, cond, brackets, configMap);
    const median = (estimate.low + estimate.high) / 2;
    tradeInValue = Math.max(Math.round(median / 25) * 25, configMap?.MIN_TRADE_VALUE?.value ?? MIN_TRADE_VALUE);

    // Check for admin/agent override
    const formulaEstimate = tradeInValue;
    if (ti.override_value != null && typeof ti.override_value === "number" && ti.override_value > 0) {
      tradeInValue = ti.override_value;
    }

    tradeInData = {
      brand: ti.brand,
      year: ti.year,
      horsepower: ti.horsepower,
      condition: cond,
      model: ti.model || "",
      serialNumber: ti.serial_number || "",
      estimatedValue: tradeInValue,
      originalEstimate: formulaEstimate,
      overrideValue: ti.override_value != null ? ti.override_value : undefined,
      confidence: estimate.confidence,
      hasTradeIn: true,
    };
  }

  // --- Warranty handling ---
  let warrantyCost = 0;
  let warrantyYearsExtra = 0;
  const baseWarrantyYears = 3;
  const promoWarrantyYears = promoData?.warranty_extra_years || 0;
  const totalBaseWarranty = baseWarrantyYears + promoWarrantyYears; // e.g. 7 with Get 7

  if (body.warranty_years && body.warranty_years > totalBaseWarranty) {
    warrantyYearsExtra = body.warranty_years - totalBaseWarranty;
    if (motor.horsepower) {
      const { data: wpRows } = await supabase
        .from("warranty_pricing")
        .select("*")
        .lte("hp_min", motor.horsepower)
        .gte("hp_max", motor.horsepower);

      const wp = (wpRows || [])[0];
      if (wp) {
        // Map extra years to pricing columns
        const yearPrices = [wp.year_1_price, wp.year_2_price, wp.year_3_price, wp.year_4_price, wp.year_5_price];
        // Start from year after promo coverage
        const startIndex = promoWarrantyYears; // if promo gives 4 extra years, start at index 4
        for (let i = 0; i < warrantyYearsExtra && (startIndex + i) < yearPrices.length; i++) {
          warrantyCost += yearPrices[startIndex + i] || 0;
        }
      }
    }
  }

  const pricing = calcPricing({
    motorPrice,
    customItemsTotal,
    warrantyCost,
    tradeInValue,
    rebateAmount,
    adminDiscount,
  });

  // Build financing data if applicable
  let financingData: any = null;
  if (promoOption === "special_financing" && pricing.finalPrice >= FINANCING_MINIMUM) {
    const rate = body.promo_rate || 2.99;
    const term = body.promo_term || 120;
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = monthlyRate > 0
      ? (pricing.finalPrice * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term))
      : pricing.finalPrice / term;
    financingData = {
      rate, term_months: term,
      monthly_payment: Math.round(monthlyPayment * 100) / 100,
      total_cost: Math.round(monthlyPayment * term * 100) / 100,
    };
  }

  // Build warrantyConfig that SavedQuotePage expects
  const totalWarrantyYears = body.warranty_years || totalBaseWarranty;
  const warrantyConfig = {
    totalYears: totalWarrantyYears,
    extendedYears: warrantyYearsExtra,
    warrantyPrice: warrantyCost,
  };

  const quoteData = {
    motorId: motor.id,
    motorModel: motor.model_display || motor.model,
    motorHp: motor.horsepower,
    motorMsrp: motor.msrp,
    motorPrice,
    motor: {
      id: motor.id,
      model: motor.model_display || motor.model,
      hp: motor.horsepower,
      price: motorPrice,
      msrp: motor.msrp,
      salePrice: motor.sale_price || motor.base_price,
      modelKey: motor.model_key,
      motorType: motor.motor_type,
      year: motor.year,
      inStock: motor.in_stock,
    },
    purchasePath,
    adminDiscount,
    adminNotes: body.admin_notes || "",
    customerNotes: body.customer_notes || "",
    customerName: customer_name.trim(),
    customerEmail: customer_email.trim(),
    customerPhone: body.customer_phone || "",
    isAdminQuote: true,
    adminCustomItems: customItems,
    // Promo — use keys that SavedQuotePage expects
    selectedPromoOption: promoOption,
    selectedPromoValue: rebateAmount,
    promoOption,
    promoName: promoData?.name || null,
    promoId: promoData?.id || null,
    rebateAmount,
    // Trade-in — use 'tradeInInfo' key that SavedQuotePage restores
    tradeInInfo: tradeInData,
    tradeIn: tradeInData,
    // Warranty — use 'warrantyConfig' key that SavedQuotePage restores
    warrantyConfig,
    warrantyYears: totalWarrantyYears,
    warrantyYearsExtra,
    warrantyCost,
    // Package — use 'selectedPackage' key that SavedQuotePage restores
    selectedPackage: { tier: body.package || "good" },
    package: body.package || "good",
    // Financing
    financing: financingData,
    // Pricing breakdown
    ...pricing,
  };

  const payload = {
    customer_name: customer_name.trim(),
    customer_email: customer_email.trim(),
    customer_phone: body.customer_phone || null,
    base_price: motorPrice,
    final_price: pricing.finalPrice,
    deposit_amount: 0,
    loan_amount: financingData ? pricing.finalPrice : 0,
    monthly_payment: financingData?.monthly_payment || 0,
    term_months: financingData?.term_months || 0,
    total_cost: financingData?.total_cost || pricing.finalPrice,
    user_id: null,
    motor_model_id: motor.id,
    admin_discount: adminDiscount,
    admin_notes: body.admin_notes || null,
    customer_notes: body.customer_notes || null,
    is_admin_quote: true,
    lead_status: body.lead_status || "new",
    share_token: generateShareToken(),
    lead_source: "ai_agent",
    promotion_id: promoData?.id || null,
    tradein_value_final: tradeInValue || null,
    quote_data: quoteData,
  };

  const { data, error } = await supabase
    .from("customer_quotes")
    .insert(payload)
    .select("id, share_token")
    .single();

  if (error) throw new Error(`Failed to create quote: ${error.message}`);

  // --- Dual-write to saved_quotes so the quote appears on "My Quotes" dashboard ---
  const shareToken = data.share_token || generateShareToken();
  try {
    await supabase.from("saved_quotes").insert({
      id: data.id,
      email: customer_email.trim(),
      resume_token: shareToken,
      quote_state: quoteData,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      access_count: 0,
    });
  } catch (savedErr: any) {
    console.error("saved_quotes dual-write failed (non-fatal):", savedErr.message);
  }

  // --- Admin SMS notification ---
  try {
    const motorLabel = motor.model_display || motor.model || `${motor.horsepower}HP`;
    const smsMessage = `🤖 AI Agent Quote Created\n` +
      `Customer: ${customer_name.trim()}\n` +
      `Motor: ${motorLabel}\n` +
      `Price: $${pricing.finalPrice.toLocaleString("en-CA", { minimumFractionDigits: 2 })}\n` +
      `Quote: ${shareUrl(data.id)}\n` +
      `Admin: ${adminUrl(data.id)}`;

    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        to: "admin",
        message: smsMessage,
        messageType: "saved_quote_alert",
        customerName: customer_name.trim(),
        quoteAmount: pricing.finalPrice,
      }),
    });
  } catch (smsErr: any) {
    console.error("Admin SMS notification failed (non-fatal):", smsErr.message);
  }

  const response: any = {
    ok: true,
    quote_id: data.id,
    share_url: shareUrl(data.id),
    admin_url: adminUrl(data.id),
    motor: {
      model: motor.model_display || motor.model,
      horsepower: motor.horsepower,
      msrp: motor.msrp,
    },
    pricing,
    promo_applied: promoOption ? { option: promoOption, rebate_amount: rebateAmount, promo_name: promoData?.name } : null,
    trade_in_applied: tradeInData ? { value: tradeInValue, brand: tradeInData.brand, condition: tradeInData.condition } : null,
    warranty: { total_years: body.warranty_years || totalBaseWarranty, extra_cost: warrantyCost },
  };

  if (financingData) response.financing = financingData;
  if (promoWarnings.length > 0) response.warnings = promoWarnings;

  return json(response);
}

async function updateQuote(supabase: any, body: any) {
  const { quote_id } = body;
  if (!quote_id?.trim()) throw new Error("quote_id is required");

  const { data: existing, error: fetchErr } = await supabase
    .from("customer_quotes")
    .select("*, motor_model_id")
    .eq("id", quote_id)
    .single();
  if (fetchErr || !existing) throw new Error(`Quote not found: ${quote_id}`);

  const updates: Record<string, any> = { last_modified_at: new Date().toISOString() };
  const quoteData = { ...(existing.quote_data || {}) };

  // Simple field updates
  if (body.customer_name !== undefined) {
    updates.customer_name = body.customer_name.trim();
    quoteData.customerName = body.customer_name.trim();
  }
  if (body.customer_email !== undefined) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer_email)) throw new Error("Invalid email format");
    updates.customer_email = body.customer_email.trim();
    quoteData.customerEmail = body.customer_email.trim();
  }
  if (body.customer_phone !== undefined) {
    updates.customer_phone = body.customer_phone || null;
    quoteData.customerPhone = body.customer_phone || "";
  }
  if (body.admin_notes !== undefined) { updates.admin_notes = body.admin_notes; quoteData.adminNotes = body.admin_notes; }
  if (body.customer_notes !== undefined) { updates.customer_notes = body.customer_notes; quoteData.customerNotes = body.customer_notes; }
  if (body.custom_items !== undefined) { quoteData.adminCustomItems = body.custom_items; }
  if (body.purchase_path !== undefined) { quoteData.purchasePath = body.purchase_path; }
  if (body.package !== undefined) { 
    quoteData.package = body.package; 
    quoteData.selectedPackage = { tier: body.package };
  }

  // Promo update
  if (body.promo_option !== undefined) {
    quoteData.promoOption = body.promo_option;
    quoteData.selectedPromoOption = body.promo_option;
  }

  // Trade-in update
  if (body.trade_in !== undefined) {
    if (body.trade_in === null) {
      quoteData.tradeIn = null;
      quoteData.tradeInInfo = null;
      updates.tradein_value_final = null;
    } else if (body.trade_in.brand && body.trade_in.year && body.trade_in.horsepower) {
      const ti = body.trade_in;
      const cond = (ti.condition || "good").toLowerCase();
      const [bracketsRes, configRes] = await Promise.all([
        supabase.from("trade_valuation_brackets").select("*"),
        supabase.from("trade_valuation_config").select("*"),
      ]);
      const brackets = bracketsRes.data || [];
      const configMap: Record<string, Record<string, number>> = {};
      for (const item of (configRes.data || [])) configMap[item.key] = item.value;
      const estimate = runTradeEstimate(ti.brand, ti.year, ti.horsepower, cond, brackets, configMap);
      const median = (estimate.low + estimate.high) / 2;
      let tradeInValue = Math.max(Math.round(median / 25) * 25, configMap?.MIN_TRADE_VALUE?.value ?? MIN_TRADE_VALUE);
      // Check for admin/agent override
      const formulaEstimate = tradeInValue;
      if (ti.override_value != null && typeof ti.override_value === "number" && ti.override_value > 0) {
        const finalTradeIn = ti.override_value;
        const tradeInObj = {
          brand: ti.brand, year: ti.year, horsepower: ti.horsepower,
          condition: cond, model: ti.model || "", serialNumber: ti.serial_number || "",
          estimatedValue: finalTradeIn, originalEstimate: formulaEstimate,
          overrideValue: ti.override_value, hasTradeIn: true,
        };
        quoteData.tradeIn = tradeInObj;
        quoteData.tradeInInfo = tradeInObj;
        updates.tradein_value_final = finalTradeIn;
      } else {
        const tradeInObj = {
          brand: ti.brand, year: ti.year, horsepower: ti.horsepower,
          condition: cond, model: ti.model || "", serialNumber: ti.serial_number || "",
          estimatedValue: tradeInValue, originalEstimate: formulaEstimate, hasTradeIn: true,
        };
        quoteData.tradeIn = tradeInObj;
        quoteData.tradeInInfo = tradeInObj;
        updates.tradein_value_final = tradeInValue;
      }
    }
  }

  // Recalculate pricing
  const adminDiscount = body.admin_discount !== undefined ? Math.max(0, body.admin_discount) : (existing.admin_discount || 0);
  const customItems = body.custom_items || quoteData.adminCustomItems || [];
  const customItemsTotal = customItems.reduce((sum: number, i: any) => sum + (i.price || 0), 0);
  const motorPrice = existing.base_price || 0;
  const tradeInValue = quoteData.tradeIn?.estimatedValue || 0;
  const rebateAmount = quoteData.rebateAmount || 0;
  const warrantyCost = quoteData.warrantyCost || 0;

  const pricing = calcPricing({
    motorPrice, customItemsTotal, warrantyCost,
    tradeInValue, rebateAmount, adminDiscount,
  });

  updates.admin_discount = adminDiscount;
  updates.final_price = pricing.finalPrice;
  updates.total_cost = pricing.finalPrice;
  updates.loan_amount = pricing.finalPrice;
  updates.quote_data = { ...quoteData, ...pricing, adminDiscount };

  const { error } = await supabase.from("customer_quotes").update(updates).eq("id", quote_id);
  if (error) throw new Error(`Failed to update quote: ${error.message}`);

  // Sync saved_quotes if it exists
  try {
    await supabase.from("saved_quotes").update({
      quote_state: updates.quote_data,
      updated_at: new Date().toISOString(),
    }).eq("id", quote_id);
  } catch (syncErr: any) {
    console.error("saved_quotes sync failed (non-fatal):", syncErr.message);
  }

  return json({ ok: true, quote_id, share_url: shareUrl(quote_id), admin_url: adminUrl(quote_id), pricing });
}

async function getQuote(supabase: any, body: any) {
  const { quote_id } = body;
  if (!quote_id?.trim()) throw new Error("quote_id is required");

  const { data, error } = await supabase
    .from("customer_quotes")
    .select("*, motor_model_id")
    .eq("id", quote_id)
    .single();
  if (error || !data) throw new Error(`Quote not found: ${quote_id}`);

  let motor = null;
  if (data.motor_model_id) {
    const { data: m } = await supabase
      .from("motor_models")
      .select("id, model_display, model, horsepower, msrp, sale_price, base_price")
      .eq("id", data.motor_model_id)
      .single();
    if (m) {
      motor = {
        id: m.id, model_display: m.model_display || m.model,
        horsepower: m.horsepower, msrp: m.msrp,
        sale_price: m.sale_price || m.base_price,
      };
    }
  }

  const qd = data.quote_data || {};

  return json({
    ok: true,
    quote: {
      id: data.id,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      base_price: data.base_price,
      final_price: data.final_price,
      admin_discount: data.admin_discount,
      admin_notes: data.admin_notes,
      customer_notes: data.customer_notes,
      lead_status: data.lead_status,
      lead_source: data.lead_source,
      created_at: data.created_at,
      last_modified_at: data.last_modified_at,
      share_url: shareUrl(data.id),
      admin_url: adminUrl(data.id),
      motor,
      custom_items: qd.adminCustomItems || [],
      purchase_path: qd.purchasePath || "loose",
      promo_option: qd.promoOption || null,
      rebate_amount: qd.rebateAmount || 0,
      trade_in: qd.tradeIn || null,
      warranty_years: qd.warrantyYears || null,
      warranty_cost: qd.warrantyCost || 0,
      package: qd.package || null,
      financing: qd.financing || null,
    },
  });
}

async function listQuotes(supabase: any, body: any) {
  const limit = Math.min(body.limit || 20, 50);
  let query = supabase
    .from("customer_quotes")
    .select("id, customer_name, customer_email, base_price, final_price, admin_discount, lead_status, lead_source, created_at, motor_model_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (body.customer_email) query = query.ilike("customer_email", body.customer_email.trim());
  if (body.lead_source) query = query.eq("lead_source", body.lead_source);

  const { data, error } = await query;
  if (error) throw new Error(`list_quotes failed: ${error.message}`);

  return json({
    ok: true,
    quotes: (data || []).map((q: any) => ({ ...q, share_url: shareUrl(q.id) })),
    count: (data || []).length,
  });
}
