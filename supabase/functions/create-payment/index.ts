import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { quoteData } = await req.json();
    if (!quoteData) throw new Error("Quote data is required");
    logStep("Quote data received", { totalPrice: quoteData.totalPrice });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      logStep("No existing customer found, will create new one");
    }

    // Create line items for the quote
    const lineItems = [];
    
    // Main motor item
    if (quoteData.motorPrice > 0) {
      lineItems.push({
        price_data: {
          currency: "cad",
          product_data: { 
            name: `${quoteData.motorModel} Motor`,
            description: `${quoteData.horsepower}HP Mercury Motor`
          },
          unit_amount: Math.round(quoteData.motorPrice * 100), // Convert to cents
        },
        quantity: 1,
      });
    }

    // Accessories
    if (quoteData.accessoryCosts > 0) {
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

    // Installation
    if (quoteData.installationCost > 0) {
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
    if (quoteData.tradeInCredit > 0) {
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
      customer_email: customerId ? undefined : user.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      metadata: {
        user_id: user.id,
        quote_data: JSON.stringify(quoteData)
      }
    });

    logStep("Stripe checkout session created", { sessionId: session.id, url: session.url });

    // Store quote with Stripe session info using service role key
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: quoteResult, error: quoteError } = await supabaseService.from("quotes").insert({
      user_id: user.id,
      customer_name: quoteData.customerName || user.email,
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