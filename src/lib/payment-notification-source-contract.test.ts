import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("payment notification delivery contract", () => {
  it("uses stable provider keys and deterministic email content", () => {
    const mailer = read(
      "supabase/functions/send-deposit-confirmation-email/index.ts",
    );

    expect(mailer).toContain('"Idempotency-Key": idempotencyKey');
    expect(mailer).toContain("signal: AbortSignal.timeout(15_000)");
    expect(mailer).toMatch(/paymentEmailIdempotencyKey\(\s*"deposit-customer"/);
    expect(mailer).toMatch(/paymentEmailIdempotencyKey\(\s*"deposit-admin"/);
    expect(mailer).toMatch(/paymentEmailIdempotencyKey\(\s*"quote-admin"/);
    expect(mailer).toContain("requirePaymentNotificationAttemptedAt(");
    expect(mailer).toContain(
      "paymentEmailRetryWindowExpired(notificationTimestamp)",
    );
    expect(mailer).toContain(
      "new Date(notificationTimestamp).toLocaleDateString",
    );
    expect(mailer).toContain("new Date(notificationTimestamp).toLocaleString");
    expect(mailer).toMatch(
      /generateReferenceNumber\(\s*paymentId,\s*notificationSessionId/,
    );
    expect(mailer).toContain(
      'bcc: ["info@harrisboatworks.ca", GROK_BOT_AGENTMAIL]',
    );
    expect(mailer).toContain("bcc: [GROK_BOT_AGENTMAIL]");
    expect(mailer).not.toContain("Date.now()");
    expect(mailer).not.toContain("resend.emails.send");
    expect(mailer).not.toContain("deposit_mode");
    expect(mailer).not.toContain("general_deposit");
  });

  it("records the email outcome before any secondary SMS", () => {
    const webhook = read("supabase/functions/stripe-webhook/index.ts");
    const depositEmail = webhook.indexOf(
      "stripeSessionId: session.id",
    );
    const depositOutcome = webhook.indexOf("const { data: notificationUpdate");
    const depositSms = webhook.indexOf("message: `Deposit email FAILED");
    const quoteEmail = webhook.indexOf("quotePaymentSessionId: session.id");
    const quoteOutcome = webhook.indexOf("quoteNotificationUpdate,");
    const quoteSms = webhook.indexOf("Quote payment received:");
    const depositTerminalCheck = webhook.indexOf(
      "notificationsComplete(boundQuoteData)",
    );
    const depositClaim = webhook.indexOf(
      '.rpc("claim_bound_motor_deposit_paid"',
    );
    const quoteTerminalCheck = webhook.indexOf(
      "notificationsComplete(existingQuoteData)",
    );
    const quoteClaim = webhook.indexOf("let quoteClaimQuery = supabase");

    expect(depositEmail).toBeGreaterThan(-1);
    expect(depositOutcome).toBeGreaterThan(depositEmail);
    expect(depositSms).toBeGreaterThan(depositOutcome);
    expect(quoteEmail).toBeGreaterThan(depositSms);
    expect(quoteOutcome).toBeGreaterThan(quoteEmail);
    expect(quoteSms).toBeGreaterThan(quoteOutcome);
    expect(depositTerminalCheck).toBeLessThan(depositClaim);
    expect(quoteTerminalCheck).toBeLessThan(quoteClaim);
    expect(webhook).toContain('notification_sms_status: "attempting"');
    expect(webhook).toMatch(
      /notification_email_status: emailFailed[\s\S]*?notification_lease_expires_at: notificationLeaseExpiresAt\(\)[\s\S]*?notification_sms_status: "attempting"/,
    );
    expect(webhook).toMatch(
      /notification_email_status: quoteEmailFailed[\s\S]*?notification_lease_expires_at: notificationLeaseExpiresAt\(\)[\s\S]*?notification_sms_status: "attempting"/,
    );
    expect(webhook).toMatch(
      /notification_status: paymentNotificationStatusAfterSms\([\s\S]*?notification_lease_expires_at: null[\s\S]*?notification_sms_status:/,
    );
    expect(webhook).toContain(
      'notification_email_status: emailFailed ? "failed" : "delivered"',
    );
    expect(webhook).toContain(
      'notification_email_status: quoteEmailFailed ? "failed" : "delivered"',
    );
    expect(webhook).toContain("paymentNotificationStatusAfterSms(");
    expect(webhook).toMatch(
      /notification_sms_status:\s*smsFailed\s*\?\s*"partial_failure"\s*:\s*"delivered"/,
    );
    expect(webhook).toMatch(
      /notification_sms_status:\s*quoteSmsFailed\s*\?\s*"partial_failure"\s*:\s*"delivered"/,
    );
    expect(webhook).toContain("Deposit SMS delivery is already in progress");
    expect(webhook).toContain("Quote SMS delivery is already in progress");
    expect(
      webhook.match(
        /notification_lease_expires_at: paidQuoteData\.notification_lease_expires_at/g,
      ),
    ).toHaveLength(4);
    expect(webhook).toContain(
      "notification_lease_expires_at: depositEmailOutcome.notification_lease_expires_at",
    );
    expect(webhook).toContain(
      "notification_sms_attempted_at: depositEmailOutcome.notification_sms_attempted_at",
    );
    expect(webhook).toContain(
      "notification_lease_expires_at: quoteEmailOutcome.notification_lease_expires_at",
    );
    expect(webhook).toContain(
      "notification_sms_attempted_at: quoteEmailOutcome.notification_sms_attempted_at",
    );
  });

  it("uses immutable quote inputs and the atomically claimed attempt time", () => {
    const webhook = read("supabase/functions/stripe-webhook/index.ts");
    const quoteStart = webhook.indexOf('payment_type === "quote"');
    const quoteSource = webhook.slice(quoteStart);

    expect(quoteSource).toContain("quotePaymentNotificationSnapshot(");
    expect(quoteSource).toContain("session.metadata.quote_data");
    expect(quoteSource).toMatch(
      /paymentNotificationFirstAttemptAt\(\s*existingQuoteData\.payment_status,\s*existingQuoteData\.notification_email_attempted_at/,
    );
    expect(quoteSource).toContain("customerName = quoteNotification.customerName");
    expect(quoteSource).toContain("motorLabel = quoteNotification.motorLabel");
    expect(quoteSource).toContain("customerPhone: quoteNotification.customerPhone");
    expect(quoteSource).toContain("notificationTimestamp: quoteNotificationTimestamp");
    expect(quoteSource).not.toContain("quoteRow.customer_name");
    expect(quoteSource).not.toContain("quoteRow.customer_phone");
    expect(quoteSource).not.toContain("quoteRow.motor_model");
  });

  it("uses immutable deposit inputs and the atomically claimed attempt time", () => {
    const webhook = read("supabase/functions/stripe-webhook/index.ts");
    const mailer = read(
      "supabase/functions/send-deposit-confirmation-email/index.ts",
    );
    const depositStart = webhook.indexOf('payment_type === "motor_deposit"');
    const quoteStart = webhook.indexOf('payment_type === "quote"', depositStart);
    const depositSource = webhook.slice(depositStart, quoteStart);
    const paidRecordStart = mailer.indexOf("if (requestBody.stripeSessionId)");
    const legacyStart = mailer.indexOf("} else {", paidRecordStart);
    const paidRecordSource = mailer.slice(paidRecordStart, legacyStart);

    expect(depositSource).toContain("depositPaymentNotificationSnapshot(");
    expect(depositSource).toContain("session.metadata,");
    expect(depositSource).toMatch(
      /paymentNotificationFirstAttemptAt\(\s*boundQuoteData\.payment_status,\s*boundQuoteData\.notification_email_attempted_at/,
    );
    expect(depositSource).toContain("customerEmail = depositNotification.customerEmail");
    expect(depositSource).toContain("customerName = depositNotification.customerName");
    expect(depositSource).toContain("customerPhone = depositNotification.customerPhone");
    expect(depositSource).toContain("notificationTimestamp: depositNotificationTimestamp");
    expect(paidRecordSource).toContain('.select("id, quote_data")');
    expect(paidRecordSource).not.toContain("customer_name");
    expect(paidRecordSource).not.toContain("customer_email");
    expect(paidRecordSource).not.toContain("customer_phone");
    expect(paidRecordSource).not.toContain("deposit_amount");
  });

  it("fails over to manual follow-up before provider idempotency expires", () => {
    const webhook = read("supabase/functions/stripe-webhook/index.ts");
    const depositStart = webhook.indexOf('payment_type === "motor_deposit"');
    const quoteStart = webhook.indexOf('payment_type === "quote"', depositStart);
    const depositSource = webhook.slice(depositStart, quoteStart);
    const quoteSource = webhook.slice(quoteStart);

    expect(webhook).toMatch(
      /notification_email_attempted_at:\s*(deposit|quote)NotificationTimestamp/g,
    );
    expect(webhook).toContain("paymentNotificationFirstAttemptAt(");
    expect(webhook).toContain("paymentNotificationAttemptedAtIsValid(");
    expect(webhook).not.toContain("paymentNotificationSessionTimestamp(");
    expect(webhook).toContain("paymentEmailRetryWindowExpired(");
    expect(webhook).toContain("Provider idempotency retry window expired");
    expect(webhook).toContain("SMS outcome unknown after interrupted delivery");
    expect(webhook).toContain("notificationSmsOutcomeAmbiguous(");
    expect(webhook).toContain("manualFollowUp: true");
    expect(webhook).toContain('notification_status: "manual_follow_up"');
    expect(depositSource).toMatch(
      /paymentNotificationFirstAttemptAt\([\s\S]*?notification_email_attempted_at: depositNotificationTimestamp[\s\S]*?\.rpc\("claim_bound_motor_deposit_paid"/,
    );
    expect(quoteSource).toMatch(
      /paymentNotificationFirstAttemptAt\([\s\S]*?notification_email_attempted_at: quoteNotificationTimestamp[\s\S]*?let quoteClaimQuery = supabase/,
    );
    expect(depositSource).toMatch(
      /notificationLeaseIsActive\(boundQuoteData\)[\s\S]*?paymentNotificationAttemptedAtIsValid\([\s\S]*?notification_status: "manual_follow_up"[\s\S]*?notification_status: "processing"[\s\S]*?notification_event_id: boundQuoteData\.notification_event_id[\s\S]*?notification_lease_expires_at: boundQuoteData\.notification_lease_expires_at[\s\S]*?manualFollowUp: true[\s\S]*?paymentNotificationFirstAttemptAt\(/,
    );
    expect(quoteSource).toMatch(
      /notificationLeaseIsActive\(existingQuoteData\)[\s\S]*?paymentNotificationAttemptedAtIsValid\([\s\S]*?notification_status: "manual_follow_up"[\s\S]*?notification_status: "processing"[\s\S]*?notification_event_id: existingQuoteData\.notification_event_id[\s\S]*?notification_lease_expires_at: existingQuoteData\.notification_lease_expires_at[\s\S]*?manualFollowUp: true[\s\S]*?paymentNotificationFirstAttemptAt\(/,
    );
    expect(webhook).toContain(
      "Trusted notification attempt timestamp unavailable; automatic retry disabled",
    );
  });
});
