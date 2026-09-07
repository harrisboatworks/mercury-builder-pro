import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitedResponse } from "../_shared/rate-limit.ts";
import { resolveAllowedBrowserOrigin } from "../_shared/browser-origin.ts";
import { assertDepositRequestHasSavedQuoteId } from "../_shared/deposit-payment-guard.ts";
import {
  getMotorReservationDeposit,
  isVerifiedExpressMotorReservation,
} from "../_shared/deposit-policy.ts";
import {
  assertCanonicalQuoteDocumentReady,
  canonicalQuoteDocumentPath,
  QuoteDocumentUnavailableError,
  sha256Hex,
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

type JsonRecord = Record<string, unknown>;

function asJsonRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

// Input validation schemas
const customerInfoSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(255).optional().or(z.literal('')).or(z.null()),
  phone: z.string().trim().min(7).max(20).regex(/^[0-9+().\s-]+$/)
    .refine(value => value.replace(/\D/g, '').length >= 7, "Phone number must include at least 7 digits")
    .optional(),
}).optional();

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

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

async function expireCheckoutSessionSafely(
  stripe: Stripe,
  sessionId: string,
): Promise<void> {
  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch (error) {
    logStep("WARNING: Could not expire unbound checkout", {
      sessionId,
      error: error instanceof Error ? error.message : "Unknown Stripe error",
    });
  }
}

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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Parse and fail-closed on deposit identity before any Stripe client or API call.
    const rawBody = await req.json();
    const verificationResult = verificationRequestSchema.safeParse(rawBody);
    const validationResult = paymentRequestSchema.safeParse(rawBody);

    let depositSavedQuoteId: string | null = null;
    if (!verificationResult.success) {
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
      depositSavedQuoteId = assertDepositRequestHasSavedQuoteId(validationResult.data);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    if (verificationResult.success) {
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
      quoteSnapshot,
    } = validationResult.data;

    if (
      (paymentType === "deposit" || depositAmount)
      && (!customerInfo?.name || !customerInfo.email || !customerInfo.phone)
    ) {
      throw new Error("Customer information required for deposit");
    }

    if (quoteSnapshot && JSON.stringify(quoteSnapshot).length > 50_000) {
      throw new Error("Invalid quote snapshot");
    }
    
    logStep("Request validated", { paymentType: paymentType || "quote", depositAmount });

    // Handle authentication - required for quote payments, optional for deposits
    const isDepositRequest = paymentType === "deposit" || Boolean(depositAmount);
    let user = null;
    let userEmail = customerInfo?.email;
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (!userError && userData.user?.email) {
          user = userData.user;
          if (!isDepositRequest) userEmail = user.email;
          logStep("User authenticated", { userId: user.id, email: user.email });
        }
      } catch (error) {
        logStep("Auth failed, proceeding as guest", { error: error instanceof Error ? error.message : 'Unknown' });
      }
    }

    // For quote payments, require authentication
    if (paymentType === "quote" && !user) {
      throw new Error("Authentication required for quote payments");
    }
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

      const origin = paymentOrigin;
      const customerName = customerInfo!.name!;
      const customerPhone = customerInfo!.phone!;

      // A saved quote is required for every deposit. The object key is derived
      // server-side and revalidated before any Stripe API call.
      if (!depositSavedQuoteId) {
        throw new Error("Invalid saved quote for deposit");
      }

      const { data: savedQuote, error: savedQuoteError } = await supabaseService
        .from("saved_quotes")
        .select("id, email, expires_at, is_soft_lead, deposit_status, deposit_amount, quote_pdf_path, quote_pdf_sha256, quote_state")
        .eq("id", depositSavedQuoteId)
        .maybeSingle();

      const savedQuoteState = asJsonRecord(savedQuote?.quote_state);
      const savedMotor = asJsonRecord(savedQuoteState?.motor);
      const savedMotorId = typeof savedMotor?.id === "string"
        ? savedMotor.id
        : "";
      if (
        savedQuoteError
        || !savedQuote
        || savedQuote.email?.trim().toLowerCase() !== customerInfo!.email!.trim().toLowerCase()
        || savedQuote.deposit_status !== "pending"
        || !savedMotorId
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

      // The saved quote identifies the motor, but catalog identity, horsepower,
      // display name, and the resulting tier are all resolved server-side.
      const { data: reservationMotor, error: reservationMotorError } = await supabaseService
        .from("motor_models")
        .select("id, model, model_display, horsepower, mercury_model_no, model_number")
        .eq("id", savedMotorId)
        .single();

      const resolvedHorsepower = Number(reservationMotor?.horsepower);
      const resolvedModelNumber = reservationMotor?.mercury_model_no || reservationMotor?.model_number;
      if (
        reservationMotorError
        || !reservationMotor
        || reservationMotor.id !== savedMotorId
        || !Number.isFinite(resolvedHorsepower)
        || resolvedHorsepower <= 0
      ) {
        throw new Error("Invalid saved quote for deposit");
      }

      const expressOfferVerified = isVerifiedExpressMotorReservation({
        motorId: savedMotorId,
        modelNumber: resolvedModelNumber,
      });
      const authoritativeDeposit = getMotorReservationDeposit(
        resolvedHorsepower,
        expressOfferVerified,
      );
      if (
        Number(depositAmount) !== authoritativeDeposit
        || Number(savedQuote.deposit_amount) !== authoritativeDeposit
      ) {
        throw new Error("Invalid deposit amount for selected motor");
      }

      // This RPC is installed by the same migration as the two unique indexes.
      // If the function is deployed first, deposit traffic fails closed before
      // any Stripe API call instead of allowing concurrent payable sessions.
      const { data: bindingAuthorityReady, error: bindingAuthorityError } =
        await supabaseService.rpc("deposit_checkout_binding_authority_ready");
      if (bindingAuthorityError || bindingAuthorityReady !== true) {
        throw new Error("Unable to prepare reservation checkout");
      }

      const authoritativeDepositAmount = String(authoritativeDeposit);
      const priceId = DEPOSIT_PRICES[authoritativeDepositAmount];
      const verifiedMotorInfo = {
        model: reservationMotor.model_display || reservationMotor.model,
        hp: resolvedHorsepower,
      };
      const savedQuoteId = savedQuote.id;
      const bindingMatchesAuthority = (binding: JsonRecord | null): boolean => {
        const boundQuoteData = asJsonRecord(binding?.quote_data);
        const boundMotorInfo = asJsonRecord(boundQuoteData?.motor_info);
        const bindingEmail = typeof binding?.customer_email === "string"
          ? binding.customer_email.trim().toLowerCase()
          : "";
        return Boolean(
          binding
          && bindingEmail === customerInfo!.email!.trim().toLowerCase()
          && Number(binding.deposit_amount) === authoritativeDeposit
          && boundQuoteData?.saved_quote_id === savedQuoteId
          && boundQuoteData?.deposit_amount === authoritativeDepositAmount
          && boundQuoteData?.payment_type === "motor_deposit"
          && boundQuoteData?.payment_status === "pending"
          && boundQuoteData?.motor_id === savedMotorId
          && boundMotorInfo?.model === verifiedMotorInfo.model
          && Number(boundMotorInfo?.hp) === resolvedHorsepower
          && typeof boundQuoteData?.stripe_session_id === "string",
        );
      };
      const bindingMatchesReplaceableLegacyAuthority = (
        binding: JsonRecord | null,
      ): boolean => {
        const boundQuoteData = asJsonRecord(binding?.quote_data);
        const bindingEmail = typeof binding?.customer_email === "string"
          ? binding.customer_email.trim().toLowerCase()
          : "";
        return Boolean(
          binding
          && bindingEmail === customerInfo!.email!.trim().toLowerCase()
          && Number(binding.deposit_amount) === authoritativeDeposit
          && boundQuoteData?.saved_quote_id === savedQuoteId
          && boundQuoteData?.deposit_amount === authoritativeDepositAmount
          && boundQuoteData?.payment_type === "motor_deposit"
          && boundQuoteData?.payment_status === "pending"
          && boundQuoteData?.motor_id === undefined
          && typeof boundQuoteData?.stripe_session_id === "string",
        );
      };

      const { data: priorBinding, error: priorBindingError } = await supabaseService
        .from("customer_quotes")
        .select("id, customer_email, deposit_amount, quote_data")
        .eq("lead_source", "deposit")
        .contains("quote_data", { saved_quote_id: savedQuoteId })
        .maybeSingle();
      if (priorBindingError) {
        throw new Error("Unable to prepare reservation checkout");
      }

      const priorBindingRecord = asJsonRecord(priorBinding);
      const priorBindingIsExact = bindingMatchesAuthority(priorBindingRecord);
      const priorBindingIsReplaceableLegacy =
        bindingMatchesReplaceableLegacyAuthority(priorBindingRecord);
      if (
        priorBinding
        && !priorBindingIsExact
        && !priorBindingIsReplaceableLegacy
      ) {
        throw new Error("Unable to prepare reservation checkout");
      }

      let expiredBinding: {
        id: string;
        sessionId: string;
      } | null = null;
      if (priorBinding) {
        const priorQuoteData = asJsonRecord(priorBinding.quote_data);
        const priorSessionId = priorQuoteData?.stripe_session_id;
        if (typeof priorSessionId !== "string") {
          throw new Error("Unable to prepare reservation checkout");
        }
        let priorSession: Stripe.Checkout.Session;
        try {
          priorSession = await stripe.checkout.sessions.retrieve(priorSessionId);
        } catch (error) {
          logStep("ERROR: Could not verify bound checkout", {
            sessionId: priorSessionId,
            error: error instanceof Error ? error.message : "Unknown Stripe error",
          });
          throw new Error("Unable to prepare reservation checkout");
        }

        if (
          priorBindingIsExact
          && priorSession.status === "open"
          && priorSession.url
        ) {
          logStep("Reusing existing motor reservation checkout", {
            sessionId: priorSession.id,
          });
          return new Response(JSON.stringify({
            url: priorSession.url,
            sessionId: priorSession.id,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        if (
          priorSession.status !== "expired"
          || priorSession.payment_status !== "unpaid"
        ) {
          throw new Error("Unable to prepare reservation checkout");
        }

        expiredBinding = {
          id: priorBinding.id,
          sessionId: priorSessionId,
        };
      }

      logStep("Processing deposit payment", {
        depositAmount: authoritativeDepositAmount,
        motorId: savedMotorId,
        priceId,
      });

      // All deposit authority checks above must succeed before the first Stripe
      // API call. Customer lookup is intentionally inside this guarded branch.
      let customerId;
      if (userEmail) {
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          logStep("Existing Stripe customer found", { customerId });
        } else {
          logStep("No existing customer found, will create new one");
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
              unit_amount: authoritativeDeposit * 100,
            },
            quantity: 1,
          };

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        line_items: [depositLineItem],
        mode: "payment",
        billing_address_collection: "required",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment-canceled`,
        metadata: {
          deposit_amount: authoritativeDepositAmount,
          payment_type: "motor_deposit",
          customer_name: customerName,
          customer_email: userEmail || customerInfo?.email || "",
          customer_phone: customerPhone,
          motor_id: savedMotorId,
          motor_info: JSON.stringify(verifiedMotorInfo),
          saved_quote_id: savedQuoteId,
        }
      };

      if (customerId) {
        sessionData.customer = customerId;
      } else if (userEmail) {
        sessionData.customer_email = userEmail;
      }

      const idempotencyFingerprint = (await sha256Hex(new TextEncoder().encode(
        JSON.stringify({
          depositAmount: authoritativeDepositAmount,
          origin,
          customerName,
          customerEmail: userEmail || customerInfo?.email || "",
          customerPhone,
          stripeCustomer: customerId || null,
          motorId: savedMotorId,
          motorInfo: verifiedMotorInfo,
          replacesSessionId: expiredBinding?.sessionId || null,
        }),
      ))).slice(0, 32);
      const session = await stripe.checkout.sessions.create(
        sessionData,
        {
          idempotencyKey:
            `motor-reservation:${savedQuoteId}:${idempotencyFingerprint}`,
        },
      );
      if (session.status !== "open" || !session.url) {
        if (session.status === "open") {
          await expireCheckoutSessionSafely(stripe, session.id);
        }
        throw new Error("Unable to prepare reservation checkout");
      }
      logStep("Deposit payment session created", { sessionId: session.id });

      // Persist the server binding before returning a usable checkout URL.
      // The migration in this PR must be applied with the function so a race
      // cannot create a second saved-quote or Stripe-session binding.
      const depositQuoteData = {
        deposit_amount: authoritativeDepositAmount,
        payment_type: "motor_deposit",
        stripe_session_id: session.id,
        payment_status: "pending",
        motor_id: savedMotorId,
        motor_info: verifiedMotorInfo,
        saved_quote_id: savedQuoteId,
        ...(quoteSnapshot ? { quote_snapshot: quoteSnapshot } : {}),
      };
      const depositRow = {
        user_id: user?.id || null,
        anonymous_session_id: user ? null : (session.id || crypto.randomUUID()),
        customer_name: customerName,
        customer_email: userEmail || customerInfo?.email || "",
        customer_phone: customerPhone || null,
        base_price: 0,
        final_price: 0,
        deposit_amount: authoritativeDeposit,
        total_cost: 0,
        loan_amount: 0,
        monthly_payment: 0,
        term_months: 0,
        lead_status: "downloaded",
        lead_source: "deposit",
        quote_data: depositQuoteData,
      };

      type CurrentBindingRead =
        | { state: "error" }
        | { state: "missing" }
        | {
            state: "found";
            authoritative: boolean;
            sessionId: string | null;
            session: Stripe.Checkout.Session | null;
          };
      const readCurrentBinding = async (): Promise<CurrentBindingRead> => {
        const { data: currentBinding, error: currentBindingError } = await supabaseService
          .from("customer_quotes")
          .select("id, customer_email, deposit_amount, quote_data")
          .eq("lead_source", "deposit")
          .contains("quote_data", { saved_quote_id: savedQuoteId })
          .maybeSingle();
        if (currentBindingError) return { state: "error" };
        if (!currentBinding) return { state: "missing" };

        const currentQuoteData = asJsonRecord(currentBinding.quote_data);
        const currentSessionId = currentQuoteData?.stripe_session_id;
        if (typeof currentSessionId !== "string") {
          return {
            state: "found",
            authoritative: false,
            sessionId: null,
            session: null,
          };
        }
        try {
          return {
            state: "found",
            authoritative: bindingMatchesAuthority(asJsonRecord(currentBinding)),
            sessionId: currentSessionId,
            session: await stripe.checkout.sessions.retrieve(currentSessionId),
          };
        } catch (error) {
          logStep("ERROR: Could not refresh bound checkout", {
            sessionId: currentSessionId,
            error: error instanceof Error ? error.message : "Unknown Stripe error",
          });
          return {
            state: "found",
            authoritative: bindingMatchesAuthority(asJsonRecord(currentBinding)),
            sessionId: currentSessionId,
            session: null,
          };
        }
      };

      if (expiredBinding) {
        const { data: rebound, error: reboundError } = await supabaseService
          .from("customer_quotes")
          .update({
            customer_name: depositRow.customer_name,
            customer_email: depositRow.customer_email,
            customer_phone: depositRow.customer_phone,
            deposit_amount: depositRow.deposit_amount,
            lead_status: depositRow.lead_status,
            quote_data: depositQuoteData,
          })
          .eq("id", expiredBinding.id)
          .eq("lead_source", "deposit")
          .contains("quote_data", {
            saved_quote_id: savedQuoteId,
            stripe_session_id: expiredBinding.sessionId,
            payment_status: "pending",
          })
          .select("id")
          .maybeSingle();
        if (!reboundError && rebound) {
          logStep("Replaced expired motor reservation checkout", {
            previousSessionId: expiredBinding.sessionId,
            sessionId: session.id,
          });
        } else {
          const currentBinding = await readCurrentBinding();
          if (
            currentBinding.state === "found"
            && currentBinding.authoritative
            && currentBinding.session?.status === "open"
            && currentBinding.session.url
          ) {
            if (currentBinding.sessionId !== session.id && session.status === "open") {
              await expireCheckoutSessionSafely(stripe, session.id);
            }
            return new Response(JSON.stringify({
              url: currentBinding.session.url,
              sessionId: currentBinding.session.id,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
          if (
            (currentBinding.state === "missing"
              || (currentBinding.state === "found"
                && currentBinding.sessionId !== session.id))
            && session.status === "open"
          ) {
            await expireCheckoutSessionSafely(stripe, session.id);
          }
          logStep("ERROR: Failed to replace expired deposit binding", {
            error: reboundError?.message || "concurrent binding change",
          });
          throw new Error("Unable to prepare reservation checkout");
        }
      } else {
        const { error: depositSaveError } = await supabaseService
          .from("customer_quotes")
          .insert(depositRow);
        if (depositSaveError) {
          if (depositSaveError.code === "23505") {
            const currentBinding = await readCurrentBinding();
            if (
              currentBinding.state === "found"
              && currentBinding.authoritative
              && currentBinding.session?.status === "open"
              && currentBinding.session.url
            ) {
              if (currentBinding.sessionId !== session.id && session.status === "open") {
                await expireCheckoutSessionSafely(stripe, session.id);
              }
              logStep("Reusing concurrently-created motor reservation checkout", {
                sessionId: currentBinding.session.id,
              });
              return new Response(JSON.stringify({
                url: currentBinding.session.url,
                sessionId: currentBinding.session.id,
              }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
              });
            }
            if (
              (currentBinding.state === "missing"
                || (currentBinding.state === "found"
                  && currentBinding.sessionId !== session.id))
              && session.status === "open"
            ) {
              await expireCheckoutSessionSafely(stripe, session.id);
            }
          }

          logStep("ERROR: Failed to save deposit record", {
            error: depositSaveError.message,
          });
          // For non-unique persistence errors, keep the idempotent session
          // unreachable so a retry can bind that same Stripe session durably.
          throw new Error("Unable to prepare reservation checkout");
        }
        logStep("Deposit record saved to customer_quotes");
      }

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Quote payment flow with server-side validation
    if (!quoteData) throw new Error("Quote data is required for quote payments");
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

    let customerId;
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Existing Stripe customer found", { customerId });
      } else {
        logStep("No existing customer found, will create new one");
      }
    }

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
    
    // Return safe error messages to clients — never expose raw internal details.
    // Buyer/request errors should not be reported as server failures.
    const isAuthError = errorMessage.includes("Authentication required");
    const isClientError = errorMessage.includes("Invalid deposit amount")
      || errorMessage.includes("Customer information required")
      || errorMessage.includes("Invalid saved quote")
      || errorMessage.includes("Invalid saved quote document")
      || errorMessage.includes("Invalid quote snapshot")
      || errorMessage.includes("Price validation failed")
      || errorMessage.includes("Quote data is required")
      || errorMessage.includes("Unexpected end of JSON input");

    const safeMessage = isAuthError ? "Authentication required"
      : errorMessage.includes("Invalid deposit amount") ? "Invalid deposit amount"
      : errorMessage.includes("Customer information required") ? "Name, email, and phone are required for a deposit"
      : errorMessage.includes("Invalid saved quote document") ? "The saved quote document could not be verified. Please refresh and try again."
      : errorMessage.includes("Invalid saved quote") ? "The saved quote could not be verified. Please refresh and try again."
      : errorMessage.includes("Invalid quote snapshot") ? "Invalid quote data"
      : errorMessage.includes("Price validation failed") ? "Price validation failed. Please refresh and try again."
      : errorMessage.includes("Quote data is required") ? "Quote data is required"
      : errorMessage.includes("Unexpected end of JSON input") ? "Invalid input data"
      : "An error occurred processing your payment. Please try again.";
    
    return new Response(JSON.stringify({ error: safeMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : isClientError ? 400 : 500,
    });
  }
});
