import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = "info@harrisboatworks.ca";
const APP_URL = "https://mercuryrepower.ca";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const adminPhone = Deno.env.get('ADMIN_PHONE');

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatDateDisplay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

    console.log(`[WEEKLY-REPORT] Generating report for ${formatDate(weekAgo)} to ${formatDate(now)}`);

    // Fetch all data in parallel
    const [quotesRes, prevQuotesRes, eventsRes] = await Promise.all([
      supabase.from('customer_quotes').select('*').gte('created_at', weekAgo.toISOString()).lte('created_at', now.toISOString()),
      supabase.from('customer_quotes').select('id, final_price').gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', weekAgo.toISOString()),
      supabase.from('quote_activity_events').select('*').gte('created_at', weekAgo.toISOString()).lte('created_at', now.toISOString()).order('created_at', { ascending: true }),
    ]);

    if (quotesRes.error) throw new Error(`Failed to fetch quotes: ${quotesRes.error.message}`);

    const quotes = quotesRes.data || [];
    const prevQuotes = prevQuotesRes.data || [];
    const events = eventsRes.data || [];

    // ============ PAGE VIEW ANALYTICS ============
    const pageViews = events.filter(e => e.event_type === 'page_view');
    const pageExits = events.filter(e => e.event_type === 'page_exit');
    const siteExits = events.filter(e => e.event_type === 'site_exit');

    // Most visited pages
    const pageViewCounts: Record<string, number> = {};
    for (const e of pageViews) {
      const title = e.page_title || e.page_path || 'Unknown';
      pageViewCounts[title] = (pageViewCounts[title] || 0) + 1;
    }
    const topPages = Object.entries(pageViewCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Average time on each page (from page_exit events)
    const pageTimeAccum: Record<string, { total: number; count: number }> = {};
    for (const e of [...pageExits, ...siteExits]) {
      if (e.time_on_page_seconds && e.time_on_page_seconds > 0) {
        const title = e.page_title || e.page_path || 'Unknown';
        if (!pageTimeAccum[title]) pageTimeAccum[title] = { total: 0, count: 0 };
        pageTimeAccum[title].total += e.time_on_page_seconds;
        pageTimeAccum[title].count++;
      }
    }
    const avgTimePerPage = Object.entries(pageTimeAccum)
      .map(([page, d]) => ({ page, avgSeconds: Math.round(d.total / d.count) }))
      .sort((a, b) => b.avgSeconds - a.avgSeconds)
      .slice(0, 10);

    // Exit pages — where people leave the site
    const exitPageCounts: Record<string, number> = {};
    for (const e of siteExits) {
      const title = e.page_title || e.page_path || 'Unknown';
      exitPageCounts[title] = (exitPageCounts[title] || 0) + 1;
    }
    const topExitPages = Object.entries(exitPageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // ============ MOTOR VIEWING ANALYTICS ============
    const motorSelectedEvents = events.filter(e => e.event_type === 'motor_selected');
    const abandonedEvents = events.filter(e => e.event_type === 'quote_abandoned');
    const optionsEvents = events.filter(e => e.event_type === 'options_configured');
    const purchasePathEvents = events.filter(e => e.event_type === 'purchase_path_chosen');
    const boatInfoEvents = events.filter(e => e.event_type === 'boat_info_completed');
    const tradeInEvents = events.filter(e => e.event_type === 'trade_in_entered');
    const installEvents = events.filter(e => e.event_type === 'installation_configured');
    const promoEvents = events.filter(e => e.event_type === 'promo_selected');
    const packageEvents = events.filter(e => e.event_type === 'package_selected');
    const summaryEvents = events.filter(e => e.event_type === 'summary_viewed');
    const submittedEvents = events.filter(e => e.event_type === 'quote_submitted');
    const financingEvents = events.filter(e => e.event_type === 'financing_calculated');

    // Which motors people are looking at (from motor_selected events)
    const motorViewCounts: Record<string, { count: number; hp: number | null }> = {};
    for (const e of motorSelectedEvents) {
      const model = e.motor_model || 'Unknown';
      if (!motorViewCounts[model]) motorViewCounts[model] = { count: 0, hp: e.motor_hp };
      motorViewCounts[model].count++;
    }
    const topViewedMotors = Object.entries(motorViewCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    // Motors that got abandoned (started but didn't save)
    const motorAbandonCounts: Record<string, { count: number; avgValue: number; values: number[] }> = {};
    for (const e of abandonedEvents) {
      const model = e.motor_model || 'Unknown';
      if (!motorAbandonCounts[model]) motorAbandonCounts[model] = { count: 0, avgValue: 0, values: [] };
      motorAbandonCounts[model].count++;
      if (e.quote_value) motorAbandonCounts[model].values.push(e.quote_value);
    }
    for (const [, d] of Object.entries(motorAbandonCounts)) {
      d.avgValue = d.values.length > 0 ? d.values.reduce((s, v) => s + v, 0) / d.values.length : 0;
    }
    const topAbandonedMotors = Object.entries(motorAbandonCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    // Abandonment stage breakdown
    const abandonStages: Record<string, number> = {};
    for (const e of abandonedEvents) {
      const step = (e.event_data as any)?.step || 'unknown';
      const label = typeof step === 'number' ? `Step ${step}` : String(step);
      abandonStages[label] = (abandonStages[label] || 0) + 1;
    }

    // ============ DEVICE BREAKDOWN ============
    const deviceCounts: Record<string, number> = { mobile: 0, tablet: 0, desktop: 0 };
    const seenSessionDevices = new Set<string>();
    for (const e of events) {
      if (seenSessionDevices.has(e.session_id)) continue;
      seenSessionDevices.add(e.session_id);
      const dt = e.device_type || 'unknown';
      deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;
    }

    // ============ SESSION / FUNNEL ============
    const uniqueSessions = new Set(events.map(e => e.session_id)).size;
    const sessionsWithMotor = new Set(motorSelectedEvents.map(e => e.session_id)).size;
    const sessionsWithOptions = new Set(optionsEvents.map(e => e.session_id)).size;
    const sessionsWithPurchasePath = new Set(purchasePathEvents.map(e => e.session_id)).size;
    const sessionsWithBoatInfo = new Set(boatInfoEvents.map(e => e.session_id)).size;
    const sessionsWithTradeIn = new Set(tradeInEvents.map(e => e.session_id)).size;
    const sessionsWithInstall = new Set(installEvents.map(e => e.session_id)).size;
    const sessionsWithPromo = new Set(promoEvents.map(e => e.session_id)).size;
    const sessionsWithPackage = new Set(packageEvents.map(e => e.session_id)).size;
    const sessionsWithSummary = new Set(summaryEvents.map(e => e.session_id)).size;
    const sessionsWithSubmit = new Set(submittedEvents.map(e => e.session_id)).size;
    const sessionsWithFinancing = new Set(financingEvents.map(e => e.session_id)).size;

    const avgUnsavedValue = (() => {
      const withVal = abandonedEvents.filter(e => e.quote_value && e.quote_value > 0);
      return withVal.length > 0 ? withVal.reduce((s, e) => s + (e.quote_value || 0), 0) / withVal.length : 0;
    })();

    // ============ TRAFFIC SOURCES (UTM) ============
    const trafficSources: Record<string, number> = {};
    const campaignPerformance: Record<string, { sessions: number; quotes: number }> = {};
    const seenSessions = new Set<string>();

    for (const e of events) {
      if (seenSessions.has(e.session_id)) continue;
      seenSessions.add(e.session_id);
      let source = 'direct';
      if (e.utm_source) {
        source = e.utm_source;
      } else if (e.referrer) {
        try { source = new URL(e.referrer).hostname.replace('www.', ''); } catch { source = 'referral'; }
      }
      trafficSources[source] = (trafficSources[source] || 0) + 1;
      const campaign = e.utm_campaign;
      if (campaign) {
        if (!campaignPerformance[campaign]) campaignPerformance[campaign] = { sessions: 0, quotes: 0 };
        campaignPerformance[campaign].sessions++;
      }
    }
    for (const q of quotes) {
      const qd = q.quote_data as any;
      const campaign = qd?.utm_campaign || q.lead_source;
      if (campaign && campaignPerformance[campaign]) campaignPerformance[campaign].quotes++;
    }
    const topTrafficSources = Object.entries(trafficSources).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const topCampaigns = Object.entries(campaignPerformance).sort((a, b) => b[1].sessions - a[1].sessions).slice(0, 5);

    // ============ QUOTE METRICS ============
    const totalQuotes = quotes.length;
    const prevTotalQuotes = prevQuotes.length;
    const totalValue = quotes.reduce((sum, q) => sum + (q.final_price || 0), 0);
    const prevTotalValue = prevQuotes.reduce((sum, q) => sum + (q.final_price || 0), 0);
    const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;
    const hotLeads = quotes.filter(q => (q.lead_score || 0) >= 70);

    const modelCounts: Record<string, number> = {};
    for (const q of quotes) {
      const qd = q.quote_data as any;
      const model = qd?.motorModel || qd?.motor_model || qd?.model || 'Unknown';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    }
    const topModels = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const quoteTrend = totalQuotes >= prevTotalQuotes ? '↑' : '↓';
    const valueTrend = totalValue >= prevTotalValue ? '↑' : '↓';
    const quoteDiff = totalQuotes - prevTotalQuotes;
    const valueDiff = totalValue - prevTotalValue;
    const conversionRate = uniqueSessions > 0 ? ((totalQuotes / uniqueSessions) * 100).toFixed(1) : '0';

    // ============ AI SUMMARY ============
    let aiSummaryHtml = '';
    let aiSummarySms = '';
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        // Find biggest drop-off for AI context
        const aiFunnelSteps = [
          { label: 'Motor Selection', count: sessionsWithMotor },
          { label: 'Options Config', count: sessionsWithOptions },
          { label: 'Purchase Path', count: sessionsWithPurchasePath },
          { label: 'Boat Info', count: sessionsWithBoatInfo },
          { label: 'Trade-In', count: sessionsWithTradeIn },
          { label: 'Installation', count: sessionsWithInstall },
          { label: 'Promo Selection', count: sessionsWithPromo },
          { label: 'Package Selection', count: sessionsWithPackage },
          { label: 'Summary Page', count: sessionsWithSummary },
          { label: 'Quote Submitted', count: sessionsWithSubmit },
        ];
        let worstDrop = { from: '', to: '', pct: 0 };
        for (let i = 1; i < aiFunnelSteps.length; i++) {
          const prev = aiFunnelSteps[i - 1];
          if (prev.count > 0) {
            const dropPct = Math.round(((prev.count - aiFunnelSteps[i].count) / prev.count) * 100);
            if (dropPct > worstDrop.pct) worstDrop = { from: prev.label, to: aiFunnelSteps[i].label, pct: dropPct };
          }
        }

        const metricsSummary = [
          `This week: ${uniqueSessions} visitors, ${totalQuotes} quotes saved (${conversionRate}% conversion).`,
          `Last week: ${prevTotalQuotes} quotes, ${fmt(prevTotalValue)} value. Change: ${quoteDiff >= 0 ? '+' : ''}${quoteDiff} quotes, ${valueDiff >= 0 ? '+' : ''}${fmt(valueDiff)} value.`,
          `Average quote value: ${fmt(avgValue)}. Hot leads (score 70+): ${hotLeads.length}.`,
          `Biggest funnel drop-off: ${worstDrop.pct}% lost between ${worstDrop.from} → ${worstDrop.to}.`,
          `Top viewed motors: ${topViewedMotors.slice(0, 3).map(([m, d]) => `${m} (${d.count} views)`).join(', ') || 'none'}.`,
          `Top abandoned motors: ${topAbandonedMotors.slice(0, 3).map(([m, d]) => `${m} (${d.count}x abandoned, avg ${fmt(d.avgValue)})`).join(', ') || 'none'}.`,
          `Device split: Mobile ${deviceCounts.mobile || 0}, Desktop ${deviceCounts.desktop || 0}, Tablet ${deviceCounts.tablet || 0}.`,
          `Top exit pages: ${topExitPages.slice(0, 3).map(([p, c]) => `${p} (${c} exits)`).join(', ') || 'none'}.`,
          `Funnel: ${aiFunnelSteps.map(s => `${s.label}: ${s.count}`).join(' → ')}.`,
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
                content: `You're a blunt, experienced marine dealership employee giving your boss the weekly website report. Be direct, conversational, no corporate speak. No bullet points or headers — just talk naturally like you're sitting across the desk. Point out problems honestly. Give actionable suggestions. Keep it under 200 words total. Structure your response as:
1) A 3-4 sentence plain-English summary of what happened this week
2) 2-3 blunt observations about what's working and what isn't
3) 2-3 specific, actionable improvement suggestions`
              },
              {
                role: 'user',
                content: `Here are this week's website metrics for Harris Boat Works / Mercury Repower:\n\n${metricsSummary}`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiText = aiData.choices?.[0]?.message?.content || '';
          if (aiText) {
            console.log('[WEEKLY-REPORT] AI summary generated successfully');
            // Email version - styled box
            const escapedText = aiText.replace(/\n/g, '<br>');
            aiSummaryHtml = `
              <div style="background:linear-gradient(135deg,#fefce8,#fef9c3);border:2px solid #eab308;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <h2 style="margin:0 0 12px;font-size:16px;color:#854d0e;">🧠 AI Weekly Debrief</h2>
                <p style="margin:0;font-size:14px;color:#713f12;line-height:1.7;">${escapedText}</p>
              </div>`;
            // SMS version - condensed to first 2-3 sentences
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

    if (aiSummarySms) {
      smsLines.push(``, aiSummarySms);
    }

    smsLines.push(
      ``,
      `📈 QUOTES:`,
      `• ${totalQuotes} new quotes ${quoteTrend} (${quoteDiff >= 0 ? '+' : ''}${quoteDiff} vs last wk)`,
      `• Total: ${fmt(totalValue)} | Avg: ${fmt(avgValue)}`,
      `• ${hotLeads.length} hot leads (score 70+)`,
    );

    if (topModels.length > 0) {
      smsLines.push(`\n🏆 TOP QUOTED: ${topModels.map(([m, c]) => `${m} (${c})`).join(', ')}`);
    }

    if (topViewedMotors.length > 0) {
      smsLines.push(`\n👀 MOST VIEWED MOTORS:`);
      for (const [model, data] of topViewedMotors.slice(0, 5)) {
        smsLines.push(`• ${model}: ${data.count} views`);
      }
    }

    if (topAbandonedMotors.length > 0) {
      smsLines.push(`\n🚫 MOST ABANDONED:`);
      for (const [model, data] of topAbandonedMotors.slice(0, 3)) {
        smsLines.push(`• ${model}: ${data.count}x abandoned (avg ${fmt(data.avgValue)})`);
      }
    }

    smsLines.push(`\n📱 VISITORS:`);
    smsLines.push(`• ${uniqueSessions} total sessions`);
    smsLines.push(`• Devices: 📱${deviceCounts.mobile || 0} 💻${deviceCounts.desktop || 0} 📲${deviceCounts.tablet || 0}`);

    if (topPages.length > 0) {
      smsLines.push(`\n📄 TOP PAGES:`);
      for (const [page, count] of topPages.slice(0, 5)) {
        smsLines.push(`• ${page}: ${count} views`);
      }
    }

    if (topExitPages.length > 0) {
      smsLines.push(`\n🚪 WHERE PEOPLE LEAVE:`);
      for (const [page, count] of topExitPages.slice(0, 3)) {
        smsLines.push(`• ${page}: ${count} exits`);
      }
    }

    if (topTrafficSources.length > 0) {
      smsLines.push(`\n🌐 TRAFFIC: ${topTrafficSources.slice(0, 5).map(([s, c]) => `${s}(${c})`).join(', ')}`);
    }

    smsLines.push(`\n🔄 FUNNEL: ${sessionsWithMotor} motor → ${sessionsWithOptions} options → ${sessionsWithPurchasePath} path → ${sessionsWithBoatInfo} boat → ${sessionsWithTradeIn} trade-in → ${sessionsWithPromo} promo → ${sessionsWithSummary} summary → ${sessionsWithSubmit} submitted`);

    // Find biggest drop-off for SMS
    const funnelSteps = [
      { label: 'Motor', count: sessionsWithMotor },
      { label: 'Options', count: sessionsWithOptions },
      { label: 'Path', count: sessionsWithPurchasePath },
      { label: 'Boat Info', count: sessionsWithBoatInfo },
      { label: 'Trade-In', count: sessionsWithTradeIn },
      { label: 'Promo', count: sessionsWithPromo },
      { label: 'Summary', count: sessionsWithSummary },
      { label: 'Submitted', count: sessionsWithSubmit },
    ];
    let biggestDrop = { from: '', to: '', pct: 0 };
    for (let i = 1; i < funnelSteps.length; i++) {
      const prev = funnelSteps[i - 1];
      if (prev.count > 0) {
        const dropPct = Math.round(((prev.count - funnelSteps[i].count) / prev.count) * 100);
        if (dropPct > biggestDrop.pct) biggestDrop = { from: prev.label, to: funnelSteps[i].label, pct: dropPct };
      }
    }
    if (biggestDrop.pct > 0) {
      smsLines.push(`⚠️ BIGGEST DROP: ${biggestDrop.pct}% lost between ${biggestDrop.from} → ${biggestDrop.to}`);
    }

    const smsBody = smsLines.join('\n');
    console.log('[WEEKLY-REPORT] SMS body:', smsBody);

    if (adminPhone) {
      try {
        const { error: smsError } = await supabase.functions.invoke('send-sms', {
          body: { to: adminPhone, message: smsBody, messageType: 'manual' },
        });
        if (smsError) console.error('[WEEKLY-REPORT] SMS error:', smsError);
        else console.log('[WEEKLY-REPORT] SMS sent successfully');
      } catch (e) { console.error('[WEEKLY-REPORT] SMS send failed:', e); }
    }

    // ============ EMAIL REPORT (rich HTML) ============
    const formatTime = (s: number) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:680px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#007DC5,#1e40af);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">📊 Weekly Site & Quote Report</h1>
      <p style="color:#e0f2fe;margin:8px 0 0;font-size:14px;">${formatDateDisplay(weekAgo)} – ${formatDateDisplay(now)}</p>
    </div>

    <div style="padding:32px;">
      ${aiSummaryHtml}
      <!-- Summary Cards -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <div style="flex:1;min-width:120px;background:#f0f9ff;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#007DC5;">${uniqueSessions}</div>
          <div style="font-size:12px;color:#6b7280;">Visitors</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#16a34a;">${totalQuotes}</div>
          <div style="font-size:12px;color:#6b7280;">Saved Quotes ${quoteTrend}${quoteDiff >= 0 ? '+' : ''}${quoteDiff}</div>
        </div>
        <div style="flex:1;min-width:120px;background:#fef3c7;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#d97706;">${fmt(totalValue)}</div>
          <div style="font-size:12px;color:#6b7280;">Total Value ${valueTrend}</div>
        </div>
        <div style="flex:1;min-width:120px;background:#fef2f2;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#dc2626;">${hotLeads.length}</div>
          <div style="font-size:12px;color:#6b7280;">Hot Leads (70+)</div>
        </div>
      </div>

      <!-- Device Breakdown -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;">
        <h3 style="margin:0 0 8px;font-size:14px;color:#374151;">📱 Device Breakdown</h3>
        <p style="margin:0;font-size:13px;color:#6b7280;">
          Mobile: <strong>${deviceCounts.mobile || 0}</strong> (${uniqueSessions > 0 ? Math.round(((deviceCounts.mobile || 0) / uniqueSessions) * 100) : 0}%) &nbsp;|&nbsp;
          Desktop: <strong>${deviceCounts.desktop || 0}</strong> (${uniqueSessions > 0 ? Math.round(((deviceCounts.desktop || 0) / uniqueSessions) * 100) : 0}%) &nbsp;|&nbsp;
          Tablet: <strong>${deviceCounts.tablet || 0}</strong> (${uniqueSessions > 0 ? Math.round(((deviceCounts.tablet || 0) / uniqueSessions) * 100) : 0}%)
        </p>
      </div>

      <!-- Most Viewed Motors -->
      ${topViewedMotors.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🔍 Motors People Are Looking At</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f0f9ff;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Motor</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">HP</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Views</th>
        </tr></thead>
        <tbody>${topViewedMotors.map(([model, data]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${model}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${data.hp || '—'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;">${data.count}</td>
          </tr>
        `).join('')}</tbody>
      </table>
      ` : ''}

      <!-- Abandoned Motors -->
      ${topAbandonedMotors.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🚫 Motors People Abandoned (didn't save quote)</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#fef2f2;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Motor</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Times Abandoned</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Avg Value</th>
        </tr></thead>
        <tbody>${topAbandonedMotors.map(([model, data]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${model}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:600;">${data.count}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${fmt(data.avgValue)}</td>
          </tr>
        `).join('')}</tbody>
      </table>
      ` : ''}

      <!-- Top Quoted Models -->
      ${topModels.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🏆 Top Quoted (saved) Models</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f0fdf4;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Model</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Quotes Saved</th>
        </tr></thead>
        <tbody>${topModels.map(([model, count]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${model}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;">${count}</td>
          </tr>
        `).join('')}</tbody>
      </table>
      ` : ''}

      <!-- Conversion Funnel -->
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🔄 Conversion Funnel</h2>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;">
        ${(() => {
          const steps = [
            { label: 'Site Visitors', count: uniqueSessions },
            { label: 'Selected Motor', count: sessionsWithMotor },
            { label: 'Added Options', count: sessionsWithOptions },
            { label: 'Chose Purchase Path', count: sessionsWithPurchasePath },
            { label: 'Entered Boat Info', count: sessionsWithBoatInfo },
            { label: 'Trade-In', count: sessionsWithTradeIn },
            { label: 'Installation Config', count: sessionsWithInstall },
            { label: 'Promo Selected', count: sessionsWithPromo },
            { label: 'Package Selected', count: sessionsWithPackage },
            { label: 'Viewed Summary', count: sessionsWithSummary },
            { label: 'Submitted Quote', count: sessionsWithSubmit },
          ];
          let biggestDropIdx = -1;
          let biggestDropPct = 0;
          for (let i = 1; i < steps.length; i++) {
            if (steps[i - 1].count > 0) {
              const drop = Math.round(((steps[i - 1].count - steps[i].count) / steps[i - 1].count) * 100);
              if (drop > biggestDropPct) { biggestDropPct = drop; biggestDropIdx = i; }
            }
          }
          return steps.map((step, i) => {
            const pct = uniqueSessions > 0 ? Math.round((step.count / uniqueSessions) * 100) : 0;
            const dropFromPrev = i > 0 && steps[i - 1].count > 0
              ? Math.round(((steps[i - 1].count - step.count) / steps[i - 1].count) * 100)
              : 0;
            const isBiggest = i === biggestDropIdx;
            const dropLabel = i > 0 && dropFromPrev > 0
              ? `<span style="color:${isBiggest ? '#dc2626;font-weight:700' : '#9ca3af'};font-size:11px;margin-left:6px;">↓${dropFromPrev}%${isBiggest ? ' ⚠️' : ''}</span>`
              : '';
            return `
            <div style="display:flex;align-items:center;margin-bottom:6px;">
              <div style="width:170px;font-size:13px;color:#374151;">${step.label}${dropLabel}</div>
              <div style="flex:1;background:#e5e7eb;border-radius:4px;height:20px;margin:0 12px;position:relative;">
                <div style="background:linear-gradient(90deg,#007DC5,#3b82f6);height:100%;border-radius:4px;width:${pct}%;min-width:${step.count > 0 ? '2' : '0'}px;"></div>
              </div>
              <div style="font-size:13px;color:#374151;font-weight:600;min-width:60px;text-align:right;">${step.count} (${pct}%)</div>
            </div>`;
          }).join('');
        })()}
        ${(() => {
          // Drop-off hotspots section
          const steps = [
            { label: 'Selected Motor', count: sessionsWithMotor },
            { label: 'Added Options', count: sessionsWithOptions },
            { label: 'Chose Purchase Path', count: sessionsWithPurchasePath },
            { label: 'Entered Boat Info', count: sessionsWithBoatInfo },
            { label: 'Trade-In', count: sessionsWithTradeIn },
            { label: 'Installation Config', count: sessionsWithInstall },
            { label: 'Promo Selected', count: sessionsWithPromo },
            { label: 'Package Selected', count: sessionsWithPackage },
            { label: 'Viewed Summary', count: sessionsWithSummary },
            { label: 'Submitted Quote', count: sessionsWithSubmit },
          ];
          const drops = [];
          for (let i = 1; i < steps.length; i++) {
            if (steps[i - 1].count > 0) {
              const lost = steps[i - 1].count - steps[i].count;
              const pct = Math.round((lost / steps[i - 1].count) * 100);
              if (lost > 0) drops.push({ from: steps[i - 1].label, to: steps[i].label, lost, pct });
            }
          }
          drops.sort((a, b) => b.lost - a.lost);
          const top3 = drops.slice(0, 3);
          if (top3.length === 0) return '';
          return `
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;">
            <h4 style="margin:0 0 8px;font-size:13px;color:#dc2626;">🔥 Drop-off Hotspots</h4>
            ${top3.map((d, i) => `
              <div style="font-size:13px;color:#374151;margin-bottom:4px;">
                ${i + 1}. <strong>${d.from} → ${d.to}</strong>: ${d.lost} people lost (${d.pct}% drop)
              </div>
            `).join('')}
          </div>`;
        })()}
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
        <tbody>${topPages.map(([page, count]) => {
          const timeData = avgTimePerPage.find(t => t.page === page);
          return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${page}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${count}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${timeData ? formatTime(timeData.avgSeconds) : '—'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
      ` : ''}

      <!-- Exit Pages -->
      ${topExitPages.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🚪 Where People Leave the Site</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#fef2f2;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Page</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Exits</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">% of All Exits</th>
        </tr></thead>
        <tbody>${topExitPages.map(([page, count]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${page}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:600;">${count}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${siteExits.length > 0 ? Math.round((count / siteExits.length) * 100) : 0}%</td>
          </tr>
        `).join('')}</tbody>
      </table>
      ` : ''}

      <!-- Traffic Sources -->
      ${topTrafficSources.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🌐 Traffic Sources</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#ecfdf5;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Source</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Sessions</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">% of Traffic</th>
        </tr></thead>
        <tbody>${topTrafficSources.map(([source, count]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${source}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${count}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${uniqueSessions > 0 ? Math.round((count / uniqueSessions) * 100) : 0}%</td>
          </tr>
        `).join('')}</tbody>
      </table>
      ` : ''}

      <!-- Ad Campaigns -->
      ${topCampaigns.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">📣 Ad Campaign Performance</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#fef3c7;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Campaign</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Visits</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Quotes</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Conv %</th>
        </tr></thead>
        <tbody>${topCampaigns.map(([campaign, data]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${campaign}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${data.sessions}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${data.quotes}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;">${data.sessions > 0 ? Math.round((data.quotes / data.sessions) * 100) : 0}%</td>
          </tr>
        `).join('')}</tbody>
      </table>
      ` : ''}

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
        <tbody>${hotLeads.map(q => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${q.customer_name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${q.customer_email}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${fmt(q.final_price)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${q.lead_score}</td>
          </tr>
        `).join('')}</tbody>
      </table>
      ` : ''}

      <!-- Week-over-Week -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-top:24px;">
        <h3 style="margin:0 0 8px;font-size:14px;color:#374151;">📈 Week-over-Week</h3>
        <p style="margin:4px 0;font-size:13px;color:#6b7280;">
          Quotes: ${prevTotalQuotes} → ${totalQuotes} (${quoteDiff >= 0 ? '+' : ''}${quoteDiff})<br>
          Value: ${fmt(prevTotalValue)} → ${fmt(totalValue)} (${valueDiff >= 0 ? '+' : ''}${fmt(valueDiff)})
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px;">
        <a href="${APP_URL}/admin" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#007DC5,#1e40af);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">View Full Dashboard →</a>
      </div>
    </div>

    <div style="background:#f9fafb;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        Automated weekly report from Harris Boat Works Quote System<br>
        <a href="${APP_URL}" style="color:#007DC5;text-decoration:none;">mercuryrepower.ca</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "Mercury Quotes <noreply@hbwsales.ca>",
      to: [ADMIN_EMAIL],
      cc: ["hbwbot00@gmail.com"],
      subject: `📊 Weekly Report: ${uniqueSessions} visitors, ${totalQuotes} quotes, ${fmt(totalValue)} (${formatDateDisplay(weekAgo)} - ${formatDateDisplay(now)})`,
      html: emailHtml,
    });

    console.log('[WEEKLY-REPORT] Email sent:', emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          period: `${formatDate(weekAgo)} to ${formatDate(now)}`,
          visitors: uniqueSessions,
          totalQuotes,
          totalValue,
          avgValue,
          hotLeads: hotLeads.length,
          topViewedMotors: topViewedMotors.slice(0, 5),
          topExitPages: topExitPages.slice(0, 5),
          deviceBreakdown: deviceCounts,
          smsSent: !!adminPhone,
          emailSent: true,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[WEEKLY-REPORT] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
