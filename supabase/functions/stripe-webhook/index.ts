import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function logStep(step: string, data?: Record<string, unknown>) {
  console.log(`[STRIPE-WEBHOOK] ${step}`, data ? JSON.stringify(data) : "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!signature) {
      logStep("ERROR: No stripe-signature header");
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      logStep("ERROR: Signature verification failed", { error: err.message });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Checkout session completed", {
        sessionId: session.id,
        paymentType: session.metadata?.payment_type,
        customerEmail: session.customer_email,
      });

      if (session.metadata?.payment_type === "motor_deposit") {
        const depositAmount = session.metadata.deposit_amount;
        const customerName = session.metadata.customer_name || "Customer";
        const customerEmail = session.customer_email || session.metadata.customer_email;
        const customerPhone = session.metadata.customer_phone || "";
        const paymentIntentId = typeof session.payment_intent === "string" 
          ? session.payment_intent 
          : session.payment_intent?.id;
        
        // Extract billing address from Stripe session
        const billingAddress = session.customer_details?.address;
        const customerAddress = billingAddress ? {
          line1: billingAddress.line1 || "",
          line2: billingAddress.line2 || "",
          city: billingAddress.city || "",
          state: billingAddress.state || "",
          postalCode: billingAddress.postal_code || "",
          country: billingAddress.country || "",
        } : null;

        let motorInfo = null;
        if (session.metadata.motor_info) {
          try {
            motorInfo = JSON.parse(session.metadata.motor_info);
          } catch {
            logStep("Could not parse motor_info metadata");
          }
        }

        logStep("Processing deposit confirmation", {
          depositAmount, customerName, customerEmail, paymentIntentId, motorInfo, customerAddress,
        });

        const quotePdfPath = session.metadata.quote_pdf_path || "";

        // Fetch the full quote record to get pricing data
        let quoteRecord: any = null;
        const { data: existingDeposit, error: findError } = await supabase
          .from("customer_quotes")
          .select("*")
          .eq("lead_source", "deposit")
          .contains("quote_data", { stripe_session_id: session.id })
          .maybeSingle();

        if (findError) {
          logStep("WARNING: Error finding deposit record", { error: findError.message });
        }

        if (existingDeposit) {
          quoteRecord = existingDeposit;
          const { error: updateError } = await supabase
            .from("customer_quotes")
            .update({
              lead_status: "scheduled",
              quote_data: {
                ...(existingDeposit.quote_data || {}),
                deposit_amount: depositAmount,
                payment_type: "motor_deposit",
                stripe_session_id: session.id,
                stripe_payment_intent: paymentIntentId,
                payment_status: "paid",
                motor_info: motorInfo,
                quote_pdf_path: quotePdfPath || null,
              },
            })
            .eq("id", existingDeposit.id);

          if (updateError) {
            logStep("ERROR: Failed to update deposit record", { error: updateError.message });
          } else {
            logStep("Deposit record updated to scheduled", { quoteId: existingDeposit.id });
          }
        } else {
          logStep("No existing deposit record found for session", { sessionId: session.id });
        }

        // Build pricing data from the quote record
        const pricingData = quoteRecord ? {
          basePrice: quoteRecord.base_price,
          finalPrice: quoteRecord.final_price,
          totalCost: quoteRecord.total_cost,
          discountAmount: quoteRecord.discount_amount,
          quoteData: quoteRecord.quote_data,
        } : null;

        if (customerEmail) {
          const { error: emailError } = await supabase.functions.invoke("send-deposit-confirmation-email", {
            body: {
              customerEmail,
              customerName,
              customerPhone,
              customerAddress,
              depositAmount,
              paymentId: paymentIntentId,
              motorInfo,
              sendAdminNotification: true,
              quotePdfPath,
              pricingData,
            },
          });

          if (emailError) {
            logStep("ERROR: Failed to send confirmation email", { error: emailError.message });
          } else {
            logStep("Confirmation email sent successfully");
          }
        } else {
          logStep("WARNING: No customer email available for confirmation");
          const { error: adminEmailError } = await supabase.functions.invoke("send-deposit-confirmation-email", {
            body: {
              customerEmail: "",
              customerName,
              customerPhone,
              customerAddress,
              depositAmount,
              paymentId: paymentIntentId,
              motorInfo,
              sendAdminNotification: true,
              adminOnly: true,
              quotePdfPath,
              pricingData,
            },
          });
          if (adminEmailError) {
            logStep("ERROR: Failed to send admin notification", { error: adminEmailError.message });
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR: Webhook handler failed", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
