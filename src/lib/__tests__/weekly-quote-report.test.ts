import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  WEEKLY_REPORT_AI_SAFETY_INSTRUCTION,
  WEEKLY_REPORT_CC,
  WEEKLY_REPORT_GROK_TO,
  WEEKLY_REPORT_SANITIZED_NOTICE,
  WEEKLY_REPORT_TO,
  buildPaidReservationAiContext,
  buildSanitizedWeeklyReportEmail,
  buildWeeklyReportAiSystemPrompt,
  buildWeeklyReportSubject,
  escapeHtml,
  extractQuotedMotorModel,
  formatPaidReservationSmsLines,
  summarizePaidReservations,
  type CustomerQuoteLike,
} from '../../../supabase/functions/_shared/weekly-report-metrics.ts';

const reportSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/weekly-quote-report/index.ts'),
  'utf8',
);
const helperSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/_shared/weekly-report-metrics.ts'),
  'utf8',
);

const REMOVED_CC = 'harrisboatworks2153@manus.bot';

function fmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
}

function liveShapedPaid99(overrides: Partial<CustomerQuoteLike> = {}): CustomerQuoteLike {
  return {
    final_price: 0,
    deposit_amount: 200,
    lead_source: 'deposit',
    lead_status: 'scheduled',
    quote_data: {
      payment_status: 'paid',
      payment_type: 'motor_deposit',
      deposit_amount: 200,
      motor_info: { hp: 9.9, model: '9.9MH FourStroke' },
      quote_snapshot: {
        motor: { model: '9.9MH FourStroke', price: 2999 },
      },
    },
    ...overrides,
  };
}

function unpaidDeposit(): CustomerQuoteLike {
  return {
    final_price: 0,
    deposit_amount: 200,
    lead_source: 'deposit',
    lead_status: 'downloaded',
    quote_data: {
      payment_status: 'pending',
      payment_type: 'motor_deposit',
      deposit_amount: 200,
      motor_info: { hp: 9.9, model: '9.9MH FourStroke' },
    },
  };
}

function normalQuote(): CustomerQuoteLike {
  return {
    final_price: 12499,
    deposit_amount: 0,
    lead_source: 'website',
    quote_data: {
      motorModel: '150XL FourStroke',
    },
  };
}

function futureTopLevelPaidDeposit(overrides: Partial<CustomerQuoteLike> = {}): CustomerQuoteLike {
  return {
    final_price: 0,
    deposit_amount: 200,
    lead_source: 'deposit',
    payment_status: 'paid',
    payment_paid_at: '2026-08-20T12:00:00.000Z',
    deposit_status: 'paid',
    payment_type: 'motor_deposit',
    motor: { model: '15MH FourStroke', price: 3499 },
    ...overrides,
  };
}

describe('weekly quote report paid reservation metrics', () => {
  it('counts the live-shaped paid 9.9 motor deposit without treating it as a completed sale', () => {
    const row = liveShapedPaid99();
    const metrics = summarizePaidReservations([row]);

    expect(metrics).toEqual({
      paidReservations: 1,
      depositsCollected: 200,
      reservedMotorValue: 2999,
    });
    expect(row.final_price).toBe(0);
    expect(metrics.depositsCollected).not.toBe(2999);
    expect(metrics.reservedMotorValue).not.toBe(metrics.depositsCollected);
  });

  it('ignores an unpaid motor deposit', () => {
    expect(summarizePaidReservations([unpaidDeposit()])).toEqual({
      paidReservations: 0,
      depositsCollected: 0,
      reservedMotorValue: 0,
    });
  });

  it('leaves a normal saved quote in quoted-value metrics only', () => {
    const quote = normalQuote();
    expect(summarizePaidReservations([quote])).toEqual({
      paidReservations: 0,
      depositsCollected: 0,
      reservedMotorValue: 0,
    });
    expect(extractQuotedMotorModel(quote)).toBe('150XL FourStroke');
    expect(Number(quote.final_price)).toBe(12499);
  });

  it('accepts future top-level payment and motor fields without requiring them on the query', () => {
    expect(reportSource).not.toMatch(/select\([^)]*payment_status/);
    expect(reportSource).not.toMatch(/select\([^)]*payment_paid_at/);
    expect(reportSource).not.toMatch(/select\([^)]*deposit_status/);

    expect(summarizePaidReservations([futureTopLevelPaidDeposit()])).toEqual({
      paidReservations: 1,
      depositsCollected: 200,
      reservedMotorValue: 3499,
    });
    expect(extractQuotedMotorModel(futureTopLevelPaidDeposit())).toBe('15MH FourStroke');
  });

  it('coerces numeric strings and ignores negative or invalid amounts', () => {
    const stringAmounts = liveShapedPaid99({
      deposit_amount: '200',
      quote_data: {
        payment_status: 'paid',
        payment_type: 'motor_deposit',
        deposit_amount: '200',
        quote_snapshot: { motor: { model: '9.9MH FourStroke', price: '2,999' } },
      },
    });
    expect(summarizePaidReservations([stringAmounts])).toEqual({
      paidReservations: 1,
      depositsCollected: 200,
      reservedMotorValue: 2999,
    });

    const invalidAmounts = liveShapedPaid99({
      deposit_amount: -50,
      quote_data: {
        payment_status: 'paid',
        payment_type: 'motor_deposit',
        deposit_amount: 'not-a-number',
        quote_snapshot: { motor: { model: '9.9MH FourStroke', price: -10 } },
      },
    });
    expect(summarizePaidReservations([invalidAmounts])).toEqual({
      paidReservations: 1,
      depositsCollected: 0,
      reservedMotorValue: 0,
    });
  });

  it('extracts 9.9MH FourStroke from motor_info or quote_snapshot before falling back', () => {
    expect(extractQuotedMotorModel(liveShapedPaid99())).toBe('9.9MH FourStroke');
    expect(extractQuotedMotorModel({
      quote_data: {
        motor_info: { hp: 9.9 },
        quote_snapshot: { motor: { model: '9.9MH FourStroke' } },
        motorModel: 'Unknown Fallback',
      },
    })).toBe('9.9MH FourStroke');
    expect(extractQuotedMotorModel({
      quote_data: {
        motor_info: JSON.stringify({ model: '9.9MH FourStroke' }),
        model: 'Fallback Model',
      },
    })).toBe('9.9MH FourStroke');
    expect(extractQuotedMotorModel({
      quote_data: { motorModel: '150XL FourStroke' },
    })).toBe('150XL FourStroke');
    expect(extractQuotedMotorModel({ quote_data: {} })).toBe('Unknown');
  });

  it('does not treat refunded, failed, or pending deposits as paid when a timestamp is retained', () => {
    const unpaid = {
      paidReservations: 0,
      depositsCollected: 0,
      reservedMotorValue: 0,
    };

    expect(summarizePaidReservations([liveShapedPaid99({
      quote_data: {
        payment_status: 'refunded',
        payment_type: 'motor_deposit',
        payment_paid_at: '2026-08-20T12:00:00.000Z',
        deposit_amount: 200,
        motor_info: { hp: 9.9, model: '9.9MH FourStroke' },
        quote_snapshot: { motor: { model: '9.9MH FourStroke', price: 2999 } },
      },
    })])).toEqual(unpaid);

    expect(summarizePaidReservations([futureTopLevelPaidDeposit({
      payment_status: 'failed',
      deposit_status: 'failed',
      payment_paid_at: '2026-08-20T12:00:00.000Z',
    })])).toEqual(unpaid);

    expect(summarizePaidReservations([liveShapedPaid99({
      quote_data: {
        payment_status: 'pending',
        payment_type: 'motor_deposit',
        payment_paid_at: '2026-08-20T12:00:00.000Z',
        deposit_amount: 200,
        motor_info: { hp: 9.9, model: '9.9MH FourStroke' },
        quote_snapshot: { motor: { model: '9.9MH FourStroke', price: 2999 } },
      },
    })])).toEqual(unpaid);
  });

  it('lets a terminal refund marker override a paid marker in the same status layer', () => {
    expect(summarizePaidReservations([futureTopLevelPaidDeposit({
      payment_status: 'paid',
      deposit_status: 'refunded',
      payment_paid_at: '2026-08-20T12:00:00.000Z',
    })])).toEqual({
      paidReservations: 0,
      depositsCollected: 0,
      reservedMotorValue: 0,
    });

    expect(summarizePaidReservations([liveShapedPaid99({
      quote_data: {
        payment_status: 'paid',
        deposit_status: 'refunded',
        payment_type: 'motor_deposit',
        payment_paid_at: '2026-08-20T12:00:00.000Z',
        deposit_amount: 200,
        motor_info: { hp: 9.9, model: '9.9MH FourStroke' },
        quote_snapshot: { motor: { model: '9.9MH FourStroke', price: 2999 } },
      },
    })])).toEqual({
      paidReservations: 0,
      depositsCollected: 0,
      reservedMotorValue: 0,
    });
  });

  it('does not treat an arbitrary non-empty payment_paid_at string as paid', () => {
    expect(summarizePaidReservations([{
      deposit_amount: 200,
      lead_source: 'deposit',
      payment_type: 'motor_deposit',
      payment_paid_at: 'not-a-date',
      motor: { model: '15MH FourStroke', price: 3499 },
    }])).toEqual({
      paidReservations: 0,
      depositsCollected: 0,
      reservedMotorValue: 0,
    });
  });

  it('accepts a valid timestamp-only paid marker when no status exists at either layer', () => {
    expect(summarizePaidReservations([{
      deposit_amount: 200,
      lead_source: 'deposit',
      payment_type: 'motor_deposit',
      payment_paid_at: '2026-08-20T12:00:00.000Z',
      motor: { model: '15MH FourStroke', price: 3499 },
    }])).toEqual({
      paidReservations: 1,
      depositsCollected: 200,
      reservedMotorValue: 3499,
    });

    expect(summarizePaidReservations([liveShapedPaid99({
      quote_data: {
        payment_type: 'motor_deposit',
        payment_paid_at: '2026-08-20T12:00:00.000Z',
        deposit_amount: 200,
        motor_info: { hp: 9.9, model: '9.9MH FourStroke' },
        quote_snapshot: { motor: { model: '9.9MH FourStroke', price: 2999 } },
      },
    })])).toEqual({
      paidReservations: 1,
      depositsCollected: 200,
      reservedMotorValue: 2999,
    });
  });

  it('does not double count a row that has both legacy quote_data and top-level fields', () => {
    const dualShape = liveShapedPaid99({
      payment_status: 'paid',
      payment_type: 'motor_deposit',
      deposit_amount: 200,
      motor_price: 2999,
      motor: { model: '9.9MH FourStroke', price: 2999 },
    });

    expect(summarizePaidReservations([dualShape, unpaidDeposit(), normalQuote()])).toEqual({
      paidReservations: 1,
      depositsCollected: 200,
      reservedMotorValue: 2999,
    });
  });

  it('keeps the subject, copy, and AI prompt from treating a paid reservation as no sale', () => {
    const metrics = summarizePaidReservations([liveShapedPaid99()]);
    const subject = buildWeeklyReportSubject({
      visitors: 414,
      totalQuotes: 1,
      quotedValueLabel: fmt(0),
      paidReservations: metrics.paidReservations,
      depositsCollectedLabel: fmt(metrics.depositsCollected),
      dateRange: 'Aug 17 - Aug 24',
    });
    const aiPrompt = buildWeeklyReportAiSystemPrompt();
    const aiContext = buildPaidReservationAiContext(metrics, fmt);
    const sms = formatPaidReservationSmsLines(metrics, fmt).join('\n');

    expect(subject).toContain('414 visitors');
    expect(subject).toContain('1 quote');
    expect(subject).toMatch(/1 paid reservation/i);
    expect(subject).toMatch(/CA\$200 deposits/);
    expect(subject).not.toMatch(/CA\$0/);
    expect(subject).not.toMatch(/nobody (bought|purchased)|no sales|pulled the trigger/i);

    expect(aiPrompt).toContain(WEEKLY_REPORT_AI_SAFETY_INSTRUCTION);
    expect(aiPrompt).toMatch(/direct and professional/i);
    expect(aiPrompt).toMatch(/no profanity/i);
    expect(aiPrompt).toMatch(/no insulting language/i);
    expect(aiPrompt).not.toMatch(/\bblunt\b/i);

    expect(WEEKLY_REPORT_AI_SAFETY_INSTRUCTION).toMatch(/never claim nobody bought/i);
    expect(WEEKLY_REPORT_AI_SAFETY_INSTRUCTION).toMatch(/nobody pulled the trigger/i);
    expect(WEEKLY_REPORT_AI_SAFETY_INSTRUCTION).toMatch(/or no sales/i);
    expect(WEEKLY_REPORT_AI_SAFETY_INSTRUCTION).toMatch(/paid reservations\/deposits, not completed sales/i);

    expect(aiContext).toContain('Paid reservations: 1');
    expect(aiContext).toContain(fmt(200));
    expect(aiContext).toContain(fmt(2999));
    expect(aiContext).toMatch(/not completed sales/i);
    expect(sms).toContain('1 paid reservation');
    expect(sms).toContain(`Deposits collected: ${fmt(200)}`);
    expect(sms).toContain(`Reserved motor value: ${fmt(2999)}`);

    expect(reportSource).toContain('buildWeeklyReportSubject');
    expect(reportSource).toContain('buildWeeklyReportAiSystemPrompt');
    expect(reportSource).toContain('buildPaidReservationAiContext');
    expect(reportSource).toContain('formatPaidReservationSmsLines');
    expect(reportSource).toContain('Paid Reservations');
    expect(reportSource).toContain('Deposits Collected');
    expect(reportSource).toContain('Reserved Motor Value');
    expect(reportSource).toContain('Quoted Value');
    expect(reportSource).toContain('paidReservations');
    expect(reportSource).toContain('depositsCollected');
    expect(reportSource).toContain('reservedMotorValue');
  });

  it('removes the manus bot from CC and keeps the remaining recipients', () => {
    expect(WEEKLY_REPORT_TO).toEqual(['info@harrisboatworks.ca']);
    expect(WEEKLY_REPORT_CC).toEqual(['hbwbot00@gmail.com']);
    expect(WEEKLY_REPORT_CC).not.toContain(REMOVED_CC);
    expect(reportSource).toContain('WEEKLY_REPORT_TO');
    expect(reportSource).toContain('WEEKLY_REPORT_CC');
    expect(reportSource).not.toContain(REMOVED_CC);
    expect(helperSource).not.toContain(REMOVED_CC);
    expect(helperSource).toContain('info@harrisboatworks.ca');
    expect(helperSource).toContain('hbwbot00@gmail.com');
  });

  it('keeps the detailed weekly email on info/hbwbot00 and sends AgentMail separately', () => {
    expect(WEEKLY_REPORT_TO).toEqual(['info@harrisboatworks.ca']);
    expect(WEEKLY_REPORT_CC).toEqual(['hbwbot00@gmail.com']);
    expect(WEEKLY_REPORT_GROK_TO).toEqual(['hbwbot@agentmail.to']);
    expect(WEEKLY_REPORT_TO).not.toContain('hbwbot@agentmail.to');
    expect(WEEKLY_REPORT_CC).not.toContain('hbwbot@agentmail.to');
    expect(WEEKLY_REPORT_GROK_TO).not.toContain('info@harrisboatworks.ca');
    expect(WEEKLY_REPORT_GROK_TO).not.toContain('hbwbot00@gmail.com');

    expect(reportSource).toMatch(/to:\s*\[\.\.\.WEEKLY_REPORT_TO\]/);
    expect(reportSource).toMatch(/cc:\s*\[\.\.\.WEEKLY_REPORT_CC\]/);
    expect(reportSource).toMatch(/to:\s*\[\.\.\.WEEKLY_REPORT_GROK_TO\]/);
    expect(reportSource).not.toMatch(/cc:\s*\[\.\.\.WEEKLY_REPORT_GROK_TO\]/);
    expect(reportSource).not.toMatch(/\bbcc:/);
    expect(reportSource).not.toMatch(/WEEKLY_REPORT_TO[\s\S]{0,80}hbwbot@agentmail\.to/);
    expect(helperSource).toContain('hbwbot@agentmail.to');
  });

  it('builds a sanitized AgentMail recap from aggregates without customer PII', () => {
    const customerPii = {
      customer_name: 'Avery Quinn',
      customer_email: 'avery.quinn@example.net',
      phone: '705-555-0147',
      address: '88 Birch Point Road',
      quote_id: 'quote_7c2e91aa',
      payment_id: 'pi_3SanitizedTestSecret99',
    };
    const detailedEmailHtml = `
      <h2>🔥 Hot Leads Requiring Follow-Up</h2>
      <td>${customerPii.customer_name}</td>
      <td>${customerPii.customer_email}</td>
      <a href="https://mercuryrepower.ca/admin">View Full Dashboard →</a>
    `;
    const aiSummaryHtml = `<p>🧠 AI Weekly Debrief: ${customerPii.customer_name} is ready to buy.</p>`;

    const paid = liveShapedPaid99({
      customer_name: customerPii.customer_name,
      customer_email: customerPii.customer_email,
      customer_phone: customerPii.phone,
      customer_address: customerPii.address,
      id: customerPii.quote_id,
      stripe_payment_id: customerPii.payment_id,
    });
    const quote = normalQuote();
    const metrics = summarizePaidReservations([paid, quote]);

    const sanitizedInputType = helperSource.match(
      /export type SanitizedWeeklyReportInput = \{[\s\S]*?\n\};/,
    )?.[0] ?? '';
    expect(sanitizedInputType).toContain('hotLeadCount');
    expect(sanitizedInputType).not.toContain('customer_name');
    expect(sanitizedInputType).not.toContain('customer_email');
    expect(sanitizedInputType).not.toContain('emailHtml');
    expect(sanitizedInputType).not.toContain('quote_data');
    expect(sanitizedInputType).not.toContain('hotLeads');
    expect(sanitizedInputType).not.toMatch(/\bphone\b/);
    expect(sanitizedInputType).not.toMatch(/\baddress\b/);
    expect(sanitizedInputType).not.toMatch(/stripe|payment_id|quote_id/i);

    const sanitized = buildSanitizedWeeklyReportEmail({
      periodLabel: 'Aug 17 - Aug 24',
      visitors: 414,
      totalQuotes: 2,
      quotedValueLabel: fmt(12499),
      paidReservations: metrics.paidReservations,
      depositsCollectedLabel: fmt(metrics.depositsCollected),
      reservedMotorValueLabel: fmt(metrics.reservedMotorValue),
      conversionRateLabel: '0.5%',
      hotLeadCount: 1,
      topModels: [
        { name: '9.9MH FourStroke', count: 1 },
        { name: '150XL FourStroke', count: 1 },
      ],
      topViewedMotors: [{ name: '9.9MH FourStroke', count: 12 }],
      funnel: [
        { name: 'Site Visitors', count: 414 },
        { name: 'Submitted Quote', count: 2 },
      ],
      weekOverWeek: {
        previousQuotes: 0,
        currentQuotes: 2,
        quoteDiff: 2,
        previousQuotedValueLabel: fmt(0),
        currentQuotedValueLabel: fmt(12499),
        quotedValueDiffLabel: `+${fmt(12499)}`,
        previousPaidReservations: 0,
        currentPaidReservations: 1,
        paidReservationDiff: 1,
        previousDepositsCollectedLabel: fmt(0),
        currentDepositsCollectedLabel: fmt(200),
        depositsCollectedDiffLabel: `+${fmt(200)}`,
        previousReservedMotorValueLabel: fmt(0),
        currentReservedMotorValueLabel: fmt(2999),
        reservedMotorValueDiffLabel: `+${fmt(2999)}`,
      },
    });

    const output = `${sanitized.subject}\n${sanitized.html}`;
    expect(sanitized.subject).toMatch(/sanitized/i);
    expect(sanitized.html).toContain(WEEKLY_REPORT_SANITIZED_NOTICE);
    expect(output).toContain('Paid Reservations');
    expect(output).toContain('1');
    expect(output).toContain(fmt(200));
    expect(output).toContain(fmt(2999));
    expect(output).toContain('9.9MH FourStroke');
    expect(output).toContain('150XL FourStroke');
    expect(output).toContain('414');
    expect(output).toContain('0.5%');
    expect(output).toContain('Site Visitors');
    expect(output).toContain('Week-over-Week');

    for (const value of Object.values(customerPii)) {
      expect(output).not.toContain(value);
    }
    expect(output).not.toContain(detailedEmailHtml);
    expect(output).not.toContain(aiSummaryHtml);
    expect(output).not.toContain('Hot Leads Requiring Follow-Up');
    expect(output).not.toContain('/admin');
    expect(output).not.toContain('AI Weekly Debrief');
    expect(output).not.toContain('View Full Dashboard');
  });

  it('keeps the AgentMail payload on sanitized aggregates and derives delivery flags from each send error', () => {
    const sanitizedCall = reportSource.match(
      /buildSanitizedWeeklyReportEmail\(\{([\s\S]*?)\n    \}\);/,
    )?.[1] ?? '';

    expect(reportSource).toContain('buildSanitizedWeeklyReportEmail');
    expect(reportSource).toContain('sanitizedWeeklyReport.html');
    expect(reportSource).toMatch(/html:\s*emailHtml/);
    expect(reportSource).toMatch(/html:\s*sanitizedWeeklyReport\.html/);
    expect(sanitizedCall).toContain('hotLeads.length');
    expect(sanitizedCall).not.toContain('emailHtml');
    expect(sanitizedCall).not.toContain('aiSummaryHtml');
    expect(sanitizedCall).not.toContain('aiSummarySms');
    expect(sanitizedCall).not.toContain('aiText');
    expect(sanitizedCall).not.toMatch(/hotLeads(?!\.length)/);
    expect(sanitizedCall).not.toContain('APP_URL');
    expect(sanitizedCall).not.toContain('/admin');
    expect(sanitizedCall).not.toContain('customer_name');
    expect(sanitizedCall).not.toContain('customer_email');
    expect(sanitizedCall).not.toContain('quote_data');

    expect(reportSource).toContain('Promise.all');
    expect(reportSource).toContain('sendWeeklyReportEmail');
    expect(reportSource).toMatch(/const emailSent = !internalEmailResult\.error/);
    expect(reportSource).toMatch(/const grokEmailSent = !grokEmailResult\.error/);
    expect(reportSource).toMatch(/emailSent,/);
    expect(reportSource).toMatch(/grokEmailSent,/);
    expect(reportSource).not.toMatch(/emailSent:\s*true/);
    expect(reportSource).not.toMatch(/grokEmailSent:\s*true/);
    expect(reportSource).not.toContain('Email sent:');
  });

  it('escapes AI summary markup before converting newlines to br tags', () => {
    const aiText = '<script>alert("xss")</script>\nA & B <C>';
    const escapedText = escapeHtml(aiText).replace(/\n/g, '<br>');

    expect(escapedText).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;<br>A &amp; B &lt;C&gt;',
    );
    expect(escapedText).not.toContain('<script>');
    expect(escapedText).not.toContain('</script>');
    expect(escapedText).toContain('<br>');
    expect(escapedText.match(/<br>/g)).toHaveLength(1);

    expect(reportSource).toMatch(/escapeHtml\(aiText\)\.replace\(\/\\n\/g,\s*'<br>'\)/);
    expect(reportSource).not.toMatch(/aiText\.replace\(\/\\n\/g,\s*'<br>'\)/);
  });
});
