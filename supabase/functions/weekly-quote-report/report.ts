import { buildAdminEmail, esc } from '../_shared/email-layout.ts';

export interface Week {
  start: string; end: string;
  events: number; raw_events: number; sessions: number; excluded_sessions: number; unlinked_events: number;
  quote_starts: number; saw_price: number; summary_sessions: number; submitted_sessions: number;
  phone_clicks: number; sms_clicks: number; fast_builder_sessions: number;
  customer_quote_records: number; contactable_quote_records: number; quote_value: number;
  api_quote_records: number; api_test_records: number; test_quote_records: number; admin_quote_records: number;
  guide_leads: number; chat_leads: number;
  quote_sources: { source: string; records: number }[];
  top_motors: { model: string; records: number }[];
  viewed_motors: { model: string; sessions: number }[];
  traffic: { source: string; sessions: number }[];
  devices: Record<string, number>;
  blogs: { path: string; sessions: number; quote_starts: number }[];
  trade_valuations: number; trade_pending: number; contact_inquiries: number; contact_pending: number;
  chats: number; chats_with_phone: number; paid_deposits: number; paid_deposit_amount: number;
  saved_snapshots: number; anonymous_pdf_snapshots: number;
}
export interface Report { version: 2; weeks: Week[] }
const numericKeys = ['guide_leads','chat_leads','events','raw_events','sessions','excluded_sessions','unlinked_events','quote_starts','saw_price','summary_sessions','submitted_sessions','phone_clicks','sms_clicks','fast_builder_sessions','customer_quote_records','contactable_quote_records','quote_value','api_quote_records','api_test_records','test_quote_records','admin_quote_records','trade_valuations','trade_pending','contact_inquiries','contact_pending','chats','chats_with_phone','paid_deposits','paid_deposit_amount','saved_snapshots','anonymous_pdf_snapshots'] as const;

export function parseReport(value: unknown): Report {
  if (!value || typeof value !== 'object') throw new Error('Report aggregate unavailable');
  const report = value as Report;
  if (report.version !== 2 || !Array.isArray(report.weeks) || report.weeks.length !== 4) throw new Error('Incomplete four-week aggregate');
  for (const w of report.weeks) {
    if (!w || !Number.isFinite(Date.parse(w.start)) || !Number.isFinite(Date.parse(w.end))) throw new Error('Invalid reporting period');
    for (const key of numericKeys) if (typeof w[key] !== 'number' || !Number.isFinite(w[key]) || w[key] < 0) throw new Error(`Missing or invalid metric: ${key}`);
    for (const key of ['quote_sources','top_motors','viewed_motors','traffic','blogs'] as const) if (!Array.isArray(w[key])) throw new Error(`Missing breakdown: ${key}`);
  }
  return report;
}
const money = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);
const noun = (n: number, singular: string, plural = singular + 's') => `${n} ${n === 1 ? singular : plural}`;
const date = (value: string) => new Date(value).toLocaleDateString('en-CA', { timeZone: 'America/Toronto', month: 'short', day: 'numeric' });

export function renderReport(report: Report) {
  const w = report.weeks[0];
  const previous = report.weeks[1];
  const period = `${date(w.start)} – ${date(w.end)}`;
  const change = w.contactable_quote_records - previous.contactable_quote_records;
  const take = `${w.sessions.toLocaleString('en-CA')} tracked sessions produced ${w.quote_starts} quote starts; ${w.saw_price} of those sessions reached the price. We recorded ${noun(w.contactable_quote_records, 'quote with contact details', 'quotes with contact details')}, ${noun(w.trade_valuations, 'trade valuation request')} and ${noun(w.contact_inquiries, 'contact inquiry', 'contact inquiries')}. ${w.paid_deposits} paid motor deposits were recorded (${money(w.paid_deposit_amount)}). ${w.api_quote_records} public API quote records are counted separately from website leads.`;
  const action = w.trade_pending + w.contact_pending > 0
    ? `First, follow up on ${[w.trade_pending ? noun(w.trade_pending, 'new trade valuation request') : '', w.contact_pending ? noun(w.contact_pending, 'new contact inquiry', 'new contact inquiries') : ''].filter(Boolean).join(' and ')} from this period in the admin dashboard.`
    : w.saw_price > 0 && w.contactable_quote_records === 0
      ? 'Next, check the existing quote review, text and reservation paths from the price page. These figures do not tell us why people did not leave contact details.'
      : 'Next, follow up on contactable requests and compare quote starts, price views and paid deposits across the four weeks below.';
  const quality = `Coverage: ${w.raw_events} stored events, ${w.excluded_sessions} explicitly marked test/bot sessions excluded, ${w.unlinked_events} events without a session. ${w.fast_builder_sessions} builder sessions reached the summary in under one second; these remain included and are not proven bots. Sessions are browser identifiers, not verified people. Untagged tests/bots may remain.`;
  const lines = [
    `📊 Weekly Report (${period})`, '', `THIS WEEK: ${take}`, '', `NEXT STEP: ${action}`, '',
    'CONTACT & COMMITMENT',
    `• Website quotes with contact details: ${w.contactable_quote_records} (${change >= 0 ? '+' : ''}${change} vs previous week); quoted value ${money(w.quote_value)}, not revenue`,
    `• Trade valuations: ${w.trade_valuations} (${w.trade_pending} still new)`,
    `• Contact inquiries: ${w.contact_inquiries} (${w.contact_pending} still new)`,
    `• Guide download leads: ${w.guide_leads}; captured chat leads: ${w.chat_leads} (excluded from quote totals)`,
    `• Chat conversations: ${w.chats}; ${w.chats_with_phone} with a phone recorded`,
    `• Paid motor deposits: ${w.paid_deposits}, ${money(w.paid_deposit_amount)} (paid-date basis)`,
    'Source counts may overlap; they are not unique customers. Other payment flows and offline deals are not included.', '',
    'BROWSING & INTENT',
    `• ${w.sessions} sessions → ${w.quote_starts} motor-selection sessions → ${w.saw_price} of those reached price`,
    `• ${w.submitted_sessions} sessions emitted quote_submitted (telemetry, not a verified lead total)`,
    `• Quote-summary sessions with phone clicks: ${w.phone_clicks}; with text clicks: ${w.sms_clicks} (not site-wide totals or confirmed calls/messages)`,
    `• Anonymous PDF snapshots: ${w.anonymous_pdf_snapshots} (not confirmed completed downloads)`, '',
    'API & EXCLUSIONS',
    `• Public API quotes: ${w.api_quote_records}, including ${w.api_test_records} explicitly flagged/reserved-domain test records`,
    `• Test quote records excluded: ${w.test_quote_records}; admin quote records excluded: ${w.admin_quote_records} (categories can overlap)`, '',
    'FOUR WEEKS (oldest first)',
    ...[...report.weeks].reverse().map(x => `• ${date(x.start)}: ${x.sessions} sessions / ${x.quote_starts} starts / ${x.saw_price} reached price / ${x.contactable_quote_records} quotes with contact details / ${x.paid_deposits} paid deposits`), '',
    quality,
  ];
  const details = [
    ['Website quote sources', w.quote_sources.map(x => `${x.source}: ${x.records}`)],
    ['Most quoted motors (contactable website quotes)', w.top_motors.map(x => `${x.model}: ${x.records}`)],
    ['Selected motors (sessions)', w.viewed_motors.map(x => `${x.model}: ${x.sessions}`)],
    ['Traffic (first event in each reporting week)', w.traffic.map(x => `${x.source}: ${x.sessions}`)],
    ['Blog → builder (same session, blog visit before motor selection)', w.blogs.map(x => `${x.path}: ${x.sessions} sessions, ${x.quote_starts} quote starts`)],
  ] as const;
  const bodyHtml = `<p>${esc(take)}</p><p><strong>${esc(action)}</strong></p>` +
    lines.slice(6).map(line => !line ? '<br>' : /^[A-Z &()]+$/.test(line) ? `<h2 style="font-size:16px">${esc(line)}</h2>` : `<p style="margin:8px 0">${esc(line)}</p>`).join('') +
    details.map(([heading, rows]) => `<h2 style="font-size:16px">${esc(heading)}</h2>${rows.length ? rows.map(row => `<p>${esc(row)}</p>`).join('') : '<p>None recorded.</p>'}`).join('') +
    '<p>Blog counts can overlap across articles. Optional builder steps are not treated as drop-offs. Historical bot identity and completed anonymous PDF downloads are not fully instrumented.</p>' +
    '<p><a href="https://www.mercuryrepower.ca/admin">Review requests in the admin dashboard</a></p>';
  return {
    subject: `Weekly Report: ${w.contactable_quote_records} quotes with contact details, ${w.trade_valuations} valuations, ${w.paid_deposits} paid deposits (${period})`,
    sms: [
      `📊 Weekly Report (${period})`, '', take, '', action, '',
      `INTENT: quote-summary sessions with phone/text clicks: ${w.phone_clicks}/${w.sms_clicks} (not site-wide); ${w.anonymous_pdf_snapshots} anonymous PDF snapshots. These are not confirmed contacts or downloads.`,
      `DATA CHECK: ${w.raw_events} events counted; ${w.excluded_sessions} marked test/bot sessions excluded. ${w.fast_builder_sessions} sub-second builder sessions remain included; untagged automation may remain. ${w.api_test_records} of the API quotes have explicit test/reserved-domain markers.`,
      `4-WEEK TREND (old → new): quotes with contact details ${[...report.weeks].reverse().map(x => x.contactable_quote_records).join(' → ')}; paid deposits ${[...report.weeks].reverse().map(x => x.paid_deposits).join(' → ')}.`,
      'Guide/chat leads are excluded from quote totals. Source counts can overlap. Full breakdown and blog attribution are in the email.',
    ].join('\n'),
    html: buildAdminEmail({ heading: `Weekly website report | ${period}`, preheader: take, bodyHtml }),
    summary: take,
  };
}
