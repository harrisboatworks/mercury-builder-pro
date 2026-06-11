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
        const savedQuoteId = session.metadata.saved_quote_id || "";
        
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
          depositAmount, customerName, customerEmail, paymentIntentId, motorInfo, savedQuoteId,
        });

        const quotePdfPath = session.metadata.quote_pdf_path || "";

        // Update customer_quotes record
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
        }

        // Update saved_quotes record with deposit confirmation
        if (savedQuoteId) {
          const { error: sqUpdateError } = await supabase
            .from("saved_quotes")
            .update({
              deposit_status: "paid",
              deposit_amount: parseFloat(depositAmount),
              deposit_paid_at: new Date().toISOString(),
            })
            .eq("id", savedQuoteId);

          if (sqUpdateError) {
            logStep("WARNING: Failed to update saved_quotes deposit status", { error: sqUpdateError.message });
          } else {
            logStep("saved_quotes deposit status updated to paid", { savedQuoteId });
          }
        } else if (customerEmail) {
          // Fallback: try to find saved_quote by email + pending deposit
          const { error: sqFallbackError } = await supabase
            .from("saved_quotes")
            .update({
              deposit_status: "paid",
              deposit_amount: parseFloat(depositAmount),
              deposit_paid_at: new Date().toISOString(),
            })
            .eq("email", customerEmail)
            .eq("deposit_status", "pending")
            .order("created_at", { ascending: false })
            .limit(1);

          if (sqFallbackError) {
            logStep("WARNING: Fallback saved_quotes update failed", { error: sqFallbackError.message });
          } else {
            logStep("saved_quotes updated via email fallback");
          }
        }

        // Send confirmation emails
        const motorLabel = motorInfo?.model || motorInfo?.name || motorInfo?.displayName || "Mercury motor";
        let emailFailed = false;
        try {
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
              },
            });

            if (emailError) {
              emailFailed = true;
              logStep("ERROR: Failed to send confirmation email", { error: emailError.message });
            } else {
              logStep("Confirmation email sent successfully");
            }
          } else {
            logStep("WARNING: No customer email available for confirmation");
            await supabase.functions.invoke("send-deposit-confirmation-email", {
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
              },
            });
          }
        } catch (e: any) {
          emailFailed = true;
          logStep("ERROR: Deposit confirmation email threw", { error: e?.message });
        }

        // Safety-net admin SMS if confirmation email failed
        if (emailFailed) {
          try {
            await supabase.functions.invoke("send-sms", {
              body: {
                to: "admin",
                message: `Deposit email FAILED for ${customerEmail || "(no email)"} - follow up manually`,
                messageType: "hot_lead",
              },
            });
          } catch (e: any) {
            logStep("WARNING: Admin email-failure SMS failed", { error: e?.message });
          }
        }

        // Customer SMS confirmation
        if (customerPhone) {
          try {
            await supabase.functions.invoke("send-sms", {
              body: {
                to: customerPhone,
                message: `Harris Boat Works: deposit received for your ${motorLabel}. We'll call you to confirm details and pickup. Questions? (905) 342-2153`,
                messageType: "quote_confirmation",
                customerName,
              },
            });
            logStep("Customer SMS confirmation sent");
          } catch (e: any) {
            logStep("WARNING: Customer SMS failed", { error: e?.message });
          }
        }

        // Admin SMS notification
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              to: "admin",
              message: `Deposit paid: ${customerName}, ${motorLabel}, $${depositAmount}`,
              messageType: "hot_lead",
            },
          });
        } catch (e: any) {
          logStep("WARNING: Admin deposit SMS failed", { error: e?.message });
        }
      } else if (session.metadata?.payment_type === "quote") {
        // Quote-path payment: mark quote paid and notify admins
        const customerName = session.metadata.customer_name || "Customer";
        const customerEmail = session.customer_email || session.metadata.customer_email || "";
        const amountTotal = ((session.amount_total || 0) / 100).toFixed(2);
        let motorLabel = "Mercury motor";
        if (session.metadata.motor_info) {
          try {
            const mi = JSON.parse(session.metadata.motor_info);
            motorLabel = mi?.model || mi?.name || mi?.displayName || motorLabel;
          } catch { /* ignore */ }
        }

        logStep("Processing quote payment", { sessionId: session.id, customerEmail, amountTotal });

        // Update quotes row by stored stripe session id
        const { data: quoteRow, error: quoteFindError } = await supabase
          .from("quotes")
          .select("id, quote_data")
          .contains("quote_data", { stripe_session_id: session.id })
          .maybeSingle();

        if (quoteFindError) {
          logStep("WARNING: quote lookup failed", { error: quoteFindError.message });
        }

        if (quoteRow) {
          const { error: quoteUpdateError } = await supabase
            .from("quotes")
            .update({
              quote_data: {
                ...(quoteRow.quote_data || {}),
                payment_status: "paid",
                stripe_session_id: session.id,
                paid_at: new Date().toISOString(),
              },
            })
            .eq("id", quoteRow.id);
          if (quoteUpdateError) {
            logStep("WARNING: quote update failed", { error: quoteUpdateError.message });
          } else {
            logStep("Quote marked paid", { quoteId: quoteRow.id });
          }
        } else {
          logStep("No matching quote row found for session", { sessionId: session.id });
        }

        // Admin SMS
        try {
          await supabase.functions.invoke("send-sms", {
            body: {
              to: "admin",
              message: `Quote payment received: ${customerName}, ${motorLabel}, $${amountTotal}`,
              messageType: "hot_lead",
            },
          });
        } catch (e: any) {
          logStep("WARNING: Admin quote-payment SMS failed", { error: e?.message });
        }

        // Admin email notification (reuse deposit confirmation function in adminOnly mode)
        try {
          await supabase.functions.invoke("send-deposit-confirmation-email", {
            body: {
              customerEmail: "",
              customerName,
              customerPhone: session.metadata.customer_phone || "",
              depositAmount: amountTotal,
              paymentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
              motorInfo: { model: motorLabel, paymentType: "quote", customerEmail },
              sendAdminNotification: true,
              adminOnly: true,
            },
          });
        } catch (e: any) {
          logStep("WARNING: Admin quote-payment email failed", { error: e?.message });
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
