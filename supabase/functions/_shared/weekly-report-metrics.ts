export const WEEKLY_REPORT_TO = ["info@harrisboatworks.ca"] as const;
export const WEEKLY_REPORT_CC = ["hbwbot00@gmail.com"] as const;
export const WEEKLY_REPORT_GROK_TO = ["hbwbot@agentmail.to"] as const;

export const WEEKLY_REPORT_SANITIZED_NOTICE =
  "This is a sanitized operations summary with no customer personal information.";

export const WEEKLY_REPORT_AI_SAFETY_INSTRUCTION =
  "When paidReservations > 0, never claim nobody bought, nobody pulled the trigger, or no sales. Describe these as paid reservations/deposits, not completed sales.";

export type CustomerQuoteLike = {
  final_price?: unknown;
  deposit_amount?: unknown;
  lead_source?: unknown;
  lead_status?: unknown;
  payment_status?: unknown;
  payment_type?: unknown;
  payment_paid_at?: unknown;
  deposit_status?: unknown;
  motor?: unknown;
  motor_info?: unknown;
  motor_model?: unknown;
  motorModel?: unknown;
  motor_price?: unknown;
  reserved_motor_value?: unknown;
  model?: unknown;
  quote_snapshot?: unknown;
  quote_data?: unknown;
  [key: string]: unknown;
};

export type PaidReservationMetrics = {
  paidReservations: number;
  depositsCollected: number;
  reservedMotorValue: number;
};

export type WeeklyReportSubjectInput = {
  visitors: number;
  totalQuotes: number;
  quotedValueLabel: string;
  paidReservations: number;
  depositsCollectedLabel: string;
  dateRange: string;
};

export type WeeklyReportNamedCount = {
  name: string;
  count: number;
};

export type SanitizedWeeklyReportWeekOverWeek = {
  previousQuotes: number;
  currentQuotes: number;
  quoteDiff: number;
  previousQuotedValueLabel: string;
  currentQuotedValueLabel: string;
  quotedValueDiffLabel: string;
  previousPaidReservations: number;
  currentPaidReservations: number;
  paidReservationDiff: number;
  previousDepositsCollectedLabel: string;
  currentDepositsCollectedLabel: string;
  depositsCollectedDiffLabel: string;
  previousReservedMotorValueLabel: string;
  currentReservedMotorValueLabel: string;
  reservedMotorValueDiffLabel: string;
};

export type SanitizedWeeklyReportInput = {
  periodLabel: string;
  visitors: number;
  totalQuotes: number;
  quotedValueLabel: string;
  paidReservations: number;
  depositsCollectedLabel: string;
  reservedMotorValueLabel: string;
  conversionRateLabel: string;
  hotLeadCount: number;
  topModels: readonly WeeklyReportNamedCount[];
  topViewedMotors: readonly WeeklyReportNamedCount[];
  funnel: readonly WeeklyReportNamedCount[];
  weekOverWeek: SanitizedWeeklyReportWeekOverWeek;
};

export type SanitizedWeeklyReportEmail = {
  subject: string;
  html: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function quoteData(row: CustomerQuoteLike): Record<string, unknown> | null {
  return asRecord(parseMaybeJson(row.quote_data));
}

function normalizeToken(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function coercePositiveAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().replace(/,/g, "");
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }
  return 0;
}

function firstPositiveAmount(...values: unknown[]): number {
  for (const value of values) {
    const amount = coercePositiveAmount(value);
    if (amount > 0) return amount;
  }
  return 0;
}

function motorInfoRecord(row: CustomerQuoteLike, data: Record<string, unknown> | null): Record<string, unknown> | null {
  return asRecord(parseMaybeJson(data?.motor_info ?? row.motor_info));
}

function snapshotMotorRecord(row: CustomerQuoteLike, data: Record<string, unknown> | null): Record<string, unknown> | null {
  const snapshot = asRecord(data?.quote_snapshot ?? row.quote_snapshot);
  return asRecord(snapshot?.motor);
}

function topLevelMotorRecord(row: CustomerQuoteLike): Record<string, unknown> | null {
  return asRecord(row.motor);
}

const NEGATIVE_STATUS_MARKERS = new Set([
  "refunded",
  "refund",
  "failed",
  "canceled",
  "cancelled",
  "void",
  "voided",
  "chargeback",
  "charged_back",
  "disputed",
]);

function hasPaidMarker(value: unknown): boolean {
  const token = normalizeToken(value);
  return token === "paid" || token === "succeeded" || token === "collected";
}

function hasNegativeMarker(value: unknown): boolean {
  return NEGATIVE_STATUS_MARKERS.has(normalizeToken(value));
}

function hasNonblankStatus(...values: unknown[]): boolean {
  return values.some((value) => normalizeToken(value) !== "");
}

function resolveStatusLayer(...values: unknown[]): boolean | null {
  if (!hasNonblankStatus(...values)) return null;
  if (values.some(hasNegativeMarker)) return false;
  if (values.some(hasPaidMarker)) return true;
  return false;
}

function hasPaidTimestamp(value: unknown): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 && !Number.isNaN(new Date(value).getTime());
  }
  const text = readTrimmedString(value);
  if (!text) return false;
  return !Number.isNaN(Date.parse(text));
}

export function isMotorDepositRecord(row: CustomerQuoteLike): boolean {
  const data = quoteData(row);
  const paymentType = normalizeToken(row.payment_type ?? data?.payment_type);
  if (paymentType === "motor_deposit" || paymentType === "deposit") return true;
  return normalizeToken(row.lead_source) === "deposit";
}

export function isPaidRecord(row: CustomerQuoteLike): boolean {
  const data = quoteData(row);
  const topLevel = resolveStatusLayer(row.payment_status, row.deposit_status);
  if (topLevel !== null) return topLevel;
  const legacy = resolveStatusLayer(data?.payment_status, data?.deposit_status);
  if (legacy !== null) return legacy;
  return hasPaidTimestamp(row.payment_paid_at) || hasPaidTimestamp(data?.payment_paid_at);
}

export function isPaidMotorDeposit(row: CustomerQuoteLike): boolean {
  return isMotorDepositRecord(row) && isPaidRecord(row);
}

export function extractQuotedMotorModel(row: CustomerQuoteLike): string {
  const data = quoteData(row);
  const motorInfo = motorInfoRecord(row, data);
  const fromMotorInfo = readTrimmedString(motorInfo?.model);
  if (fromMotorInfo) return fromMotorInfo;

  const snapshotMotor = snapshotMotorRecord(row, data);
  const fromSnapshot = readTrimmedString(snapshotMotor?.model);
  if (fromSnapshot) return fromSnapshot;

  const topMotor = topLevelMotorRecord(row);
  const fromTopMotor = readTrimmedString(topMotor?.model);
  if (fromTopMotor) return fromTopMotor;

  return readTrimmedString(data?.motorModel)
    ?? readTrimmedString(data?.motor_model)
    ?? readTrimmedString(data?.model)
    ?? readTrimmedString(row.motor_model)
    ?? readTrimmedString(row.motorModel)
    ?? readTrimmedString(row.model)
    ?? "Unknown";
}

export function extractDepositAmount(row: CustomerQuoteLike): number {
  const data = quoteData(row);
  return firstPositiveAmount(row.deposit_amount, data?.deposit_amount);
}

export function extractReservedMotorValue(row: CustomerQuoteLike): number {
  const data = quoteData(row);
  const snapshotMotor = snapshotMotorRecord(row, data);
  const topMotor = topLevelMotorRecord(row);
  const motorInfo = motorInfoRecord(row, data);
  return firstPositiveAmount(
    row.motor_price,
    row.reserved_motor_value,
    topMotor?.price,
    data?.motor_price,
    snapshotMotor?.price,
    motorInfo?.price,
  );
}

export function summarizePaidReservations(
  rows: Iterable<CustomerQuoteLike>,
): PaidReservationMetrics {
  let paidReservations = 0;
  let depositsCollected = 0;
  let reservedMotorValue = 0;

  for (const row of rows) {
    if (!isPaidMotorDeposit(row)) continue;
    paidReservations += 1;
    depositsCollected += extractDepositAmount(row);
    reservedMotorValue += extractReservedMotorValue(row);
  }

  return { paidReservations, depositsCollected, reservedMotorValue };
}

export function buildWeeklyReportSubject(input: WeeklyReportSubjectInput): string {
  const quoteWord = input.totalQuotes === 1 ? "quote" : "quotes";

  if (input.paidReservations > 0) {
    const reservationWord = input.paidReservations === 1
      ? "paid reservation"
      : "paid reservations";
    return `📊 Weekly Report: ${input.visitors} visitors, ${input.totalQuotes} ${quoteWord}, ${input.paidReservations} ${reservationWord}, ${input.depositsCollectedLabel} deposits (${input.dateRange})`;
  }

  return `📊 Weekly Report: ${input.visitors} visitors, ${input.totalQuotes} ${quoteWord}, ${input.quotedValueLabel} (${input.dateRange})`;
}

export function buildWeeklyReportAiSystemPrompt(): string {
  return `You're an experienced marine dealership employee giving your boss the weekly website report. Be direct and professional. No corporate speak, no profanity, and no insulting language. No bullet points or headers — just talk naturally like you're sitting across the desk. Point out problems honestly. Give actionable suggestions. Keep it under 200 words total. ${WEEKLY_REPORT_AI_SAFETY_INSTRUCTION} Structure your response as:
1) A 3-4 sentence plain-English summary of what happened this week
2) 2-3 direct observations about what's working and what isn't
3) 2-3 specific, actionable improvement suggestions`;
}

export function buildPaidReservationAiContext(
  metrics: PaidReservationMetrics,
  fmt: (value: number) => string,
): string {
  return `Paid reservations: ${metrics.paidReservations}. Deposits collected: ${fmt(metrics.depositsCollected)}. Reserved motor value: ${fmt(metrics.reservedMotorValue)}. These are paid reservations/deposits, not completed sales.`;
}

export function formatPaidReservationSmsLines(
  metrics: PaidReservationMetrics,
  fmt: (value: number) => string,
): string[] {
  const reservationWord = metrics.paidReservations === 1
    ? "paid reservation"
    : "paid reservations";
  return [
    `• ${metrics.paidReservations} ${reservationWord}`,
    `• Deposits collected: ${fmt(metrics.depositsCollected)}`,
    `• Reserved motor value: ${fmt(metrics.reservedMotorValue)}`,
  ];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSignedCount(diff: number): string {
  return `${diff >= 0 ? "+" : ""}${diff}`;
}

function renderNamedCountRows(items: readonly WeeklyReportNamedCount[]): string {
  if (items.length === 0) {
    return `<tr><td colspan="2" style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">None this week</td></tr>`;
  }

  return items.map((item) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;">${item.count}</td>
          </tr>`).join("");
}

export function buildSanitizedWeeklyReportEmail(
  input: SanitizedWeeklyReportInput,
): SanitizedWeeklyReportEmail {
  const quoteWord = input.totalQuotes === 1 ? "quote" : "quotes";
  const reservationWord = input.paidReservations === 1
    ? "paid reservation"
    : "paid reservations";

  const subject = input.paidReservations > 0
    ? `📊 Weekly Operations Summary (sanitized): ${input.visitors} visitors, ${input.totalQuotes} ${quoteWord}, ${input.paidReservations} ${reservationWord}, ${input.depositsCollectedLabel} deposits (${input.periodLabel})`
    : `📊 Weekly Operations Summary (sanitized): ${input.visitors} visitors, ${input.totalQuotes} ${quoteWord}, ${input.quotedValueLabel} (${input.periodLabel})`;

  const wow = input.weekOverWeek;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#007DC5,#1e40af);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Weekly Operations Summary</h1>
      <p style="color:#e0f2fe;margin:8px 0 0;font-size:14px;">${escapeHtml(input.periodLabel)}</p>
    </div>

    <div style="padding:32px;">
      <div style="background:#ecfeff;border:1px solid #67e8f9;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
        <p style="margin:0;font-size:13px;color:#155e75;font-weight:600;">${WEEKLY_REPORT_SANITIZED_NOTICE}</p>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <div style="flex:1;min-width:120px;background:#f0f9ff;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#007DC5;">${input.visitors}</div>
          <div style="font-size:12px;color:#6b7280;">Visitors</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#16a34a;">${input.totalQuotes}</div>
          <div style="font-size:12px;color:#6b7280;">Saved Quotes</div>
        </div>
        <div style="flex:1;min-width:120px;background:#fef3c7;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#d97706;">${escapeHtml(input.quotedValueLabel)}</div>
          <div style="font-size:12px;color:#6b7280;">Quoted Value</div>
        </div>
        <div style="flex:1;min-width:120px;background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#dc2626;">${input.hotLeadCount}</div>
          <div style="font-size:12px;color:#6b7280;">Hot Leads</div>
        </div>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <div style="flex:1;min-width:120px;background:#ecfdf5;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#047857;">${input.paidReservations}</div>
          <div style="font-size:12px;color:#6b7280;">Paid Reservations</div>
        </div>
        <div style="flex:1;min-width:120px;background:#e0f2fe;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#0369a1;">${escapeHtml(input.depositsCollectedLabel)}</div>
          <div style="font-size:12px;color:#6b7280;">Deposits Collected</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f5f3ff;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#6d28d9;">${escapeHtml(input.reservedMotorValueLabel)}</div>
          <div style="font-size:12px;color:#6b7280;">Reserved Motor Value</div>
        </div>
      </div>

      <p style="margin:0 0 24px;font-size:13px;color:#374151;">Conversion rate: <strong>${escapeHtml(input.conversionRateLabel)}</strong></p>

      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">Top Quoted Models</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f0fdf4;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Model</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Quotes</th>
        </tr></thead>
        <tbody>${renderNamedCountRows(input.topModels)}</tbody>
      </table>

      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">Top Viewed Motors</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f0f9ff;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Motor</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Views</th>
        </tr></thead>
        <tbody>${renderNamedCountRows(input.topViewedMotors)}</tbody>
      </table>

      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">Funnel</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Step</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Count</th>
        </tr></thead>
        <tbody>${renderNamedCountRows(input.funnel)}</tbody>
      </table>

      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-top:24px;">
        <h3 style="margin:0 0 8px;font-size:14px;color:#374151;">Week-over-Week</h3>
        <p style="margin:4px 0;font-size:13px;color:#6b7280;">
          Quotes: ${wow.previousQuotes} → ${wow.currentQuotes} (${formatSignedCount(wow.quoteDiff)})<br>
          Quoted value: ${escapeHtml(wow.previousQuotedValueLabel)} → ${escapeHtml(wow.currentQuotedValueLabel)} (${escapeHtml(wow.quotedValueDiffLabel)})<br>
          Paid reservations: ${wow.previousPaidReservations} → ${wow.currentPaidReservations} (${formatSignedCount(wow.paidReservationDiff)})<br>
          Deposits collected: ${escapeHtml(wow.previousDepositsCollectedLabel)} → ${escapeHtml(wow.currentDepositsCollectedLabel)} (${escapeHtml(wow.depositsCollectedDiffLabel)})<br>
          Reserved motor value: ${escapeHtml(wow.previousReservedMotorValueLabel)} → ${escapeHtml(wow.currentReservedMotorValueLabel)} (${escapeHtml(wow.reservedMotorValueDiffLabel)})
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
