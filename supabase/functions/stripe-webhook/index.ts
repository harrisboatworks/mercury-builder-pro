import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
  // Handle CORS preflight
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

    // Handle checkout.session.completed for deposit payments
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Checkout session completed", {
        sessionId: session.id,
        paymentType: session.metadata?.payment_type,
        customerEmail: session.customer_email,
      });

      // Only process motor deposit payments
      if (session.metadata?.payment_type === "motor_deposit") {
        const depositAmount = session.metadata.deposit_amount;
        const customerName = session.metadata.customer_name || "Customer";
        const customerEmail = session.customer_email || session.metadata.customer_email;
        const paymentIntentId = typeof session.payment_intent === "string" 
          ? session.payment_intent 
          : session.payment_intent?.id;
        
        // Parse motor info if available
        let motorInfo = null;
        if (session.metadata.motor_info) {
          try {
            motorInfo = JSON.parse(session.metadata.motor_info);
          } catch {
            logStep("Could not parse motor_info metadata");
          }
        }

        logStep("Processing deposit confirmation email", {
          depositAmount,
          customerName,
          customerEmail,
          paymentIntentId,
          motorInfo,
        });

        if (customerEmail) {
          // Call the email sending function
          const { error: emailError } = await supabase.functions.invoke("send-deposit-confirmation-email", {
            body: {
              customerEmail,
              customerName,
              depositAmount,
              paymentId: paymentIntentId,
              motorInfo,
            },
          });

          if (emailError) {
            logStep("ERROR: Failed to send confirmation email", { error: emailError.message });
          } else {
            logStep("Confirmation email sent successfully");
          }
        } else {
          logStep("WARNING: No customer email available for confirmation");
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
