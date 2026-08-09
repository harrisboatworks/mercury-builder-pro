import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import {
  claimDepositAfterValidation,
  validateDepositBeforeClaim,
} from "./deposit-reconciliation.ts";

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

const NOTIFICATION_LEASE_MS = 5 * 60 * 1000;

function notificationLeaseExpiresAt(): string {
  return new Date(Date.now() + NOTIFICATION_LEASE_MS).toISOString();
}

function notificationLeaseIsActive(quoteData: Record<string, any>): boolean {
  const expiresAt = Date.parse(String(quoteData.notification_lease_expires_at || ""));
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function notificationsComplete(quoteData: Record<string, any>): boolean {
  return quoteData.notification_status === "delivered"
    || quoteData.notification_status === "manual_follow_up";
}

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

    if (
      event.type === "checkout.session.completed"
      || event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      
      logStep("Checkout session completed", {
        sessionId: session.id,
        paymentType: session.metadata?.payment_type,
        customerEmail: session.customer_email,
      });

      if (session.payment_status !== "paid") {
        logStep("Checkout completed without paid status; awaiting payment success", {
          sessionId: session.id,
          paymentStatus: session.payment_status,
        });
        return new Response(JSON.stringify({ received: true, processed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (session.metadata?.payment_type === "motor_deposit") {
        const metadataDepositAmount = session.metadata.deposit_amount;
        const customerName = session.metadata.customer_name || "Customer";
        const stripeReceiptEmail = session.customer_details?.email || session.customer_email || "";
        const customerPhone = session.metadata.customer_phone || "";
        const paymentIntentId = typeof session.payment_intent === "string" 
          ? session.payment_intent 
          : session.payment_intent?.id;
        const metadataSavedQuoteId = session.metadata.saved_quote_id || "";
        
        let motorInfo = null;
        if (session.metadata.motor_info) {
          try {
            motorInfo = JSON.parse(session.metadata.motor_info);
          } catch {
            logStep("Could not parse motor_info metadata");
          }
        }

        logStep("Processing deposit confirmation", {
          depositAmount: metadataDepositAmount,
          customerName,
          stripeReceiptEmail,
          paymentIntentId,
          motorInfo,
          savedQuoteId: metadataSavedQuoteId,
        });

        const metadataQuotePdfPath = session.metadata.quote_pdf_path || "";

        // The row created before checkout is the authoritative binding. Claim
        // pending -> paid atomically before sending any customer/admin side
        // effects, so a retry or concurrent delivery cannot notify twice.
        const { data: existingDeposit, error: findError } = await supabase
          .from("customer_quotes")
          .select("*")
          .eq("lead_source", "deposit")
          .contains("quote_data", { stripe_session_id: session.id })
          .maybeSingle();

        if (findError || !existingDeposit) {
          throw new Error(`Bound deposit record lookup failed: ${findError?.message || "not found"}`);
        }

        const boundQuoteData = existingDeposit.quote_data || {};
        const boundSavedQuoteId = boundQuoteData.saved_quote_id || "";
        let boundSavedQuote = null;
        if (boundSavedQuoteId) {
          const { data, error } = await supabase
            .from("saved_quotes")
            .select("id, email, deposit_status, deposit_amount, quote_pdf_path")
            .eq("id", boundSavedQuoteId)
            .maybeSingle();
          if (error) {
            throw new Error(`Bound saved quote lookup failed: ${error.message}`);
          }
          boundSavedQuote = data;
        }

        // Reconcile every Stripe-controlled value and saved-quote identity
        // before pending -> paid. A mismatch therefore leaves the deposit
        // pending and cannot trigger customer or admin notifications.
        const depositPreclaimInput = {
          sessionCurrency: session.currency,
          sessionAmountTotal: session.amount_total,
          metadataDepositAmount,
          metadataSavedQuoteId,
          metadataQuotePdfPath,
          stripeReceiptEmail,
          boundDeposit: existingDeposit,
          boundSavedQuote,
        };
        const reconciledDeposit = validateDepositBeforeClaim(depositPreclaimInput);
        const depositAmount = String(reconciledDeposit.depositAmount);
        const savedQuoteId = reconciledDeposit.savedQuoteId;
        const customerEmail = reconciledDeposit.quoteAuthorizationEmail;
        motorInfo = boundQuoteData.motor_info || motorInfo;

        if (boundQuoteData.payment_status === "paid" && notificationsComplete(boundQuoteData)) {
          logStep("Deposit session already processed", { sessionId: session.id });
          return new Response(JSON.stringify({ received: true, processed: true, duplicate: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        if (boundQuoteData.payment_status === "paid" && notificationLeaseIsActive(boundQuoteData)) {
          throw new Error("Deposit notification delivery is already in progress");
        }

        const paidQuoteData = {
          ...boundQuoteData,
          deposit_amount: depositAmount,
          payment_type: "motor_deposit",
          stripe_session_id: session.id,
          stripe_payment_intent: paymentIntentId,
          payment_status: "paid",
          motor_info: motorInfo,
          quote_pdf_path: boundQuoteData.quote_pdf_path || null,
          ...(reconciledDeposit.stripeReceiptEmail
            ? { stripe_receipt_email: reconciledDeposit.stripeReceiptEmail }
            : {}),
          notification_status: "processing",
          notification_event_id: event.id,
          notification_lease_expires_at: notificationLeaseExpiresAt(),
        };
        const { data: claimedDeposit, error: updateError } = await claimDepositAfterValidation(
          depositPreclaimInput,
          async () => {
            let claimQuery = supabase
              .from("customer_quotes")
              .update({ lead_status: "scheduled", quote_data: paidQuoteData })
              .eq("id", existingDeposit.id);
            claimQuery = boundQuoteData.payment_status === "paid"
              ? claimQuery.contains("quote_data", {
                  payment_status: "paid",
                  notification_status: "processing",
                  notification_lease_expires_at: boundQuoteData.notification_lease_expires_at,
                })
              : claimQuery.contains("quote_data", { payment_status: "pending" });
            return await claimQuery
              .select("*")
              .maybeSingle();
          },
        );

        if (updateError) {
          throw new Error(`Failed to reconcile paid deposit: ${updateError.message}`);
        }
        if (!claimedDeposit) {
          const { data: concurrentDeposit, error: concurrentError } = await supabase
            .from("customer_quotes")
            .select("id, quote_data")
            .eq("id", existingDeposit.id)
            .maybeSingle();
          if (!concurrentError && concurrentDeposit?.quote_data && notificationsComplete(concurrentDeposit.quote_data)) {
            logStep("Deposit session completed by another delivery", { sessionId: session.id });
            return new Response(JSON.stringify({ received: true, processed: true, duplicate: true }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
          throw new Error("Deposit notification lease could not be atomically claimed");
        }
        logStep("Deposit record updated to scheduled", { quoteId: claimedDeposit.id });

        // Update saved_quotes record with deposit confirmation
        if (savedQuoteId && boundSavedQuote) {
          if (boundSavedQuote.deposit_status === "paid") {
            logStep("saved_quotes deposit was already paid", { savedQuoteId });
          } else if (boundSavedQuote.deposit_status === "pending") {
            const { data: savedQuoteUpdate, error: sqUpdateError } = await supabase
              .from("saved_quotes")
              .update({
                deposit_status: "paid",
                deposit_amount: parseFloat(depositAmount),
                deposit_paid_at: new Date().toISOString(),
              })
              .eq("id", savedQuoteId)
              .eq("email", boundSavedQuote.email)
              .eq("deposit_amount", reconciledDeposit.depositAmount)
              .eq("deposit_status", "pending")
              .select("id")
              .maybeSingle();
            if (sqUpdateError || !savedQuoteUpdate) {
              throw new Error(`Failed to reconcile saved quote deposit: ${sqUpdateError?.message || "claim failed"}`);
            }
            logStep("saved_quotes deposit status updated to paid", { savedQuoteId });
          } else {
            throw new Error("Saved quote deposit has an invalid state");
          }
        }

        // Send confirmation emails
        const motorLabel = motorInfo?.model || motorInfo?.name || motorInfo?.displayName || "Mercury motor";
        let emailFailed = false;
        try {
          const { error: emailError } = await supabase.functions.invoke("send-deposit-confirmation-email", {
            body: { stripeSessionId: session.id },
          });

          if (emailError) {
            emailFailed = true;
            logStep("ERROR: Failed to send confirmation email", { error: emailError.message });
          } else {
            logStep("Confirmation email sent successfully");
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

        const { data: notificationUpdate, error: notificationUpdateError } = await supabase
          .from("customer_quotes")
          .update({
            quote_data: {
              ...paidQuoteData,
              notification_status: emailFailed ? "manual_follow_up" : "delivered",
              notification_completed_at: new Date().toISOString(),
              notification_lease_expires_at: null,
            },
          })
          .eq("id", claimedDeposit.id)
          .contains("quote_data", {
            notification_status: "processing",
            notification_event_id: event.id,
          })
          .select("id")
          .maybeSingle();
        if (notificationUpdateError || !notificationUpdate) {
          throw new Error(`Could not record notification outcome: ${notificationUpdateError?.message || "claim lost"}`);
        }
      } else if (session.metadata?.payment_type === "quote") {
        // Quote-path payment: mark quote paid and notify admins
        const customerEmail = session.customer_email || session.metadata.customer_email || "";
        const amountTotal = ((session.amount_total || 0) / 100).toFixed(2);

        // Claim the authoritative quote row before notifications. This mirrors
        // the deposit path and makes paid-session retries idempotent.
        const { data: quoteRow, error: quoteFindError } = await supabase
          .from("quotes")
          .select("id, customer_name, customer_phone, motor_model, quote_data")
          .contains("quote_data", { stripe_session_id: session.id })
          .maybeSingle();

        if (quoteFindError || !quoteRow) {
          throw new Error(`Bound quote record lookup failed: ${quoteFindError?.message || "not found"}`);
        }

        const existingQuoteData = quoteRow.quote_data || {};
        if (existingQuoteData.payment_status === "paid" && notificationsComplete(existingQuoteData)) {
          logStep("Quote session already processed", { sessionId: session.id });
          return new Response(JSON.stringify({ received: true, processed: true, duplicate: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        if (existingQuoteData.payment_status === "paid" && notificationLeaseIsActive(existingQuoteData)) {
          throw new Error("Quote notification delivery is already in progress");
        }

        const paidQuoteData = {
          ...existingQuoteData,
          payment_status: "paid",
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
          notification_status: "processing",
          notification_event_id: event.id,
          notification_lease_expires_at: notificationLeaseExpiresAt(),
        };
        let quoteClaimQuery = supabase
          .from("quotes")
          .update({ quote_data: paidQuoteData })
          .eq("id", quoteRow.id);
        quoteClaimQuery = existingQuoteData.payment_status === "paid"
          ? quoteClaimQuery.contains("quote_data", {
              payment_status: "paid",
              notification_status: "processing",
              notification_lease_expires_at: existingQuoteData.notification_lease_expires_at,
            })
          : quoteClaimQuery.contains("quote_data", { payment_status: "pending" });
        const { data: claimedQuote, error: quoteUpdateError } = await quoteClaimQuery
          .select("id")
          .maybeSingle();
        if (quoteUpdateError) {
          throw new Error(`Failed to reconcile paid quote: ${quoteUpdateError.message}`);
        }
        if (!claimedQuote) {
          const { data: concurrentQuote, error: concurrentQuoteError } = await supabase
            .from("quotes")
            .select("quote_data")
            .eq("id", quoteRow.id)
            .maybeSingle();
          if (!concurrentQuoteError && concurrentQuote?.quote_data && notificationsComplete(concurrentQuote.quote_data)) {
            logStep("Quote session completed by another delivery", { sessionId: session.id });
            return new Response(JSON.stringify({ received: true, processed: true, duplicate: true }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
          throw new Error("Quote notification lease could not be atomically claimed");
        }

        const customerName = quoteRow.customer_name || "Customer";
        const motorLabel = quoteRow.motor_model || "Mercury motor";
        logStep("Quote marked paid", { quoteId: quoteRow.id, customerEmail, amountTotal });

        // Admin SMS
        let quoteSmsFailed = false;
        try {
          const { error: quoteSmsError } = await supabase.functions.invoke("send-sms", {
            body: {
              to: "admin",
              message: `Quote payment received: ${customerName}, ${motorLabel}, $${amountTotal}`,
              messageType: "hot_lead",
            },
          });
          if (quoteSmsError) throw quoteSmsError;
        } catch (e: any) {
          quoteSmsFailed = true;
          logStep("WARNING: Admin quote-payment SMS failed", { error: e?.message });
        }

        // Admin email notification (reuse deposit confirmation function in adminOnly mode)
        let quoteEmailFailed = false;
        try {
          const { error: quoteEmailError } = await supabase.functions.invoke("send-deposit-confirmation-email", {
            body: {
              customerEmail: "",
              customerName,
              customerPhone: quoteRow.customer_phone || "",
              depositAmount: amountTotal,
              paymentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
              motorInfo: { model: motorLabel, paymentType: "quote", customerEmail },
              sendAdminNotification: true,
              adminOnly: true,
            },
          });
          if (quoteEmailError) throw quoteEmailError;
        } catch (e: any) {
          quoteEmailFailed = true;
          logStep("WARNING: Admin quote-payment email failed", { error: e?.message });
        }

        const { data: quoteNotificationUpdate, error: quoteNotificationUpdateError } = await supabase
          .from("quotes")
          .update({
            quote_data: {
              ...paidQuoteData,
              notification_status: quoteSmsFailed && quoteEmailFailed ? "manual_follow_up" : "delivered",
              notification_completed_at: new Date().toISOString(),
              notification_lease_expires_at: null,
            },
          })
          .eq("id", quoteRow.id)
          .contains("quote_data", {
            notification_status: "processing",
            notification_event_id: event.id,
          })
          .select("id")
          .maybeSingle();
        if (quoteNotificationUpdateError || !quoteNotificationUpdate) {
          throw new Error(`Could not record quote notification outcome: ${quoteNotificationUpdateError?.message || "claim lost"}`);
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
