// Daily scan for active promotions ending within 7 days.
// Sends an admin email digest so promos can be extended in time.
// Tracks "alerted" state in promotions.details JSONB to avoid daily duplicate spam
// (re-alerts only once per (promotion, end_date) pair).

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import { createBrandedEmailTemplate, createButtonHtml } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WARN_WITHIN_DAYS = 7;
const ALERT_KEY = 'expiry_alert_sent_for_end_date';

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'harrisboatworks@hotmail.com';
    const siteUrl = Deno.env.get('APP_URL') || 'https://mercuryrepower.ca';

    if (!resendKey) throw new Error('RESEND_API_KEY not configured');

    const supabase = createClient(supabaseUrl, serviceKey);
    const resend = new Resend(resendKey);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setUTCDate(cutoff.getUTCDate() + WARN_WITHIN_DAYS);
    const todayStr = today.toISOString().split('T')[0];
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const { data: promos, error } = await supabase
      .from('promotions')
      .select('id, name, kind, end_date, bonus_short_badge, discount_percentage, discount_fixed_amount, details, is_active')
      .eq('is_active', true)
      .not('end_date', 'is', null)
      .gte('end_date', todayStr)
      .lte('end_date', cutoffStr);

    if (error) throw error;

    // Filter to ones we haven't alerted for this specific end_date yet
    const fresh = (promos || []).filter((p: any) => {
      const details = (p.details && typeof p.details === 'object') ? p.details : {};
      const alertedFor = details[ALERT_KEY];
      return alertedFor !== p.end_date;
    });

    console.log(`Expiring scan: ${promos?.length || 0} expiring in <=${WARN_WITHIN_DAYS}d, ${fresh.length} new`);

    if (fresh.length === 0) {
      return new Response(
        JSON.stringify({ success: true, alerted: 0, scanned: promos?.length || 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const rows = fresh.map((p: any) => {
      const endDate = new Date(p.end_date + 'T00:00:00Z');
      const daysLeft = Math.max(0, Math.round((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const endLabel = endDate.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
      const value = p.kind === 'discount'
        ? (p.discount_percentage ? `${p.discount_percentage}% off` : (p.discount_fixed_amount ? `$${p.discount_fixed_amount} off` : ''))
        : (p.bonus_short_badge || 'Bonus');
      const urgency = daysLeft <= 2 ? '#dc2626' : daysLeft <= 5 ? '#d97706' : '#0d9488';
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;"><strong>${p.name}</strong><br><span style="font-size:13px;color:#6b7280;">${value}</span></td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:14px;">${endLabel}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;"><span style="color:${urgency};font-weight:600;">${daysLeft} day${daysLeft === 1 ? '' : 's'} left</span></td>
        </tr>`;
    }).join('');

    const content = `
      <h1>${fresh.length} Promotion${fresh.length === 1 ? '' : 's'} Expiring Soon</h1>
      <p>The following active promotion${fresh.length === 1 ? ' ends' : 's end'} within ${WARN_WITHIN_DAYS} days. Extend the end date in the admin panel if you want to keep ${fresh.length === 1 ? 'it' : 'them'} live.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;text-align:left;">
            <th style="padding:10px;border-bottom:2px solid #d1d5db;">Promotion</th>
            <th style="padding:10px;border-bottom:2px solid #d1d5db;">Ends</th>
            <th style="padding:10px;border-bottom:2px solid #d1d5db;">Time Left</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align:center;margin-top:20px;">
        ${createButtonHtml(`${siteUrl}/admin/promotions`, 'Open Promotions Manager')}
      </div>
      <p style="font-size:13px;color:#6b7280;margin-top:24px;">
        You'll only receive one reminder per end date. If you extend a promo, the new end date will get its own reminder when it next falls inside the ${WARN_WITHIN_DAYS}-day window.
      </p>
    `;

    const html = createBrandedEmailTemplate(
      content,
      `${fresh.length} promotion${fresh.length === 1 ? '' : 's'} expiring within ${WARN_WITHIN_DAYS} days`
    );

    const emailResp = await resend.emails.send({
      from: 'Harris Boat Works System <noreply@hbwsales.ca>',
      reply_to: ['info@harrisboatworks.ca'],
      to: [adminEmail],
      subject: `⏰ ${fresh.length} promo${fresh.length === 1 ? '' : 's'} expiring soon — extend before they end`,
      html,
    });

    if (emailResp.error) throw new Error(`Email send failed: ${emailResp.error.message}`);

    // Mark each as alerted-for-this-end-date
    await Promise.all(fresh.map((p: any) => {
      const details = (p.details && typeof p.details === 'object') ? { ...p.details } : {};
      details[ALERT_KEY] = p.end_date;
      return supabase.from('promotions').update({ details }).eq('id', p.id);
    }));

    return new Response(
      JSON.stringify({ success: true, alerted: fresh.length, emailId: emailResp.data?.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('check-expiring-promotions error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
