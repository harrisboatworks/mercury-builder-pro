import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import {
  assertStripeDepositChargeMatches,
  boundSavedQuoteIdFromDeposit,
  classifyNotificationOutcomeWrite,
  depositNotificationOutcomeGuard,
  depositReplayOwnershipClaimFilter,
  lookupDepositBySession,
  resolveDepositWebhookSmsGate,
  shouldClaimDepositReplayOwnership,
  shouldSendFirstClaimSms,
  stripeBillingAddressFromCheckout,
} from "../_shared/deposit-deal-record.ts";
import {
  DEPOSIT_OUTBOX_SCHEMA_KEY,
  DEPOSIT_OUTBOX_SCHEMA_VERSION,
  deliveriesIndicateFailure,
  hasDepositOutboxSchema,
  legacyNotificationStatusFromAudienceResults,
  planDepositWebhookMailer,
  seedDepositEmailDeliveryRows,
  stripeWebhookStatusAfterHandler,
} from "../_shared/deposit-email-deliveries.ts";
import { shouldSuppressDepositStagingSms } from "../_shared/deposit-staging-guard.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function stagingRuntimeEnv() {
  return {
    DEPOSIT_STAGING_MODE: Deno.env.get("DEPOSIT_STAGING_MODE"),
    SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
  };
}

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

  let paymentReconciled = false;
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
        eventId: event.id,
        paymentType: session.metadata?.payment_type,
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
        const depositAmount = session.metadata.deposit_amount;
        const paymentIntentId = typeof session.payment_intent === "string" 
          ? session.payment_intent 
          : session.payment_intent?.id;
        const savedQuoteId = session.metadata.saved_quote_id || "";
        const billingAddress = stripeBillingAddressFromCheckout(session.customer_details);

        logStep("Processing deposit confirmation", {
          sessionId: session.id,
          eventId: event.id,
          paymentIntentId,
          savedQuoteId,
        });

        const { data: promotedDeposit, error: findError } = await supabase
          .from("customer_quotes")
          .select("*")
          .eq("lead_source", "deposit")
          .eq("stripe_checkout_session_id", session.id)
          .maybeSingle();

        let existingDeposit = !findError && promotedDeposit
          ? lookupDepositBySession([promotedDeposit], session.id)
          : null;

        if (!existingDeposit) {
          const { data: legacyDeposit, error: legacyError } = await supabase
            .from("customer_quotes")
            .select("*")
            .eq("lead_source", "deposit")
            .contains("quote_data", { stripe_session_id: session.id })
            .maybeSingle();
          if (legacyError || !legacyDeposit) {
            throw new Error(`Bound deposit record lookup failed: ${legacyError?.message || "not found"}`);
          }
          existingDeposit = legacyDeposit;
        }

        const boundQuoteData = existingDeposit.quote_data || {};
        const boundSavedQuoteId = boundSavedQuoteIdFromDeposit(existingDeposit);
        if (
          Number(existingDeposit.deposit_amount) !== Number(depositAmount)
          || boundSavedQuoteId !== savedQuoteId
        ) {
          throw new Error("Stripe deposit metadata does not match the bound record");
        }
        const motorInfo = boundQuoteData.motor_info || null;
        const customerName = existingDeposit.customer_name || "Customer";
        const customerEmail = existingDeposit.customer_email || "";
        const customerPhone = existingDeposit.customer_phone || "";
        const alreadyPaid = existingDeposit.payment_status === "paid"
          || boundQuoteData.payment_status === "paid";

        const paidAt = new Date().toISOString();
        const paidQuoteData = {
          ...boundQuoteData,
          deposit_amount: depositAmount,
          payment_type: "motor_deposit",
          stripe_session_id: session.id,
          stripe_payment_intent: paymentIntentId,
          payment_status: "paid",
          motor_info: motorInfo,
          ...(billingAddress ? { payment_billing_address: billingAddress } : {}),
          notification_status: "processing",
          notification_event_id: event.id,
          notification_lease_expires_at: alreadyPaid ? boundQuoteData.notification_lease_expires_at : notificationLeaseExpiresAt(),
          ...(alreadyPaid ? {} : { [DEPOSIT_OUTBOX_SCHEMA_KEY]: DEPOSIT_OUTBOX_SCHEMA_VERSION }),
        };

        let claimedDeposit = existingDeposit;
        let claimWon = alreadyPaid;
        let concurrentPaidDeposit: { payment_status?: string | null; quote_data?: Record<string, unknown> | null } | null = null;
        if (!alreadyPaid) {
          assertStripeDepositChargeMatches({
            amountTotal: session.amount_total,
            currency: session.currency,
            depositAmount,
          });
          const claimQuery = supabase
            .from("customer_quotes")
            .update({
              lead_status: "scheduled",
              payment_status: "paid",
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: paymentIntentId || existingDeposit.stripe_payment_intent_id,
              payment_paid_at: paidAt,
              saved_quote_id: boundSavedQuoteId || existingDeposit.saved_quote_id,
              ...(billingAddress ? { stripe_billing_address: billingAddress } : {}),
              quote_data: paidQuoteData,
            })
            .eq("id", existingDeposit.id)
            .contains("quote_data", { payment_status: "pending" });
          const { data: claimed, error: updateError } = await claimQuery
            .select("*")
            .maybeSingle();

          if (updateError) {
            throw new Error(`Failed to reconcile paid deposit: ${updateError.message}`);
          }
          if (!claimed) {
            const { data: concurrentDeposit, error: concurrentError } = await supabase
              .from("customer_quotes")
              .select("id, quote_data, payment_status")
              .eq("id", existingDeposit.id)
              .maybeSingle();
            if (
              !concurrentError
              && (
                concurrentDeposit?.payment_status === "paid"
                || (concurrentDeposit?.quote_data && notificationsComplete(concurrentDeposit.quote_data))
              )
            ) {
              logStep("Deposit session completed by another delivery", { sessionId: session.id });
              claimedDeposit = { ...existingDeposit, ...concurrentDeposit };
              concurrentPaidDeposit = concurrentDeposit;
            } else {
              throw new Error("Deposit notification lease could not be atomically claimed");
            }
          } else {
            claimedDeposit = claimed;
            claimWon = true;
          }
          logStep("Deposit record updated to scheduled", { quoteId: claimedDeposit.id, savedQuoteId: boundSavedQuoteId });
        } else {
          logStep("Deposit session already paid; retrying missing email only", {
            sessionId: session.id,
            quoteId: existingDeposit.id,
          });
          if (shouldClaimDepositReplayOwnership({
            alreadyPaid,
            hasOutboxSchema: hasDepositOutboxSchema(boundQuoteData),
          })) {
            const { data: replayClaimed, error: replayClaimError } = await supabase
              .from("customer_quotes")
              .update({ quote_data: paidQuoteData })
              .eq("id", existingDeposit.id)
              .contains("quote_data", depositReplayOwnershipClaimFilter())
              .select("*")
              .maybeSingle();
            const replayClaimOutcome = classifyNotificationOutcomeWrite({
              written: replayClaimed,
              writeError: replayClaimError,
            });
            if (replayClaimOutcome === "written") {
              claimedDeposit = replayClaimed;
              claimWon = true;
            } else {
              claimWon = false;
              logStep("WARNING: replay ownership claim did not persist; leaving existing notification state", {
                sessionId: session.id,
                quoteId: existingDeposit.id,
              });
            }
          }
        }

        // Update saved_quotes record with deposit confirmation
        if (savedQuoteId && savedQuoteId === boundSavedQuoteId && customerEmail) {
          const { data: boundSavedQuote, error: boundSavedQuoteError } = await supabase
            .from("saved_quotes")
            .select("id, email, deposit_status")
            .eq("id", savedQuoteId)
            .maybeSingle();
          if (
            boundSavedQuoteError
            || !boundSavedQuote
            || boundSavedQuote.email?.trim().toLowerCase() !== customerEmail.trim().toLowerCase()
          ) {
            throw new Error("Bound saved quote could not be verified");
          }

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
        } else if (savedQuoteId) {
          logStep("WARNING: Ignoring unbound saved quote metadata", {
            savedQuoteId,
            boundSavedQuoteId,
          });
        }

        paymentReconciled = true;

        try {
        const { data: existingDeliveries, error: existingDeliveriesError } = await supabase
          .from("deposit_email_deliveries")
          .select("audience, status")
          .eq("customer_quote_id", claimedDeposit.id);
        const mailerPlan = planDepositWebhookMailer({
          alreadyPaid,
          deliveryRows: existingDeliveries,
          deliveryReadError: Boolean(existingDeliveriesError),
          hasOutboxSchema: hasDepositOutboxSchema(claimedDeposit.quote_data),
          legacyLeaseActive: notificationLeaseIsActive(boundQuoteData),
        });
        if (existingDeliveriesError) {
          logStep("WARNING: Could not read deposit email deliveries; skipping automatic mailer", {
            sessionId: session.id,
            quoteId: claimedDeposit.id,
          });
        }

        if (mailerPlan.seed) {
          const deliverySeeds = seedDepositEmailDeliveryRows({
            customerQuoteId: claimedDeposit.id,
            savedQuoteId: boundSavedQuoteId,
          });
          const { error: seedError } = await supabase
            .from("deposit_email_deliveries")
            .upsert(deliverySeeds, { onConflict: "customer_quote_id,audience", ignoreDuplicates: true });
          if (seedError) {
            logStep("WARNING: Could not seed deposit email deliveries", { code: seedError.code });
          }
        } else if (alreadyPaid && !mailerPlan.invoke) {
          logStep("Historical paid deposit has no email outbox; skipping automatic seed and mailer", {
            sessionId: session.id,
            quoteId: existingDeposit.id,
          });
        }

        const motorLabel = motorInfo?.model || motorInfo?.name || motorInfo?.displayName || "Mercury motor";
        let emailFailed = false;
        let mailerDeliveries: Record<string, string> | null = null;
        if (mailerPlan.invoke) {
          try {
            const { data: emailData, error: emailError } = await supabase.functions.invoke("send-deposit-confirmation-email", {
              body: { stripeSessionId: session.id },
            });
            mailerDeliveries = emailData?.deliveries ?? null;

            if (
              emailError
              || emailData?.success === false
              || deliveriesIndicateFailure(emailData?.deliveries)
            ) {
              emailFailed = true;
              logStep("ERROR: Failed to send confirmation email", { sessionId: session.id });
            } else {
              logStep("Confirmation email pipeline invoked", { sessionId: session.id });
            }
          } catch {
            emailFailed = true;
            logStep("ERROR: Deposit confirmation email threw", { sessionId: session.id });
          }
        }

        const smsGate = resolveDepositWebhookSmsGate({
          alreadyPaid,
          boundQuoteData,
          claimWon,
          concurrent: concurrentPaidDeposit,
        });
        const sendSms = shouldSendFirstClaimSms(smsGate)
          && !shouldSuppressDepositStagingSms(stagingRuntimeEnv());

        if (sendSms && emailFailed) {
          try {
            await supabase.functions.invoke("send-sms", {
              body: {
                to: "admin",
                message: `Deposit email FAILED for session ${session.id} - follow up from admin`,
                messageType: "hot_lead",
              },
            });
          } catch (e: any) {
            logStep("WARNING: Admin email-failure SMS failed", { sessionId: session.id });
          }
        }

        if (sendSms && customerPhone) {
          try {
            await supabase.functions.invoke("send-sms", {
              body: {
                to: customerPhone,
                message: `Harris Boat Works: deposit received for your ${motorLabel}. We'll call you to confirm details and pickup. Questions? (905) 342-2153`,
                messageType: "quote_confirmation",
                customerName,
              },
            });
            logStep("Customer SMS confirmation sent", { sessionId: session.id });
          } catch (e: any) {
            logStep("WARNING: Customer SMS failed", { sessionId: session.id });
          }
        }

        if (sendSms) {
          try {
            await supabase.functions.invoke("send-sms", {
              body: {
                to: "admin",
                message: `Deposit paid: ${customerName}, ${motorLabel}, $${depositAmount}`,
                messageType: "hot_lead",
              },
            });
          } catch (e: any) {
            logStep("WARNING: Admin deposit SMS failed", { sessionId: session.id });
          }
        }

        const notificationStatus = mailerPlan.invoke
          ? legacyNotificationStatusFromAudienceResults(mailerDeliveries, {
            invoked: true,
            invokeFailed: emailFailed,
          })
          : (typeof boundQuoteData.notification_status === "string"
            ? boundQuoteData.notification_status
            : "not_sent");
        const mayWriteLegacyNotification = !alreadyPaid
          || shouldClaimDepositReplayOwnership({
            alreadyPaid,
            hasOutboxSchema: hasDepositOutboxSchema(boundQuoteData),
          });
        if (mayWriteLegacyNotification) {
          // Mailer already ran and its RPC patches notification_status off
          // processing. This event-scoped contains-guard then loses ownership
          // instead of overwriting the RPC.
          const { data: notificationWrite, error: notificationWriteError } = await supabase
            .from("customer_quotes")
            .update({
              quote_data: {
                ...paidQuoteData,
                notification_status: notificationStatus,
                notification_completed_at: new Date().toISOString(),
                notification_lease_expires_at: null,
                sms_notification_status: sendSms ? "sent" : (smsGate.smsStatus || "skipped"),
              },
            })
            .eq("id", claimedDeposit.id)
            .contains("quote_data", depositNotificationOutcomeGuard(event.id))
            .select("id")
            .maybeSingle();
          const notificationWriteOutcome = classifyNotificationOutcomeWrite({
            written: notificationWrite,
            writeError: notificationWriteError,
          });
          if (notificationWriteOutcome === "lost_ownership") {
            logStep("WARNING: notification outcome ownership lost; leaving existing state", {
              sessionId: session.id,
              quoteId: claimedDeposit.id,
            });
          } else if (notificationWriteOutcome !== "written") {
            logStep("WARNING: notification status write failed", {
              sessionId: session.id,
              quoteId: claimedDeposit.id,
            });
          }
        }
        } catch (notificationError: unknown) {
          logStep("WARNING: notification pipeline failed after payment reconciliation", {
            sessionId: session.id,
            error: notificationError instanceof Error ? notificationError.name : "notification_error",
          });
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

        // Admin SMS. Staging mode is a hard kill switch for every SMS path.
        let quoteSmsFailed = false;
        if (shouldSuppressDepositStagingSms(stagingRuntimeEnv())) {
          logStep("Quote-payment SMS skipped; deposit staging mode is enabled", {
            sessionId: session.id,
          });
        } else {
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
    const status = stripeWebhookStatusAfterHandler({
      paymentReconciled,
      failed: true,
    });
    logStep(status === 200
      ? "WARNING: Webhook failed after payment reconciliation"
      : "ERROR: Webhook handler failed", { error: error.message });
    return new Response(JSON.stringify(status === 200
      ? { received: true, notificationFailed: true }
      : { error: error.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
