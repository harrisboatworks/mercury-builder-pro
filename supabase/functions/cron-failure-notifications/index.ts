import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'
import { Resend } from "npm:resend@2.0.0";
import { buildAdminEmail } from "../_shared/email-layout.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  job_name: string;
  error_message: string;
  started_at: string;
  motors_found?: number;
  motors_updated?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const notificationData: NotificationRequest = await req.json();
    
    console.log('[CRON-NOTIFICATION] Processing notification:', notificationData);

    // Log the cron job failure/success
    await supabase.from('cron_job_logs').insert({
      job_name: notificationData.job_name,
      started_at: notificationData.started_at,
      completed_at: new Date().toISOString(),
      status: notificationData.error_message ? 'failed' : 'completed',
      error_message: notificationData.error_message || null,
      motors_found: notificationData.motors_found || 0,
      motors_updated: notificationData.motors_updated || 0,
      result: notificationData
    });

    // Send email notification for failures or significant issues
    if (notificationData.error_message || (notificationData.motors_found === 0)) {
      const isError = !!notificationData.error_message;
      const subject = isError
        ? `Mercury inventory sync failed: ${new Date().toLocaleDateString()}`
        : `Mercury inventory sync warning: no motors found`;

      const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const rows = [
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#0f2a43;width:130px;">Job</td><td style="padding:6px 0;">${esc(notificationData.job_name)}</td></tr>`,
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#0f2a43;">Started</td><td style="padding:6px 0;">${esc(new Date(notificationData.started_at).toLocaleString())}</td></tr>`,
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#0f2a43;">Motors found</td><td style="padding:6px 0;">${notificationData.motors_found || 0}</td></tr>`,
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#0f2a43;">Motors updated</td><td style="padding:6px 0;">${notificationData.motors_updated || 0}</td></tr>`,
      ].join("");

      const errBlock = notificationData.error_message
        ? `<h3 style="margin:18px 0 6px 0;font-size:14px;color:#c8102e;">Error</h3><pre style="background:#f4f5f7;padding:12px;border-radius:4px;overflow-x:auto;font-size:12px;white-space:pre-wrap;">${esc(notificationData.error_message)}</pre>`
        : "";

      const emailBody = `
        <p style="margin:0 0 12px 0;">${isError ? "Inventory sync failure." : "Inventory sync completed with zero motors found."}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 12px 0;">${rows}</table>
        ${errBlock}
        <h3 style="margin:18px 0 6px 0;font-size:14px;color:#0f2a43;">Next steps</h3>
        <ul style="margin:0;padding-left:20px;line-height:1.7;">
          <li>Check the admin dashboard for detailed logs.</li>
          <li>Verify the Harris Boatworks website is accessible.</li>
          <li>Run a manual sync to diagnose the issue.</li>
        </ul>
      `;

      const html = buildAdminEmail({
        preheader: subject,
        tag: isError ? "Sync failed" : "Sync warning",
        heading: notificationData.job_name,
        bodyHtml: emailBody,
      });

      const emailResponse = await resend.emails.send({
        from: "Mercury Sync <noreply@mercuryrepower.ca>",
        to: ["info@harrisboatworks.ca"],
        subject,
        html,
      });

      console.log('[CRON-NOTIFICATION] Email sent:', emailResponse);
    }

    // Send daily summary even for successful runs
    if (!notificationData.error_message && (notificationData.motors_found ?? 0) > 0) {
      const summaryBody = `
        <p style="margin:0 0 12px 0;">Today's inventory sync completed successfully.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0 12px 0;">
          <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#0f2a43;width:130px;">Motors found</td><td style="padding:6px 0;">${notificationData.motors_found}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#0f2a43;">Motors updated</td><td style="padding:6px 0;">${notificationData.motors_updated}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#0f2a43;">Completed</td><td style="padding:6px 0;">${new Date().toLocaleString()}</td></tr>
        </table>
        <p style="margin:0 0 0 0;">Your Mercury inventory is up to date.</p>
      `;
      const summaryEmail = await resend.emails.send({
        from: "Mercury Sync <noreply@mercuryrepower.ca>",
        to: ["info@harrisboatworks.ca"],
        subject: `Daily Mercury inventory sync complete: ${new Date().toLocaleDateString()}`,
        html: buildAdminEmail({
          preheader: "Daily Mercury inventory sync complete",
          tag: "Sync OK",
          heading: notificationData.job_name,
          bodyHtml: summaryBody,
        }),
      });

      console.log('[CRON-NOTIFICATION] Summary email sent:', summaryEmail);
    }


    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification processed successfully',
        logged: true,
        email_sent: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[CRON-NOTIFICATION] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: (error instanceof Error ? error.message : String(error)),
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);