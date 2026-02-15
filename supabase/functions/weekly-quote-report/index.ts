import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = "info@harrisboatworks.ca";
const APP_URL = "https://mercury-quote-tool.lovable.app";

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

    // Calculate date range (last 7 days)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const formatDateDisplay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    console.log(`[WEEKLY-REPORT] Generating report for ${formatDate(weekAgo)} to ${formatDate(now)}`);

    // Fetch this week's quotes
    const { data: thisWeekQuotes, error: quotesError } = await supabase
      .from('customer_quotes')
      .select('*')
      .gte('created_at', weekAgo.toISOString())
      .lte('created_at', now.toISOString());

    if (quotesError) throw new Error(`Failed to fetch quotes: ${quotesError.message}`);

    // Fetch last week's quotes for comparison
    const { data: lastWeekQuotes } = await supabase
      .from('customer_quotes')
      .select('id, final_price')
      .gte('created_at', twoWeeksAgo.toISOString())
      .lt('created_at', weekAgo.toISOString());

    const quotes = thisWeekQuotes || [];
    const prevQuotes = lastWeekQuotes || [];

    // --- Fetch browsing activity from quote_activity_events ---
    const { data: activityEvents } = await supabase
      .from('quote_activity_events')
      .select('*')
      .gte('created_at', weekAgo.toISOString())
      .lte('created_at', now.toISOString());

    const events = activityEvents || [];

    // Browsing activity metrics
    const uniqueSessions = new Set(events.map(e => e.session_id)).size;
    const motorSelectedEvents = events.filter(e => e.event_type === 'motor_selected');
    const abandonedEvents = events.filter(e => e.event_type === 'quote_abandoned');
    const optionsEvents = events.filter(e => e.event_type === 'options_configured');
    const tradeInEvents = events.filter(e => e.event_type === 'trade_in_entered');
    const financingEvents = events.filter(e => e.event_type === 'financing_calculated');

    // Most-configured motors from activity
    const activityModelCounts: Record<string, number> = {};
    for (const e of motorSelectedEvents) {
      const model = e.motor_model || 'Unknown';
      activityModelCounts[model] = (activityModelCounts[model] || 0) + 1;
    }
    const topActivityModels = Object.entries(activityModelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Average unsaved quote value (from abandoned events with quote_value)
    const abandonedWithValue = abandonedEvents.filter(e => e.quote_value && e.quote_value > 0);
    const avgUnsavedValue = abandonedWithValue.length > 0
      ? abandonedWithValue.reduce((s, e) => s + (e.quote_value || 0), 0) / abandonedWithValue.length
      : 0;

    // Drop-off funnel
    const sessionsWithMotor = new Set(motorSelectedEvents.map(e => e.session_id)).size;
    const sessionsWithOptions = new Set(optionsEvents.map(e => e.session_id)).size;
    const sessionsWithTradeIn = new Set(tradeInEvents.map(e => e.session_id)).size;
    const sessionsWithFinancing = new Set(financingEvents.map(e => e.session_id)).size;

    // --- Compute metrics ---
    const totalQuotes = quotes.length;
    const prevTotalQuotes = prevQuotes.length;
    const totalValue = quotes.reduce((sum, q) => sum + (q.final_price || 0), 0);
    const prevTotalValue = prevQuotes.reduce((sum, q) => sum + (q.final_price || 0), 0);
    const avgValue = totalQuotes > 0 ? totalValue / totalQuotes : 0;

    // Hot leads (lead_score >= 70)
    const hotLeads = quotes.filter(q => (q.lead_score || 0) >= 70);

    // Top motor models from quote_data
    const modelCounts: Record<string, number> = {};
    for (const q of quotes) {
      const qd = q.quote_data as any;
      const model = qd?.motorModel || qd?.motor_model || qd?.model || 'Unknown';
      modelCounts[model] = (modelCounts[model] || 0) + 1;
    }
    const topModels = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Lead source breakdown
    const sourceCounts: Record<string, number> = {};
    for (const q of quotes) {
      const source = q.lead_source || 'Direct';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    }

    // Week-over-week arrows
    const quoteTrend = totalQuotes >= prevTotalQuotes ? '↑' : '↓';
    const valueTrend = totalValue >= prevTotalValue ? '↑' : '↓';
    const quoteDiff = totalQuotes - prevTotalQuotes;
    const valueDiff = totalValue - prevTotalValue;

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

    // --- SMS Report ---
    const smsLines = [
      `📊 Weekly Quote Report (${formatDateDisplay(weekAgo)} - ${formatDateDisplay(now)})`,
      `• ${totalQuotes} new quotes ${quoteTrend} (${quoteDiff >= 0 ? '+' : ''}${quoteDiff} vs last wk)`,
      `• Total value: ${fmt(totalValue)} ${valueTrend}`,
      topModels.length > 0
        ? `• Top: ${topModels.map(([m, c]) => `${m} (${c})`).join(', ')}`
        : '• No motor models quoted',
      `• ${hotLeads.length} hot lead${hotLeads.length !== 1 ? 's' : ''} (score 70+)`,
      `• Avg quote: ${fmt(avgValue)}`,
    ];
    // Browsing activity for SMS
    if (uniqueSessions > 0) {
      smsLines.push(`\n👀 Browsing Activity:`);
      smsLines.push(`• ${uniqueSessions} quote sessions (${totalQuotes} saved)`);
      if (topActivityModels.length > 0) {
        smsLines.push(`• Most viewed: ${topActivityModels.slice(0, 3).map(([m, c]) => `${m} (${c})`).join(', ')}`);
      }
      if (avgUnsavedValue > 0) {
        smsLines.push(`• Avg unsaved quote: ${fmt(avgUnsavedValue)}`);
      }
    }
    const smsBody = smsLines.join('\n');

    console.log('[WEEKLY-REPORT] SMS body:', smsBody);

    // Send SMS via existing send-sms function
    if (adminPhone) {
      try {
        const { error: smsError } = await supabase.functions.invoke('send-sms', {
          body: {
            to: adminPhone,
            message: smsBody,
            messageType: 'manual',
          },
        });
        if (smsError) console.error('[WEEKLY-REPORT] SMS error:', smsError);
        else console.log('[WEEKLY-REPORT] SMS sent successfully');
      } catch (e) {
        console.error('[WEEKLY-REPORT] SMS send failed:', e);
      }
    } else {
      console.warn('[WEEKLY-REPORT] No ADMIN_PHONE configured, skipping SMS');
    }

    // --- Email Report (richer HTML) ---
    const hotLeadRows = hotLeads.map(q => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${q.customer_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${q.customer_email}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${fmt(q.final_price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${q.lead_score}</td>
      </tr>
    `).join('');

    const topModelRows = topModels.map(([model, count]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${model}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${count}</td>
      </tr>
    `).join('');

    const sourceRows = Object.entries(sourceCounts).map(([source, count]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${source}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${count}</td>
      </tr>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#007DC5,#1e40af);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">📊 Weekly Quote Activity Report</h1>
      <p style="color:#e0f2fe;margin:8px 0 0;font-size:14px;">${formatDateDisplay(weekAgo)} – ${formatDateDisplay(now)}</p>
    </div>

    <div style="padding:32px;">
      <!-- Summary Cards -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
        <div style="flex:1;min-width:120px;background:#f0f9ff;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#007DC5;">${totalQuotes}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">New Quotes ${quoteTrend} ${quoteDiff >= 0 ? '+' : ''}${quoteDiff}</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#16a34a;">${fmt(totalValue)}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Total Value ${valueTrend}</div>
        </div>
        <div style="flex:1;min-width:120px;background:#fef3c7;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#d97706;">${hotLeads.length}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Hot Leads (70+)</div>
        </div>
        <div style="flex:1;min-width:120px;background:#f5f3ff;border-radius:8px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:700;color:#7c3aed;">${fmt(avgValue)}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Avg Quote Value</div>
        </div>
      </div>

      <!-- Top Models -->
      ${topModels.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🏆 Top Quoted Models</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Model</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Quotes</th>
        </tr></thead>
        <tbody>${topModelRows}</tbody>
      </table>
      ` : '<p style="color:#6b7280;">No quotes this week.</p>'}

      <!-- Hot Leads -->
      ${hotLeads.length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">🔥 Hot Leads Requiring Follow-Up</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#fef3c7;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Name</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Email</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Quote Value</th>
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Score</th>
        </tr></thead>
        <tbody>${hotLeadRows}</tbody>
      </table>
      ` : ''}

      <!-- Lead Sources -->
      ${Object.keys(sourceCounts).length > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">📍 Lead Sources</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Source</th>
          <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb;">Count</th>
        </tr></thead>
        <tbody>${sourceRows}</tbody>
      </table>
      ` : ''}

      <!-- Browsing Activity -->
      ${uniqueSessions > 0 ? `
      <h2 style="font-size:16px;color:#374151;margin:24px 0 12px;">👀 Browsing Activity</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
        <div style="flex:1;min-width:100px;background:#fff7ed;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#ea580c;">${uniqueSessions}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">Quote Sessions</div>
        </div>
        <div style="flex:1;min-width:100px;background:#f0f9ff;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#007DC5;">${totalQuotes}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">Saved Quotes</div>
        </div>
        <div style="flex:1;min-width:100px;background:#fef2f2;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#dc2626;">${abandonedEvents.length}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">Abandoned</div>
        </div>
        ${avgUnsavedValue > 0 ? `
        <div style="flex:1;min-width:100px;background:#f5f3ff;border-radius:8px;padding:14px;text-align:center;">
          <div style="font-size:24px;font-weight:700;color:#7c3aed;">${fmt(avgUnsavedValue)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">Avg Unsaved Value</div>
        </div>` : ''}
      </div>
      ${topActivityModels.length > 0 ? `
      <p style="font-size:13px;color:#6b7280;margin:8px 0;">
        <strong>Most configured:</strong> ${topActivityModels.map(([m, c]) => `${m} (${c})`).join(', ')}
      </p>` : ''}
      <p style="font-size:13px;color:#6b7280;margin:8px 0;">
        <strong>Funnel:</strong> ${sessionsWithMotor} selected motor → ${sessionsWithOptions} added options → ${sessionsWithTradeIn} entered trade-in → ${sessionsWithFinancing} calculated financing
      </p>
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
      subject: `📊 Weekly Quote Report: ${totalQuotes} quotes, ${fmt(totalValue)} total (${formatDateDisplay(weekAgo)} - ${formatDateDisplay(now)})`,
      html: emailHtml,
    });

    console.log('[WEEKLY-REPORT] Email sent:', emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        report: {
          period: `${formatDate(weekAgo)} to ${formatDate(now)}`,
          totalQuotes,
          totalValue,
          avgValue,
          hotLeads: hotLeads.length,
          topModels,
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
