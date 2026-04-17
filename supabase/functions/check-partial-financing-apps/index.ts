// Scans for financing applications stuck at step ≥ 4 with contact info,
// in 'draft' status for >6 hours, and emails the admin a digest.
// Designed to be called hourly by pg_cron. Tracks "alerted" state in
// notes_history JSONB to avoid duplicate alerts for the same application.

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import { createBrandedEmailTemplate, createButtonHtml } from '../_shared/email-template.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STALL_THRESHOLD_HOURS = 6;
const ALERT_FLAG_KEY = 'partial_app_alert_sent_at';

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

    if (!resendKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const resend = new Resend(resendKey);

    const cutoff = new Date(Date.now() - STALL_THRESHOLD_HOURS * 60 * 60 * 1000).toISOString();

    // Find applications:
    //   - draft status
    //   - reached step 4+ (employment captured)
    //   - has applicant email or phone
    //   - last updated > 6h ago
    //   - not already alerted
    const { data: candidates, error: queryError } = await supabase
      .from('financing_applications')
      .select('id, current_step, applicant_data, purchase_data, employment_data, created_at, updated_at, notes_history')
      .eq('status', 'draft')
      .gte('current_step', 4)
      .lte('updated_at', cutoff)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (queryError) throw queryError;

    const fresh = (candidates || []).filter((app: any) => {
      const email = app.applicant_data?.email;
      const phone = app.applicant_data?.primaryPhone || app.applicant_data?.phone;
      if (!email && !phone) return false;

      // Skip if already alerted
      const history = Array.isArray(app.notes_history) ? app.notes_history : [];
      const alreadyAlerted = history.some(
        (n: any) => n && typeof n === 'object' && n.kind === ALERT_FLAG_KEY
      );
      return !alreadyAlerted;
    });

    console.log(`Partial-app scan: ${candidates?.length || 0} candidates, ${fresh.length} new`);

    if (fresh.length === 0) {
      return new Response(
        JSON.stringify({ success: true, alerted: 0, message: 'No new partial applications' }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Build digest
    const rows = fresh
      .map((app: any) => {
        const ref = `#${app.id.substring(0, 8).toUpperCase()}`;
        const fname = app.applicant_data?.firstName || '';
        const lname = app.applicant_data?.lastName || '';
        const name = `${fname} ${lname}`.trim() || '(no name)';
        const email = app.applicant_data?.email || '—';
        const phone = app.applicant_data?.primaryPhone || app.applicant_data?.phone || '—';
        const motor = app.purchase_data?.motorModel || '—';
        const amount = app.purchase_data?.amountToFinance
          ? `$${Number(app.purchase_data.amountToFinance).toLocaleString()}`
          : '—';
        const stepLabel = `Step ${app.current_step}/7`;
        const hoursAgo = Math.round(
          (Date.now() - new Date(app.updated_at).getTime()) / (60 * 60 * 1000)
        );
        const reviewUrl = `${siteUrl}/admin/financing-applications?id=${app.id}`;

        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px;">${ref}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
              <strong>${name}</strong><br>
              <span style="font-size:13px;color:#6b7280;">${email}</span><br>
              <span style="font-size:13px;color:#6b7280;">${phone}</span>
            </td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:14px;">${motor}<br><span style="color:#6b7280;font-size:13px;">${amount}</span></td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-size:13px;">${stepLabel}<br><span style="color:#6b7280;">${hoursAgo}h ago</span></td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb;"><a href="${reviewUrl}" style="color:#3b82f6;font-size:13px;">View →</a></td>
          </tr>`;
      })
      .join('');

    const adminContent = `
      <h1>${fresh.length} Stalled Financing ${fresh.length === 1 ? 'Application' : 'Applications'}</h1>
      <p>${fresh.length === 1 ? 'A customer has' : 'Customers have'} started a financing application, entered contact details, but never clicked Submit. They may need a nudge.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
        <thead>
          <tr style="background:#f3f4f6;text-align:left;">
            <th style="padding:10px;border-bottom:2px solid #d1d5db;">Ref</th>
            <th style="padding:10px;border-bottom:2px solid #d1d5db;">Applicant</th>
            <th style="padding:10px;border-bottom:2px solid #d1d5db;">Motor / Amount</th>
            <th style="padding:10px;border-bottom:2px solid #d1d5db;">Progress</th>
            <th style="padding:10px;border-bottom:2px solid #d1d5db;"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="text-align:center;margin-top:20px;">
        ${createButtonHtml(`${siteUrl}/admin/financing-applications`, 'Open Admin Dashboard')}
      </div>

      <p style="font-size:13px;color:#6b7280;margin-top:24px;">
        Threshold: draft applications past Step 4 with contact info, idle for ${STALL_THRESHOLD_HOURS}+ hours.
        Each application is only alerted once.
      </p>
    `;

    const html = createBrandedEmailTemplate(
      adminContent,
      `${fresh.length} stalled financing application${fresh.length === 1 ? '' : 's'} need follow-up`
    );

    const emailResp = await resend.emails.send({
      from: 'Harris Boat Works System <noreply@hbwsales.ca>',
      reply_to: ['info@harrisboatworks.ca'],
      to: [adminEmail],
      subject: `${fresh.length} stalled financing app${fresh.length === 1 ? '' : 's'} — needs follow-up`,
      html,
    });

    if (emailResp.error) {
      throw new Error(`Email send failed: ${emailResp.error.message}`);
    }

    // Mark each as alerted in notes_history
    const nowIso = new Date().toISOString();
    await Promise.all(
      fresh.map((app: any) => {
        const history = Array.isArray(app.notes_history) ? app.notes_history : [];
        history.push({ kind: ALERT_FLAG_KEY, at: nowIso });
        return supabase
          .from('financing_applications')
          .update({ notes_history: history })
          .eq('id', app.id);
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        alerted: fresh.length,
        emailId: emailResp.data?.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err: any) {
    console.error('check-partial-financing-apps error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
