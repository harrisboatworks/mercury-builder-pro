import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import { resolveAllowedBrowserOrigin } from "../_shared/browser-origin.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { createPaymentCustomerInfoSchema } from "../_shared/create-payment-request.ts";
import {
  assertQuoteCheckoutAuthenticated,
  decideCreatePaymentStripeAccess,
  isJsonRequestSyntaxError,
  mapCreatePaymentCaughtError,
  readRequiredStripeSecret,
} from "../_shared/deposit-payment-guard.ts";
import { resolveDepositStripePriceId } from "../_shared/deposit-staging-guard.ts";
import {
  depositIdentitiesMatch,
  parseDepositIdentity,
  parseSavedQuoteIdentity,
} from "../_shared/deposit-identity.ts";
import {
  assertRecoverStripeBillingRequest,
  boundCheckoutSessionIdFromDeposit,
  buildDepositCustomerQuoteRow,
  buildStripeDepositMetadata,
  classifyDepositPersistOutcome,
  classifyExistingDepositCheckoutSession,
  classifyOptimisticRecoveryWrite,
  depositPricingFromBoundSnapshot,
  planVerifiedStripeRecovery,
  stripeCheckoutIdempotencyKey,
  stripeDerivedPaidAt,
} from "../_shared/deposit-deal-record.ts";
import { assertNoCallerDocumentPath } from "../_shared/deposit-email-deliveries.ts";
import {
  assertCanonicalQuoteDocumentReady,
  canonicalQuoteDocumentPath,
  QuoteDocumentUnavailableError,
} from "../_shared/quote-document-policy.ts";

const baseCorsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function resolvePaymentOrigin(req: Request): string | null {
  return resolveAllowedBrowserOrigin(req.headers.get("origin"));
}

// Motor deposit price mapping - CAD prices (Canadian dollars)
const DEPOSIT_PRICES: Record<string, string | null> = {
  "100": null,                                      // $100 CAD - Express portable-motor reservation
  "200": "price_1Sspb6HhVKClVQCpaUhCXRnm",    // $200 CAD - Small motors (0-25HP)
  "500": "price_1SocofHhVKClVQCpsdCfdG7e",    // $500 CAD - Mid-small motors (30-115HP)
  "1000": "price_1SocogHhVKClVQCpEDslYPR3",   // $1,000 CAD - Mid-range motors (150HP+)
  "2500": "price_1SocoiHhVKClVQCptRAWryya"    // $2,500 CAD - Reserved for future use
};

const EXPRESS_MOTOR_ID = "e920cfdf-223a-408a-850b-6f112e15c4d7";
const EXPRESS_MOTOR_MODEL_NUMBER = "1A10201LK";

// Base customerInfo stays backward-compatible for quote payments.
// Deposit identity is enforced later by decideCreatePaymentStripeAccess.
const customerInfoSchema = createPaymentCustomerInfoSchema(z);

const quoteDataSchema = z.object({
  motorId: z.string().uuid().optional(),
  motorModel: z.string().max(200).optional(),
  horsepower: z.number().min(0).max(1000).optional(),
  motorPrice: z.number().min(0).max(1000000).optional(),
  accessoryCosts: z.number().min(0).max(100000).optional(),
  installationCost: z.number().min(0).max(50000).optional(),
  tradeInCredit: z.number().min(0).max(500000).optional(),
  totalPrice: z.number().min(0).max(2000000).optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
}).optional();

const motorInfoSchema = z.object({
  model: z.string().trim().max(200).optional(),
  hp: z.number().min(0).max(1000).optional(),
}).optional();

const quoteSnapshotSchema = z.record(z.unknown()).optional();

const paymentRequestSchema = z.object({
  quoteData: quoteDataSchema,
  depositAmount: z.enum(["100", "200", "500", "1000", "2500"]).optional(),
  customerInfo: customerInfoSchema,
  paymentType: z.enum(["deposit", "quote"]).optional(),
  motorInfo: motorInfoSchema,
  savedQuoteId: z.string().uuid().optional(),
  quoteSnapshot: quoteSnapshotSchema,
});

const verificationRequestSchema = z.object({
  action: z.literal("verify"),
  sessionId: z.string().trim().regex(/^cs_(?:test_|live_)?[A-Za-z0-9]+$/).max(255),
});

const recoverStripeBillingSchema = z.object({
  action: z.literal("recover_stripe_billing"),
  savedQuoteId: z.string().uuid(),
}).strict();

async function recoverHistoricalStripeBilling(options: {
  req: Request;
  body: { action: "recover_stripe_billing"; savedQuoteId: string };
  rawBody: Record<string, unknown>;
  corsHeaders: Record<string, string>;
}): Promise<Response> {
  const jsonHeaders = { ...options.corsHeaders, "Content-Type": "application/json" };
  const reject = (status: number, error: string) => new Response(
    JSON.stringify({ error }),
    { status, headers: jsonHeaders },
  );

  try {
    assertNoCallerDocumentPath(options.rawBody);
    assertRecoverStripeBillingRequest(options.rawBody);
  } catch (error) {
    return reject(400, error instanceof Error ? error.message : "Invalid recovery request");
  }

  const auth = await requireAdmin(options.req, options.corsHeaders);
  if (auth instanceof Response) return auth;

  const stripeKey = readRequiredStripeSecret(Deno.env);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const recoverySelect = "id, saved_quote_id, stripe_checkout_session_id, stripe_payment_intent_id, stripe_billing_address, payment_status, payment_paid_at, lead_status, lead_source, deposit_amount, quote_data";
  let { data: deposit, error: depositError } = await supabaseAdmin
    .from("customer_quotes")
    .select(recoverySelect)
    .eq("lead_source", "deposit")
    .eq("saved_quote_id", options.body.savedQuoteId)
    .maybeSingle();
  if (depositError) {
    return reject(409, "Ambiguous or unreadable deposit record");
  }
  if (!deposit) {
    const legacy = await supabaseAdmin
      .from("customer_quotes")
      .select(recoverySelect)
      .eq("lead_source", "deposit")
      .contains("quote_data", { saved_quote_id: options.body.savedQuoteId })
      .maybeSingle();
    if (legacy.error) {
      return reject(409, "Ambiguous or unreadable deposit record");
    }
    deposit = legacy.data;
  }
  if (!deposit) {
    return reject(404, "Paid deposit record not found");
  }

  const { data: savedQuote, error: savedQuoteError } = await supabaseAdmin
    .from("saved_quotes")
    .select("id, deposit_status, deposit_amount, deposit_paid_at")
    .eq("id", options.body.savedQuoteId)
    .maybeSingle();
  if (savedQuoteError || !savedQuote) {
    return reject(404, "Saved quote not found");
  }

  const boundSessionId = boundCheckoutSessionIdFromDeposit(deposit);
  if (!boundSessionId) {
    return reject(409, "No bound checkout session");
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const session = await stripe.checkout.sessions.retrieve(boundSessionId, {
    expand: ["payment_intent"],
  });
  const paidAt = stripeDerivedPaidAt(session);
  if (!paidAt) {
    return reject(409, "Stripe payment timestamp is unavailable");
  }

  let plan;
  try {
    plan = planVerifiedStripeRecovery({
      savedQuoteId: options.body.savedQuoteId,
      deposit,
      savedQuote,
      session,
      paidAt,
    });
  } catch (error) {
    return reject(409, error instanceof Error ? error.message : "Checkout session binding failed");
  }

  const expectedPaymentStatus = deposit.payment_status ?? null;
  const expectedCheckoutSessionId = deposit.stripe_checkout_session_id ?? null;
  let recoveryWriteQuery = supabaseAdmin
    .from("customer_quotes")
    .update(plan.customerQuotePatch)
    .eq("id", deposit.id)
    .eq("lead_source", "deposit");
  recoveryWriteQuery = expectedPaymentStatus == null
    ? recoveryWriteQuery.is("payment_status", null)
    : recoveryWriteQuery.eq("payment_status", expectedPaymentStatus);
  recoveryWriteQuery = expectedCheckoutSessionId == null
    ? recoveryWriteQuery.is("stripe_checkout_session_id", null)
    : recoveryWriteQuery.eq("stripe_checkout_session_id", expectedCheckoutSessionId);
  const { data: writtenRow, error: writeError } = await recoveryWriteQuery
    .select("id, stripe_billing_address, payment_status")
    .maybeSingle();
  let written = writtenRow;
  if (writeError) {
    return reject(500, "Could not persist verified Stripe recovery");
  }
  if (!written) {
    const { data: rereadDeposit } = await supabaseAdmin
      .from("customer_quotes")
      .select("id, payment_status, stripe_checkout_session_id, stripe_billing_address")
      .eq("id", deposit.id)
      .maybeSingle();
    const recoveryOutcome = classifyOptimisticRecoveryWrite({
      written: null,
      reread: rereadDeposit,
      expectedSessionId: boundSessionId,
    });
    if (recoveryOutcome !== "already_completed" || !rereadDeposit?.id) {
      return reject(409, "Could not persist verified Stripe recovery");
    }
    written = rereadDeposit;
  }

  let savedQuoteDepositStatus = plan.savedQuoteDepositStatus;
  if (plan.savedQuotePatch) {
    const expectedSavedDepositStatus = savedQuote.deposit_status ?? null;
    let savedWriteQuery = supabaseAdmin
      .from("saved_quotes")
      .update(plan.savedQuotePatch)
      .eq("id", savedQuote.id);
    savedWriteQuery = expectedSavedDepositStatus == null
      ? savedWriteQuery.is("deposit_status", null)
      : savedWriteQuery.eq("deposit_status", expectedSavedDepositStatus);
    const { data: savedWrite, error: savedWriteError } = await savedWriteQuery
      .select("id, deposit_status")
      .maybeSingle();
    if (savedWriteError) {
      return reject(500, "Could not persist verified saved-quote recovery");
    }
    if (!savedWrite) {
      const { data: rereadSaved } = await supabaseAdmin
        .from("saved_quotes")
        .select("id, deposit_status")
        .eq("id", savedQuote.id)
        .maybeSingle();
      if (rereadSaved?.deposit_status !== "paid") {
        return reject(409, "Could not persist verified saved-quote recovery");
      }
      savedQuoteDepositStatus = "already_paid";
    } else {
      savedQuoteDepositStatus = savedWrite.deposit_status === "paid" ? "paid" : plan.savedQuoteDepositStatus;
    }
  }

  logStep("Recovered verified Stripe deposit", {
    savedQuoteId: options.body.savedQuoteId,
    customerQuoteId: written.id,
    promotedCustomerQuoteFields: plan.promotedCustomerQuoteFields,
    promotedSavedQuoteFields: plan.promotedSavedQuoteFields,
  });

  return new Response(JSON.stringify({
    success: true,
    source: "stripe_checkout_billing",
    stripeBillingAddress: plan.stripeBillingAddress,
    promoted: {
      customerQuoteFields: plan.promotedCustomerQuoteFields,
      savedQuoteFields: plan.promotedSavedQuoteFields,
      paymentStatus: written.payment_status,
      savedQuoteDepositStatus,
    },
  }), {
    status: 200,
    headers: jsonHeaders,
  });
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const paymentOrigin = resolvePaymentOrigin(req);
  const corsHeaders = {
    ...baseCorsHeaders,
    "Access-Control-Allow-Origin": paymentOrigin || "https://www.mercuryrepower.ca",
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    if (!paymentOrigin) {
      return new Response(JSON.stringify({ error: "Forbidden origin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(null, { headers: corsHeaders });
  }

  if (!paymentOrigin) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const allowed = await checkRateLimit(req, {
      action: "create_payment_session",
      maxAttempts: 20,
      windowMinutes: 10,
    });
    if (!allowed) return rateLimitedResponse(corsHeaders, 60);

    logStep("Function started");

    // Parse and fail-closed on deposit identity/savedQuoteId before Stripe
    // secret, Stripe client, Supabase client, or any Stripe/Supabase network.
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch (error) {
      if (isJsonRequestSyntaxError(error)) {
        return new Response(JSON.stringify({ error: "Invalid input data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw error;
    }
    if (rawBody && typeof rawBody === "object" && (rawBody as { action?: unknown }).action === "recover_stripe_billing") {
      const recoverResult = recoverStripeBillingSchema.safeParse(rawBody);
      if (!recoverResult.success) {
        return new Response(JSON.stringify({ error: "Invalid recovery request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return await recoverHistoricalStripeBilling({
        req,
        body: recoverResult.data,
        rawBody: rawBody as Record<string, unknown>,
        corsHeaders,
      });
    }
    const verificationResult = verificationRequestSchema.safeParse(rawBody);
    const validationResult = paymentRequestSchema.safeParse(rawBody);

    let depositSavedQuoteId: string | null = null;
    if (!verificationResult.success) {
      if (!validationResult.success) {
        logStep("Validation failed", { issueCount: validationResult.error.errors.length });
        return new Response(JSON.stringify({
          error: "Invalid input data",
          details: validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const stripeAccess = decideCreatePaymentStripeAccess(validationResult.data);
      if (!stripeAccess.allowStripeAccess) {
        logStep("Deposit rejected before Stripe access", { error: stripeAccess.error });
        return new Response(JSON.stringify({ error: stripeAccess.error }), {
          status: stripeAccess.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      depositSavedQuoteId = stripeAccess.savedQuoteId;
    }

    // Create the anon client before the Stripe secret so omitted-paymentType
    // quote checkout can require a signed-in user without a secret-presence oracle.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (!userError && userData.user?.email) {
          user = userData.user;
          logStep("User authenticated", { userId: user.id });
        }
      } catch (error) {
        logStep("Auth failed, proceeding as guest", { error: error instanceof Error ? error.message : "Unknown" });
      }
    }

    if (!verificationResult.success && validationResult.success) {
      assertQuoteCheckoutAuthenticated(validationResult.data, user);
    }

    const stripeKey = readRequiredStripeSecret(Deno.env);
    logStep("Stripe key verified");

    if (verificationResult.success) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const session = await stripe.checkout.sessions.retrieve(
        verificationResult.data.sessionId,
        { expand: ["payment_intent"] },
      );
      let motorModel: string | null = null;
      try {
        const motorInfo = session.metadata?.motor_info
          ? JSON.parse(session.metadata.motor_info)
          : null;
        motorModel = typeof motorInfo?.model === "string" ? motorInfo.model : null;
      } catch {
        motorModel = null;
      }

      const paymentType = session.metadata?.payment_type || null;
      const supportedPaymentType = paymentType === "motor_deposit" || paymentType === "quote";
      const paymentIntentStatus = typeof session.payment_intent === "object"
        ? session.payment_intent?.status || null
        : null;

      return new Response(JSON.stringify({
        verified: session.payment_status === "paid" && supportedPaymentType,
        paymentStatus: session.payment_status,
        checkoutStatus: session.status,
        paymentIntentStatus,
        paymentType,
        amountPaid: session.amount_total != null ? session.amount_total / 100 : null,
        currency: session.currency?.toUpperCase() || null,
        motorModel,
        createdAt: new Date(
          (typeof session.payment_intent === "object" && session.payment_intent?.created
            ? session.payment_intent.created
            : session.created) * 1000,
        ).toISOString(),
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!validationResult.success) {
      logStep("Validation failed", validationResult.error.errors);
      return new Response(JSON.stringify({
        error: "Invalid input data",
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      quoteData,
      depositAmount,
      customerInfo,
      paymentType,
      motorInfo: requestedMotorInfo,
      quoteSnapshot,
    } = validationResult.data;

    const submittedIdentity = (paymentType === "deposit" || depositAmount)
      ? parseDepositIdentity(customerInfo)
      : null;

    if (quoteSnapshot && JSON.stringify(quoteSnapshot).length > 50_000) {
      throw new Error("Invalid quote snapshot");
    }
    
    logStep("Request validated", { paymentType: paymentType || "quote", depositAmount });

    const isDepositRequest = paymentType === "deposit" || Boolean(depositAmount);
    let userEmail = submittedIdentity?.email || customerInfo?.email;
    if (user && !isDepositRequest) userEmail = user.email;
    // Initialize service role client early (needed for both deposit and quote paths)
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle deposit payments vs quote payments
    if (paymentType === "deposit" || depositAmount) {
      if (!depositAmount || !(depositAmount in DEPOSIT_PRICES)) {
        throw new Error(`Invalid deposit amount. Available: ${Object.keys(DEPOSIT_PRICES).join(", ")}`);
      }
      const priceId = resolveDepositStripePriceId(depositAmount, {
        DEPOSIT_STAGING_MODE: Deno.env.get("DEPOSIT_STAGING_MODE"),
        SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
        STRIPE_DEPOSIT_PRICE_500: Deno.env.get("STRIPE_DEPOSIT_PRICE_500"),
      }, DEPOSIT_PRICES);

      let verifiedMotorInfo = requestedMotorInfo || null;

      // This express offer is intentionally bound to the exact 9.9 MH sale
      // model. Resolve identity from the authoritative row rather than
      // trusting client-supplied model or horsepower values.
      if (depositAmount === "100") {
        if (quoteData?.motorId !== EXPRESS_MOTOR_ID) {
          throw new Error("Invalid deposit amount for selected motor");
        }

        const { data: reservationMotor, error: reservationMotorError } = await supabaseService
          .from("motor_models")
          .select("model, model_display, horsepower, mercury_model_no, model_number")
          .eq("id", quoteData.motorId)
          .single();

        const resolvedModelNumber = reservationMotor?.mercury_model_no || reservationMotor?.model_number;
        if (
          reservationMotorError
          || !reservationMotor
          || reservationMotor.horsepower == null
          || resolvedModelNumber !== EXPRESS_MOTOR_MODEL_NUMBER
        ) {
          throw new Error("Invalid deposit amount for selected motor");
        }

        verifiedMotorInfo = {
          model: reservationMotor.model_display || reservationMotor.model,
          hp: Number(reservationMotor.horsepower),
        };
      }

      logStep("Processing deposit payment", { depositAmount, priceId });

      const origin = paymentOrigin;

      if (!depositSavedQuoteId || !submittedIdentity) {
        throw new Error("Invalid saved quote for deposit");
      }

      const { data: savedQuote, error: savedQuoteError } = await supabaseService
        .from("saved_quotes")
        .select("id, email, expires_at, is_soft_lead, deposit_status, deposit_amount, quote_pdf_path, quote_pdf_sha256, quote_state, customer_full_name, customer_phone, customer_address_line1, customer_address_line2, customer_city, customer_region, customer_postal_code, customer_country")
        .eq("id", depositSavedQuoteId)
        .maybeSingle();

      let storedIdentity;
      try {
        storedIdentity = savedQuote ? parseSavedQuoteIdentity(savedQuote) : null;
      } catch {
        storedIdentity = null;
      }

      const savedMotorId = (savedQuote?.quote_state as { motor?: { id?: string } } | null)?.motor?.id;
      if (
        savedQuoteError
        || !savedQuote
        || !storedIdentity
        || !depositIdentitiesMatch(submittedIdentity, storedIdentity)
        || savedQuote.deposit_status !== "pending"
        || Number(savedQuote.deposit_amount) !== Number(depositAmount)
        || (quoteData?.motorId && savedMotorId !== quoteData.motorId)
      ) {
        throw new Error("Invalid saved quote for deposit");
      }

      const { data: quoteDocument, error: quoteDocumentError } = await supabaseService
        .storage
        .from("quotes")
        .download(canonicalQuoteDocumentPath(savedQuote.id));

      try {
        await assertCanonicalQuoteDocumentReady({
          row: savedQuote,
          savedQuoteId: savedQuote.id,
          object: quoteDocumentError || !quoteDocument
            ? null
            : {
                bytes: new Uint8Array(await quoteDocument.arrayBuffer()),
                contentType: quoteDocument.type || "application/pdf",
              },
        });
      } catch (error) {
        if (error instanceof QuoteDocumentUnavailableError) {
          throw new Error("Invalid saved quote document for deposit");
        }
        throw error;
      }

      const savedQuoteId = savedQuote.id;
      const { data: existingDeposit, error: existingDepositError } = await supabaseService
        .from("customer_quotes")
        .select("id, stripe_checkout_session_id, payment_status")
        .eq("saved_quote_id", savedQuoteId)
        .eq("lead_source", "deposit")
        .maybeSingle();
      if (existingDepositError) {
        logStep("ERROR: Failed to read existing deposit", { code: existingDepositError.code });
        throw new Error("Unable to prepare reservation checkout");
      }

      if (existingDeposit?.payment_status === "paid") {
        throw new Error("Invalid saved quote for deposit");
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      let customerId: string | undefined;
      if (userEmail) {
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          logStep("Existing Stripe customer found", { customerId });
        }
      }

      if (existingDeposit?.stripe_checkout_session_id) {
        const existingSession = await stripe.checkout.sessions.retrieve(
          existingDeposit.stripe_checkout_session_id,
        );
        const existingSessionDisposition = classifyExistingDepositCheckoutSession(existingSession);
        if (existingSessionDisposition === "reuse_open") {
          logStep("Reusing open deposit checkout session", { sessionId: existingSession.id });
          return new Response(JSON.stringify({ url: existingSession.url, sessionId: existingSession.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        if (existingSessionDisposition === "already_complete") {
          logStep("Existing deposit checkout session is already complete", { sessionId: existingSession.id });
          throw new Error("Invalid saved quote for deposit");
        }
        if (existingSessionDisposition !== "renew_expired") {
          logStep("Existing deposit checkout session is not renewable", { sessionId: existingSession.id });
          throw new Error("Unable to prepare reservation checkout");
        }
      }
      
      const depositLineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
        ? { price: priceId, quantity: 1 }
        : {
            price_data: {
              currency: "cad",
              product_data: {
                name: "Mercury motor reservation deposit",
                description: "Reservation deposit pending Harris Boat Works confirmation",
              },
              unit_amount: Number(depositAmount) * 100,
            },
            quantity: 1,
          };

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        line_items: [depositLineItem],
        mode: "payment",
        billing_address_collection: "required",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment-canceled`,
        metadata: buildStripeDepositMetadata({
          depositAmount,
          savedQuoteId,
        }),
      };

      if (customerId) {
        sessionData.customer = customerId;
      } else if (userEmail) {
        sessionData.customer_email = userEmail;
      }

      const session = await stripe.checkout.sessions.create(sessionData, {
        idempotencyKey: stripeCheckoutIdempotencyKey({
          savedQuoteId,
          existingSessionId: existingDeposit?.stripe_checkout_session_id,
        }),
      });
      logStep("Deposit payment session created", { sessionId: session.id, savedQuoteId });

      const depositRow = buildDepositCustomerQuoteRow({
        identity: storedIdentity,
        savedQuoteId,
        userId: user?.id || null,
        sessionId: session.id,
        depositAmount: parseInt(depositAmount, 10),
        motorInfo: verifiedMotorInfo,
        quoteSnapshot,
        quoteState: savedQuote.quote_state,
        pricing: depositPricingFromBoundSnapshot(savedQuote.quote_state, quoteSnapshot),
      });

      const persistSelect = "id, payment_status, stripe_checkout_session_id";
      const persistResult = existingDeposit?.id
        ? await (existingDeposit.stripe_checkout_session_id
          ? supabaseService
            .from("customer_quotes")
            .update(depositRow)
            .eq("id", existingDeposit.id)
            .or("payment_status.is.null,payment_status.eq.pending")
            .eq("stripe_checkout_session_id", existingDeposit.stripe_checkout_session_id)
            .select(persistSelect)
            .maybeSingle()
          : supabaseService
            .from("customer_quotes")
            .update(depositRow)
            .eq("id", existingDeposit.id)
            .or("payment_status.is.null,payment_status.eq.pending")
            .is("stripe_checkout_session_id", null)
            .select(persistSelect)
            .maybeSingle())
        : await supabaseService
          .from("customer_quotes")
          .insert(depositRow)
          .select(persistSelect)
          .maybeSingle();
      const { data: persistedDeposit, error: depositSaveError } = persistResult;
      const persistOutcome = depositSaveError || !persistedDeposit?.id
        ? classifyDepositPersistOutcome({
          mode: existingDeposit?.id ? "update" : "insert",
          wrote: persistedDeposit,
          writeError: depositSaveError,
          createdSessionId: session.id,
          reread: (await supabaseService
            .from("customer_quotes")
            .select("id, stripe_checkout_session_id, payment_status")
            .eq("saved_quote_id", savedQuoteId)
            .eq("lead_source", "deposit")
            .maybeSingle()).data,
        })
        : classifyDepositPersistOutcome({
          mode: existingDeposit?.id ? "update" : "insert",
          wrote: persistedDeposit,
          createdSessionId: session.id,
        });
      if (persistOutcome === "already_paid") {
        logStep("Deposit already paid during persist race", { savedQuoteId });
        await stripe.checkout.sessions.expire(session.id);
        throw new Error("Invalid saved quote for deposit");
      }
      if (persistOutcome === "reused_same_session" && session.url) {
        logStep("Reusing concurrently persisted deposit checkout", { savedQuoteId });
        return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      if (persistOutcome !== "saved") {
        logStep("ERROR: Failed to save deposit record", { code: depositSaveError?.code });
        await stripe.checkout.sessions.expire(session.id);
        throw new Error("Unable to prepare reservation checkout");
      }
      logStep("Deposit record saved to customer_quotes", { savedQuoteId });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Quote payment flow with server-side validation
    if (!quoteData) throw new Error("Quote data is required for quote payments");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    let customerId: string | undefined;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing Stripe customer found", { customerId });
      }
    }
    logStep("Quote data received", { totalPrice: quoteData.totalPrice });

    // Server-side price validation (supabaseService already initialized above)

    // Validate motor price if motorId is provided
    let validatedMotorPrice = quoteData.motorPrice || 0;
    if (quoteData.motorId) {
      const { data: motor, error: motorError } = await supabaseService
        .from('motor_models')
        .select('dealer_price, sale_price, base_price, msrp')
        .eq('id', quoteData.motorId)
        .single();

      if (motorError) {
        logStep("Motor lookup failed", { error: motorError.message });
        throw new Error("Failed to validate motor pricing");
      }

      if (!motor) {
        throw new Error("Motor not found");
      }

      // Use the most appropriate price
      const serverMotorPrice = motor.dealer_price || motor.sale_price || motor.base_price || motor.msrp || 0;
      
      // Validate with tolerance for rounding differences
      const tolerance = 1.0; // Allow $1 difference for rounding
      const priceDifference = Math.abs(serverMotorPrice - (quoteData.motorPrice || 0));
      
      logStep("Motor price validation", {
        clientPrice: quoteData.motorPrice,
        serverPrice: serverMotorPrice,
        difference: priceDifference
      });

      if (priceDifference > tolerance) {
        logStep("Price mismatch detected - possible tampering", {
          expected: serverMotorPrice,
          received: quoteData.motorPrice,
          difference: priceDifference
        });
        throw new Error("Price validation failed. Please refresh and try again.");
      }

      validatedMotorPrice = serverMotorPrice;
    }

    // Create line items using validated prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    // Main motor item with validated price
    if (validatedMotorPrice > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { 
            name: `${quoteData.motorModel || 'Motor'} Motor`,
            description: `${quoteData.horsepower || 0}HP Mercury Motor`
          },
          unit_amount: Math.round(validatedMotorPrice * 100), // Convert to cents
        },
        quantity: 1,
      });
    }

    // Accessories (server-validated in future iterations)
    if (quoteData.accessoryCosts && quoteData.accessoryCosts > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { 
            name: "Motor Accessories",
            description: "Controls, batteries, and propeller"
          },
          unit_amount: Math.round(quoteData.accessoryCosts * 100),
        },
        quantity: 1,
      });
    }

    // Installation (server-validated in future iterations)
    if (quoteData.installationCost && quoteData.installationCost > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { 
            name: "Professional Installation",
            description: "Motor installation service"
          },
          unit_amount: Math.round(quoteData.installationCost * 100),
        },
        quantity: 1,
      });
    }

    // Trade-in credit (negative amount)
    if (quoteData.tradeInCredit && quoteData.tradeInCredit > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { 
            name: "Trade-in Credit",
            description: "Credit for your trade-in motor"
          },
          unit_amount: Math.round(-quoteData.tradeInCredit * 100), // Negative for credit
        },
        quantity: 1,
      });
    }

    logStep("Line items created", { itemCount: lineItems.length });

    // Create a one-time payment session
    const origin = paymentOrigin;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment-canceled`,
      metadata: {
        user_id: user?.id || "guest",
        quote_data: JSON.stringify(quoteData),
        payment_type: "quote"
      }
    });

    logStep("Stripe checkout session created", { sessionId: session.id, url: session.url });

    // Store quote with Stripe session info (supabaseService already initialized above)
    const { data: quoteResult, error: quoteError } = await supabaseService.from("quotes").insert({
      user_id: user?.id,
      customer_name: quoteData.customerName || userEmail,
      customer_phone: quoteData.customerPhone,
      motor_model: quoteData.motorModel,
      motor_price: quoteData.motorPrice,
      total_price: quoteData.totalPrice,
      quote_data: {
        ...quoteData,
        stripe_session_id: session.id,
        payment_status: "pending"
      }
    }).select().single();

    if (quoteError) {
      logStep("Error saving quote", { error: quoteError.message });
      await stripe.checkout.sessions.expire(session.id);
      throw new Error(`Failed to save quote: ${quoteError.message}`);
    }

    logStep("Quote saved successfully", { quoteId: quoteResult.id });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-payment", { message: errorMessage });
    const mapped = mapCreatePaymentCaughtError(error);
    return new Response(JSON.stringify({ error: mapped.error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: mapped.status,
    });
  }
});
