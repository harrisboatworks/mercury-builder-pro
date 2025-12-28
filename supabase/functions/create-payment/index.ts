import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Motor deposit price mapping
const DEPOSIT_PRICES: Record<string, string> = {
  "500": "price_1S71kJHhVKClVQCpoZsxgqar",    // $500 - Small motors (under 50HP)
  "1000": "price_1S71kbHhVKClVQCpHM7Xg9FJ",   // $1000 - Mid-range motors (50-150HP)
  "2500": "price_1S71kmHhVKClVQCp20TxHSET"    // $2500 - High-performance motors (150HP+)
};

// Input validation schemas
const customerInfoSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().max(20).optional(),
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

const paymentRequestSchema = z.object({
  quoteData: quoteDataSchema,
  depositAmount: z.enum(["500", "1000", "2500"]).optional(),
  customerInfo: customerInfoSchema,
  paymentType: z.enum(["deposit", "quote"]).optional(),
});

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create Supabase client using the anon key for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Parse and validate request body
    const rawBody = await req.json();
    const validationResult = paymentRequestSchema.safeParse(rawBody);
    
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

    const { quoteData, depositAmount, customerInfo, paymentType } = validationResult.data;
    
    logStep("Request validated", { paymentType: paymentType || "quote", depositAmount });

    // Handle authentication - required for quote payments, optional for deposits
    let user = null;
    let userEmail = customerInfo?.email;
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (!userError && userData.user?.email) {
          user = userData.user;
          userEmail = user.email;
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
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
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

    // Handle deposit payments vs quote payments
    if (paymentType === "deposit" || depositAmount) {
      if (!depositAmount || !DEPOSIT_PRICES[depositAmount]) {
        throw new Error(`Invalid deposit amount. Available: ${Object.keys(DEPOSIT_PRICES).join(", ")}`);
      }

      const priceId = DEPOSIT_PRICES[depositAmount];
      logStep("Processing deposit payment", { depositAmount, priceId });

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "payment",
        success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.get("origin")}/payment-canceled`,
        metadata: {
          deposit_amount: depositAmount,
          payment_type: "motor_deposit"
        }
      };

      if (customerId) {
        sessionData.customer = customerId;
      } else if (userEmail) {
        sessionData.customer_email = userEmail;
      }

      if (customerInfo?.name) {
        sessionData.metadata = sessionData.metadata || {};
        sessionData.metadata.customer_name = customerInfo.name;
      }

      const session = await stripe.checkout.sessions.create(sessionData);
      logStep("Deposit payment session created", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Quote payment flow with server-side validation
    if (!quoteData) throw new Error("Quote data is required for quote payments");
    logStep("Quote data received", { totalPrice: quoteData.totalPrice });

    // Server-side price validation using service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

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
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
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
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
