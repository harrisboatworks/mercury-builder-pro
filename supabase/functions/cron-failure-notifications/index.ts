import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'
import { Resend } from "npm:resend@2.0.0";

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
        ? `🚨 Mercury Inventory Sync Failed - ${new Date().toLocaleDateString()}`
        : `⚠️ Mercury Inventory Sync Warning - No Motors Found`;

      const emailBody = `
        <h2>${isError ? 'Inventory Sync Failure' : 'Inventory Sync Warning'}</h2>
        
        <div style="background: ${isError ? '#fee2e2' : '#fef3c7'}; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3>Job Details:</h3>
          <ul>
            <li><strong>Job Name:</strong> ${notificationData.job_name}</li>
            <li><strong>Started At:</strong> ${new Date(notificationData.started_at).toLocaleString()}</li>
            <li><strong>Motors Found:</strong> ${notificationData.motors_found || 0}</li>
            <li><strong>Motors Updated:</strong> ${notificationData.motors_updated || 0}</li>
          </ul>
          
          ${notificationData.error_message ? `
            <h3>Error Message:</h3>
            <pre style="background: #f3f4f6; padding: 12px; border-radius: 4px; overflow-x: auto;">
${notificationData.error_message}
            </pre>
          ` : ''}
        </div>

        <h3>Next Steps:</h3>
        <ul>
          <li>Check the admin dashboard for detailed logs</li>
          <li>Verify the Harris Boatworks website is accessible</li>
          <li>Run a manual test to diagnose the issue</li>
          ${isError ? '<li>Review the error message above for specific guidance</li>' : ''}
        </ul>

        <p><em>This is an automated notification from your Mercury inventory sync system.</em></p>
      `;

      const emailResponse = await resend.emails.send({
        from: "Mercury Sync <noreply@hbwsales.ca>",
        to: ["info@harrisboatworks.ca"],
        subject: subject,
        html: emailBody,
      });

      console.log('[CRON-NOTIFICATION] Email sent:', emailResponse);
    }

    // Send daily summary even for successful runs
    if (!notificationData.error_message && notificationData.motors_found > 0) {
      const summaryEmail = await resend.emails.send({
        from: "Mercury Sync <noreply@hbwsales.ca>",
        to: ["info@harrisboatworks.ca"],
        subject: `✅ Daily Mercury Inventory Sync Complete - ${new Date().toLocaleDateString()}`,
        html: `
          <h2>Daily Inventory Sync Summary</h2>
          
          <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3>Success! Today's sync completed successfully.</h3>
            <ul>
              <li><strong>Motors Found:</strong> ${notificationData.motors_found}</li>
              <li><strong>Motors Updated:</strong> ${notificationData.motors_updated}</li>
              <li><strong>Completed:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <p>Your Mercury inventory is up to date with the latest stock information from Harris Boatworks.</p>
          
          <p><em>This is your daily inventory sync summary.</em></p>
        `,
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
        error: error.message,
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