import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { esc } from "../_shared/email-layout.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = "info@harrisboatworks.ca";
// Extra recipients. Remove entries here to stop CCing them.
const REPORT_CC: string[] = ["hbwbot00@gmail.com", "harrisboatworks2153@manus.bot"];
const APP_URL = "https://mercuryrepower.ca";

type Json = Record<string, any>;

const LEAD_SOURCE_LABELS: Record<string, string> = {
  quotes: 'Saved customer quotes',
  trade_valuations: 'Trade valuations',
  saved_quotes: 'Saved builds (real email)',
  financing_applications: 'Financing applications',
  contact_inquiries: 'Contact inquiries',
  chats: 'Chats with contact info',
  voice_callbacks: 'Voice callbacks',
  deposits: 'Deposits paid',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const url = new URL(req.url);
    let bodyJson: Json = {};
    if (req.method === 'POST') {
      try { bodyJson = await req.json(); } catch { bodyJson = {}; }
    }
    const dryRun = url.searchParams.get('dryRun') === '1'
      || url.searchParams.get('dry_run') === '1'
      || bodyJson?.dryRun === true;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const adminPhone = Deno.env.get('ADMIN_PHONE');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatDateDisplay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(Number(n) || 0);
    const formatTime = (s: number) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

    console.log(`[WEEKLY-REPORT] Generating report for ${formatDate(weekAgo)} to ${formatDate(now)} (dryRun=${dryRun})`);

    // ============ ALL COUNTING HAPPENS IN SQL ============
    // No raw event rows are pulled into this function (the table holds ~10k rows/week
    // and PostgREST caps a plain select at 1000 rows).
    const { data: metricsData, error: metricsError } = await supabase.rpc('weekly_report_metrics', {
      p_start: weekAgo.toISOString(),
      p_end: now.toISOString(),
    });
    if (metricsError) throw new Error(`weekly_report_metrics failed: ${metricsError.message}`);
    const m = (metricsData || {}) as Json;

    const sessions: number = m.sessions || 0;
    const testExcluded: number = m.test_sessions_excluded || 0;
    const devices: Json = m.devices || {};
    const topPages: Json[] = m.top_pages || [];
    const topExitPages: Json[] = m.top_exit_pages || [];
    const trafficSources: Json[] = m.traffic_sources || [];
    const topViewedMotors: Json[] = m.top_viewed_motors || [];
    const topAbandonedMotors: Json[] = m.top_abandoned_motors || [];
    const funnel: Json = m.funnel || {};
    const optionalSteps: Json = m.optional_steps || {};
    const walked: Json = m.saw_price_walked || {};
    const blog: Json = m.blog_to_builder || {};
    const quotes: Json = m.quotes || {};
    const leads: Json = m.leads || {};
    const trend: Json[] = m.trend || [];

    const totalQuotes: number = quotes.real_count || 0;
    const totalValue: number = Number(quotes.real_value || 0);
    const avgValue: number = Number(quotes.real_avg || 0);
    const prevTotalQuotes: number = quotes.prev_count || 0;
    const prevTotalValue: number = Number(quotes.prev_value || 0);
    const agentQuotes: number = quotes.agent_count || 0;
    const agentValue: number = Number(quotes.agent_value || 0);
    const hotLeads: Json[] = quotes.hot_leads || [];
    const topModels: Json[] = quotes.top_models || [];

    const quoteDiff = totalQuotes - prevTotalQuotes;
    const valueDiff = totalValue - prevTotalValue;
    const quoteTrend = totalQuotes >= prevTotalQuotes ? '↑' : '↓';
    const valueTrend = totalValue >= prevTotalValue ? '↑' : '↓';

    // ============ REAL LEADS (all sources combined) ============
    const leadCounts = Object.keys(LEAD_SOURCE_LABELS).map((key) => ({
      key,
      label: LEAD_SOURCE_LABELS[key],
      rows: (leads[key] || []) as Json[],
    }));
    const totalRealLeads = leadCounts.reduce((s, l) => s + l.rows.length, 0);

    // ============ MANDATORY-STEP FUNNEL ONLY ============
    const funnelSteps = [
      { label: 'Motor', count: funnel.selected_motor || 0 },
      { label: 'Path', count: funnel.chose_path || 0 },
      { label: 'Summary', count: funnel.viewed_summary || 0 },
      { label: 'Contact', count: funnel.gave_contact || 0 },
      { label: 'Deposit', count: funnel.deposit_paid || 0 },
    ];
    let biggestDrop = { from: '', to: '', pct: 0 };
    for (let i = 1; i < funnelSteps.length; i++) {
      const prev = funnelSteps[i - 1];
      if (prev.count > 0) {
        const dropPct = Math.round(((prev.count - funnelSteps[i].count) / prev.count) * 100);
        if (dropPct > biggestDrop.pct) biggestDrop = { from: prev.label, to: funnelSteps[i].label, pct: dropPct };
      }
    }

    const blogSessions: number = blog.blog_sessions || 0;
    const blogStarted: number = blog.blog_sessions_started_quote || 0;
    const blogPct = blogSessions > 0 ? Math.round((blogStarted / blogSessions) * 1000) / 10 : 0;

    const trendLine = trend
      .map((t) => `${new Date(t.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${t.real_sessions} sess / ${t.real_quote_starts} starts / ${t.real_leads} leads`)
      .join(' | ');

    // ============ AI SUMMARY (clean numbers only) ============
    let aiSummaryHtml = '';
    let aiSummarySms = '';
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        const metricsSummary = [
          `NOTE: every number below excludes automated test sessions (${testExcluded} excluded this week) and excludes the ${agentQuotes} sample quotes generated by the AI-agent quote API. Those are not customers.`,
          `Real sessions: ${sessions}. Real quote starts (picked a motor): ${funnel.selected_motor || 0}.`,
          `Reached the price/summary page: ${funnel.viewed_summary || 0}. Gave contact info: ${funnel.gave_contact || 0}. Deposits paid: ${funnel.deposit_paid || 0}.`,
          `Saw the price and walked (summary, no contact info): ${walked.count || 0}. Anonymous PDF downloads: ${walked.anonymous_pdf_downloads || 0}.`,
          `Real leads this week: ${totalRealLeads}${totalRealLeads > 0 ? ` (${leadCounts.filter(l => l.rows.length).map(l => `${l.label}: ${l.rows.length}`).join(', ')})` : ''}.`,
          `Real saved customer quotes: ${totalQuotes}, ${fmt(totalValue)} total. Last week: ${prevTotalQuotes}, ${fmt(prevTotalValue)}.`,
          `Biggest drop in the mandatory funnel: ${biggestDrop.pct}% lost between ${biggestDrop.from} → ${biggestDrop.to}.`,
          `Top motors people configured: ${topViewedMotors.slice(0, 3).map(v => `${v.model} (${v.views})`).join(', ') || 'none'}.`,
          `Blog → builder: ${blogSessions} blog sessions, ${blogStarted} started a quote (${blogPct}%). Top posts: ${(blog.top_posts || []).slice(0, 3).map((p: Json) => `${p.path} (${p.sessions})`).join(', ') || 'none'}.`,
          `4-week trend (sessions / quote starts / real leads): ${trendLine}.`,
        ].join('\n');

        console.log('[WEEKLY-REPORT] Calling AI gateway for summary...');
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              {
                role: 'system',
                content: `You're a blunt, experienced marine dealership employee giving your boss the weekly website report. Be direct, conversational, no corporate speak. No bullet points or headers, just talk naturally like you're sitting across the desk. Never use em dashes. Point out problems honestly. Compare against the 4-week trend instead of treating this week as the first week. Give actionable suggestions. Keep it under 200 words total. Structure your response as:
1) A 3-4 sentence plain-English summary of what happened this week
2) 2-3 blunt observations about what's working and what isn't
3) 2-3 specific, actionable improvement suggestions`
              },
              {
                role: 'user',
                content: `Here are this week's cleaned website metrics for Harris Boat Works / Mercury Repower:\n\n${metricsSummary}`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiText = aiData.choices?.[0]?.message?.content || '';
          if (aiText) {
            const escapedText = esc(aiText).replace(/\n/g, '<br>');
            aiSummaryHtml = `
              <div style="background:linear-gradient(135deg,#fefce8,#fef9c3);border:2px solid #eab308;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <h2 style="margin:0 0 12px;font-size:16px;color:#854d0e;">🧠 AI Weekly Debrief</h2>
                <p style="margin:0;font-size:14px;color:#713f12;line-height:1.7;">${escapedText}</p>
              </div>`;
            const sentences = aiText.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim());
            aiSummarySms = `🧠 AI TAKE: ${sentences.slice(0, 3).join(' ')}`;
          }
        } else {
          const errText = await aiResponse.text();
          console.error('[WEEKLY-REPORT] AI gateway error:', aiResponse.status, errText);
        }
      } else {
        console.log('[WEEKLY-REPORT] LOVABLE_API_KEY not set, skipping AI summary');
      }
    } catch (aiErr) {
      console.error('[WEEKLY-REPORT] AI summary failed (non-fatal):', aiErr);
    }

    // ============ SMS REPORT ============
    const smsLines = [
      `📊 Weekly Report (${formatDateDisplay(weekAgo)} - ${formatDateDisplay(now)})`,
    ];

    if (aiSummarySms) smsLines.push(``, aiSummarySms);

    smsLines.push(
      ``,
      `📈 QUOTES:`,
      `• ${totalQuotes} real quotes ${quoteTrend} (${quoteDiff >= 0 ? '+' : ''}${quoteDiff} vs last wk)`,
      `• Total: ${fmt(totalValue)} | Avg: ${fmt(avgValue)}`,
      `• 🤖 AI-agent quotes: ${agentQuotes} (excluded from totals)`,
    );

    smsLines.push(`\n🎯 REAL LEADS THIS WEEK: ${totalRealLeads}`);
    for (const l of leadCounts.filter(l => l.rows.length > 0)) {
      smsLines.push(`• ${l.label}: ${l.rows.length}`);
    }
    if (totalRealLeads === 0) smsLines.push(`• Nothing came in. Nobody left contact info.`);

    smsLines.push(`\n💸 SAW THE PRICE, WALKED: ${walked.count || 0}`);
    for (const w of (walked.motors || []).slice(0, 3)) {
      smsLines.push(`• ${w.model}: ${w.count}`);
    }
    smsLines.push(`• Anonymous PDF downloads: ${walked.anonymous_pdf_downloads || 0}`);

    if (topModels.length > 0) {
      smsLines.push(`\n🏆 TOP QUOTED: ${topModels.map(t => `${t.model} (${t.count})`).join(', ')}`);
    }

    if (topViewedMotors.length > 0) {
      smsLines.push(`\n👀 MOST VIEWED MOTORS:`);
      for (const v of topViewedMotors.slice(0, 5)) smsLines.push(`• ${v.model}: ${v.views} views`);
    }

    if (topAbandonedMotors.length > 0) {
      smsLines.push(`\n🚫 MOST ABANDONED:`);
      for (const a of topAbandonedMotors.slice(0, 3)) smsLines.push(`• ${a.model}: ${a.count}x abandoned (avg ${fmt(a.avg_value)})`);
    }

    smsLines.push(`\n📱 VISITORS:`);
    smsLines.push(`• ${sessions} real sessions`);
    smsLines.push(`• Devices: 📱${devices.mobile || 0} 💻${devices.desktop || 0} 📲${devices.tablet || 0}`);

    if (topPages.length > 0) {
      smsLines.push(`\n📄 TOP PAGES:`);
      for (const p of topPages.slice(0, 5)) smsLines.push(`• ${p.page}: ${p.views} views`);
    }

    if (topExitPages.length > 0) {
      smsLines.push(`\n🚪 WHERE PEOPLE LEAVE:`);
      for (const p of topExitPages.slice(0, 3)) smsLines.push(`• ${p.page}: ${p.exits} exits`);
    }

    if (trafficSources.length > 0) {
      smsLines.push(`\n🌐 TRAFFIC: ${trafficSources.slice(0, 5).map(s => `${s.source}(${s.sessions})`).join(', ')}`);
    }

    smsLines.push(`\n📝 BLOG → BUILDER: ${blogStarted}/${blogSessions} blog sessions started a quote (${blogPct}%)`);
    for (const p of (blog.top_posts || []).slice(0, 5)) smsLines.push(`• ${p.path}: ${p.sessions}`);

    smsLines.push(`\n🔄 FUNNEL: ${funnelSteps.map(s => `${s.count} ${s.label.toLowerCase()}`).join(' → ')}`);
    if (biggestDrop.pct > 0) {
      smsLines.push(`⚠️ BIGGEST DROP: ${biggestDrop.pct}% lost between ${biggestDrop.from} → ${biggestDrop.to}`);
    }

    smsLines.push(`\n📅 4-WEEK TREND (sessions/starts/leads): ${trend.map(t => `${t.real_sessions}/${t.real_quote_starts}/${t.real_leads}`).join(' → ')}`);
    smsLines.push(`\n🧪 Test sessions excluded: ${testExcluded}`);

    const smsBody = smsLines.join('\n');
    console.log('[WEEKLY-REPORT] SMS body:', smsBody);

    let smsSent = false;
    if (adminPhone && !dryRun) {
      try {
        const { error: smsError } = await supabase.functions.invoke('send-sms', {
          body: { to: adminPhone, message: smsBody, messageType: 'manual' },
        });
        if (smsError) console.error('[WEEKLY-REPORT] SMS error:', smsError);
        else { smsSent = true; console.log('[WEEKLY-REPORT] SMS sent successfully'); }
      } catch (e) { console.error('[WEEKLY-REPORT] SMS send failed:', e); }
    }

    // ============ EMAIL REPORT (rich HTML) ============
    const leadRowsHtml = leadCounts
      .filter(l => l.rows.length > 0)
      .map(l => l.rows.map((r: Json) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(l.label)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(r.name || '—'))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(r.email || '—'))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(r.motor || '—'))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${r.value ? fmt(Number(r.value)) : '—'}</td>
        </tr>`).join('')).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#007DC5,#1e40af);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">📊 Weekly Site &amp; Quote Report</h1>
      <p style="color:#e0f2fe;margin:8px 0 0;font-size:14px;">${formatDateDisplay(weekAgo)} – ${formatDateDisplay(now)}</p>
    </div>

    <div style="padding:32px;">
      ${aiSummaryHtml}
      <!-- Summary Cards -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <div style="flex:1;min-width:120px;background:#f0f9ff;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#007DC5;">${sessions}</div>
          <div style="font-size:12px;color:#6b7280;">Real Visitors</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#16a34a;">${totalRealLeads}</div>
          <div style="font-size:12px;color:#6b7280;">Real Leads</div>
        </div>
        <div style="flex:1;min-width:120px;background:#fef3c7;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#d97706;">${totalQuotes}</div>
          <div style="font-size:12px;color:#6b7280;">Real Quotes ${quoteTrend}${quoteDiff >= 0 ? '+' : ''}${quoteDiff}</div>
        </div>
        <div style="flex:1;min-width:120px;background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#dc2626;">${walked.count || 0}</div>
          <div style="font-size:12px;color:#6b7280;">Saw Price, Walked</div>
        </div>
      </div>

      <!-- Real Leads -->
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🎯 Real Leads This Week (${totalRealLeads})</h2>
      ${totalRealLeads > 0 ? `
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f0fdf4;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Source</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Name</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Email / Phone</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Motor</th>
          <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Value</th>
        </tr></thead>
        <tbody>${leadRowsHtml}</tbody>
      </table>` : `<p style="font-size:14px;color:#6b7280;margin:0;">No real leads came in this week.</p>`}

      <!-- AI agent quotes -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:24px 0;">
        <h3 style="margin:0 0 6px;font-size:14px;color:#374151;">🤖 AI-agent quotes (excluded from totals)</h3>
        <p style="margin:0;font-size:13px;color:#6b7280;">${agentQuotes} quotes worth ${fmt(agentValue)} were generated through the public agent quote API. These are not customers.</p>
      </div>

      <!-- Saw the price, walked -->
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">💸 Saw the Price, Walked</h2>
      <div style="background:#fef2f2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:13px;color:#374151;"><strong>${walked.count || 0}</strong> real sessions reached the price summary and never left contact info.</p>
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">${(walked.motors || []).map((w: Json) => `${esc(String(w.model))} (${w.count})`).join(', ') || 'No motors recorded'}</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">Anonymous PDF downloads: <strong>${walked.anonymous_pdf_downloads || 0}</strong></p>
      </div>

      <!-- Blog to builder -->
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">📝 Blog → Builder</h2>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#374151;">${blogStarted} of ${blogSessions} blog sessions went on to start a quote (${blogPct}%).</p>
        ${(blog.top_posts || []).map((p: Json) => `<div style="font-size:13px;color:#6b7280;">${esc(String(p.path))}: <strong>${p.sessions}</strong></div>`).join('') || '<div style="font-size:13px;color:#6b7280;">No blog post sent anyone into the builder this week.</div>'}
      </div>

      <!-- 4-week trend -->
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">📅 4-Week Trend</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        <thead><tr style="background:#f0f9ff;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Week of</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Real sessions</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Quote starts</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Real leads</th>
        </tr></thead>
        <tbody>${trend.map((t: Json) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${formatDateDisplay(new Date(t.start))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${t.real_sessions}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${t.real_quote_starts}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;">${t.real_leads}</td>
          </tr>`).join('')}</tbody>
      </table>

      <!-- Device Breakdown -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 8px;font-size:14px;color:#374151;">📱 Device Breakdown</h3>
        <p style="margin:0;font-size:13px;color:#6b7280;">
          Mobile: <strong>${devices.mobile || 0}</strong> &nbsp;|&nbsp;
          Desktop: <strong>${devices.desktop || 0}</strong> &nbsp;|&nbsp;
          Tablet: <strong>${devices.tablet || 0}</strong>
        </p>
      </div>

      <!-- Most Viewed Motors -->
      ${topViewedMotors.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🔍 Motors People Are Configuring</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f0f9ff;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Motor</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">HP</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Sessions</th>
        </tr></thead>
        <tbody>${topViewedMotors.map((v: Json) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(v.model))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${v.hp || '—'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;">${v.views}</td>
          </tr>`).join('')}</tbody>
      </table>` : ''}

      <!-- Top Quoted Models -->
      ${topModels.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🏆 Top Quoted (real) Models</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f0fdf4;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Model</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Quotes</th>
        </tr></thead>
        <tbody>${topModels.map((t: Json) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(t.model))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;">${t.count}</td>
          </tr>`).join('')}</tbody>
      </table>` : ''}

      <!-- Conversion Funnel (mandatory steps only) -->
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🔄 Conversion Funnel (required steps only)</h2>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;">
        ${[{ label: 'Real Visitors', count: sessions }, ...funnelSteps.map(s => ({ label: s.label === 'Motor' ? 'Selected Motor' : s.label === 'Path' ? 'Chose Purchase Path' : s.label === 'Summary' ? 'Saw the Price' : s.label === 'Contact' ? 'Gave Contact Info' : 'Deposit Paid', count: s.count }))]
          .map((step, i, arr) => {
            const pct = sessions > 0 ? Math.round((step.count / sessions) * 100) : 0;
            const dropFromPrev = i > 0 && arr[i - 1].count > 0
              ? Math.round(((arr[i - 1].count - step.count) / arr[i - 1].count) * 100) : 0;
            const dropLabel = i > 0 && dropFromPrev > 0
              ? `<span style="color:#9ca3af;font-size:11px;margin-left:6px;">↓${dropFromPrev}%</span>` : '';
            return `
            <div style="display:flex;align-items:center;margin-bottom:6px;">
              <div style="width:170px;font-size:13px;color:#374151;">${step.label}${dropLabel}</div>
              <div style="flex:1;background:#e5e7eb;border-radius:4px;height:20px;margin:0 12px;">
                <div style="background:linear-gradient(90deg,#007DC5,#3b82f6);height:100%;border-radius:4px;width:${pct}%;"></div>
              </div>
              <div style="font-size:13px;color:#374151;font-weight:600;min-width:60px;text-align:right;">${step.count} (${pct}%)</div>
            </div>`;
          }).join('')}
        ${biggestDrop.pct > 0 ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;color:#dc2626;">🔥 Biggest drop: <strong>${biggestDrop.from} → ${biggestDrop.to}</strong> (${biggestDrop.pct}%)</div>` : ''}
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280;">
          Optional steps used: ${Object.entries(optionalSteps).map(([k, v]) => `${esc(k.replace(/_/g, ' '))}: ${v}`).join(' | ')}
        </div>
      </div>

      <!-- Most Visited Pages -->
      ${topPages.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">📄 Most Visited Pages</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Page</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Views</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Avg Time</th>
        </tr></thead>
        <tbody>${topPages.map((p: Json) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(p.page))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.views}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${p.avg_seconds ? formatTime(p.avg_seconds) : '—'}</td>
          </tr>`).join('')}</tbody>
      </table>` : ''}

      <!-- Exit Pages -->
      ${topExitPages.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🚪 Where People Leave the Site</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#fef2f2;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Page</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Exits</th>
        </tr></thead>
        <tbody>${topExitPages.map((p: Json) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(p.page))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:600;">${p.exits}</td>
          </tr>`).join('')}</tbody>
      </table>` : ''}

      <!-- Traffic Sources -->
      ${trafficSources.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🌐 Traffic Sources</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#ecfdf5;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Source</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Sessions</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">% of Traffic</th>
        </tr></thead>
        <tbody>${trafficSources.map((s: Json) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(s.source))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${s.sessions}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${sessions > 0 ? Math.round((s.sessions / sessions) * 100) : 0}%</td>
          </tr>`).join('')}</tbody>
      </table>` : ''}

      <!-- Hot Leads -->
      ${hotLeads.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🔥 Hot Leads Requiring Follow-Up</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#fef3c7;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Name</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Email</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Value</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Score</th>
        </tr></thead>
        <tbody>${hotLeads.map((q: Json) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(q.name || ''))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(String(q.email || ''))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${fmt(Number(q.value || 0))}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${q.score}</td>
          </tr>`).join('')}</tbody>
      </table>` : ''}

      <!-- Week-over-Week -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-top:24px;">
        <h3 style="margin:0 0 8px;font-size:14px;color:#374151;">📈 Week-over-Week (real quotes only)</h3>
        <p style="margin:4px 0;font-size:13px;color:#6b7280;">
          Quotes: ${prevTotalQuotes} → ${totalQuotes} (${quoteDiff >= 0 ? '+' : ''}${quoteDiff})<br>
          Value: ${fmt(prevTotalValue)} → ${fmt(totalValue)} (${valueDiff >= 0 ? '+' : ''}${fmt(valueDiff)}) ${valueTrend}
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px;">
        <a href="${APP_URL}/admin" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#007DC5,#1e40af);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Full Dashboard →</a>
      </div>
    </div>

    <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        Test sessions excluded: ${testExcluded} &nbsp;|&nbsp; AI-agent quotes excluded: ${agentQuotes}<br>
        Automated weekly report from Harris Boat Works Quote System<br>
        <a href="${APP_URL}" style="color:#007DC5;text-decoration:none;">mercuryrepower.ca</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    let emailSent = false;
    if (!dryRun) {
      const resend = new Resend(resendApiKey);
      const emailResponse = await resend.emails.send({
        from: "Mercury Quotes <noreply@mercuryrepower.ca>",
        to: [ADMIN_EMAIL],
        cc: REPORT_CC,
        subject: `📊 Weekly Report: ${sessions} visitors, ${totalRealLeads} real leads, ${totalQuotes} quotes (${formatDateDisplay(weekAgo)} - ${formatDateDisplay(now)})`,
        html: emailHtml,
      });
      emailSent = true;
      console.log('[WEEKLY-REPORT] Email sent:', emailResponse);
    } else {
      console.log('[WEEKLY-REPORT] Dry run: no SMS, no email sent');
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        smsText: smsBody,
        report: {
          period: `${formatDate(weekAgo)} to ${formatDate(now)}`,
          sessions,
          testSessionsExcluded: testExcluded,
          realLeads: totalRealLeads,
          leadsBySource: Object.fromEntries(leadCounts.map(l => [l.key, l.rows.length])),
          realQuotes: totalQuotes,
          realQuoteValue: totalValue,
          agentQuotes,
          agentQuoteValue: agentValue,
          sawPriceWalked: walked.count || 0,
          anonymousPdfDownloads: walked.anonymous_pdf_downloads || 0,
          funnel,
          optionalSteps,
          blogToBuilder: blog,
          trend,
          smsSent,
          emailSent,
        },
        metrics: m,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[WEEKLY-REPORT] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
