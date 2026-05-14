import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "npm:zod@3.22.4";
import { createBrandedEmailTemplate, createButtonHtml } from '../_shared/email-template.ts';

// Input validation schema. Body values are trusted only as hints; the canonical
// applicant data is re-read from the financing_applications row server-side so
// this function cannot be abused as an open relay.
const confirmationEmailSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  applicantEmail: z.string().trim().email("Invalid email address").max(255),
  applicantName: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  motorModel: z.string().trim().max(200, "Motor model too long"),
  amountToFinance: z.number().min(0).max(1000000, "Amount out of range"),
  sendAdminNotification: z.boolean().optional().default(true),
});

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Send one SMS via Twilio. Returns true on success, false on failure (logs and swallows error).
async function sendTwilioSms(to: string, body: string): Promise<boolean> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio credentials missing, skipping SMS to', to);
    return false;
  }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = btoa(`${accountSid}:${authToken}`);
    const form = new URLSearchParams();
    form.append('To', to);
    form.append('From', fromNumber);
    form.append('Body', body);
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error('Twilio SMS error', { to, status: resp.status, data });
      return false;
    }
    console.log('Twilio SMS sent', { to, sid: data.sid });
    return true;
  } catch (err) {
    console.error('Twilio SMS exception', { to, err: (err as Error)?.message });
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    const validationResult = confirmationEmailSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: validationResult.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const {
      applicationId,
      sendAdminNotification,
    } = validationResult.data;

    // Service role client to look up the canonical application row.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the application exists and re-derive applicant data from DB.
    // We fall back to the request body fields when the DB JSONB does not
    // contain them yet (early draft submits), but the application row MUST
    // exist or we refuse to send. This prevents anyone from triggering
    // arbitrary admin emails by guessing UUIDs.
    const { data: appRow, error: appError } = await adminClient
      .from('financing_applications')
      .select('id, applicant_data, purchase_data, created_at')
      .eq('id', applicationId)
      .maybeSingle();

    if (appError) {
      console.error('Failed to load application row:', appError);
      return new Response(
        JSON.stringify({ error: 'Application lookup failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    if (!appRow) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const applicantData = (appRow.applicant_data ?? {}) as Record<string, unknown>;
    const purchaseData = (appRow.purchase_data ?? {}) as Record<string, unknown>;

    const dbEmail = typeof applicantData.email === 'string' ? applicantData.email.trim() : '';
    const dbFirst = typeof applicantData.firstName === 'string' ? applicantData.firstName.trim() : '';
    const dbLast = typeof applicantData.lastName === 'string' ? applicantData.lastName.trim() : '';
    const dbMotor = typeof purchaseData.motorModel === 'string' ? purchaseData.motorModel.trim() : '';
    const dbAmountRaw = purchaseData.amountToFinance;
    const dbAmount = typeof dbAmountRaw === 'number'
      ? dbAmountRaw
      : (typeof dbAmountRaw === 'string' ? Number(dbAmountRaw) : NaN);

    // Prefer DB values, fall back to body. Body values were validated by Zod.
    const applicantEmail = dbEmail || validationResult.data.applicantEmail;
    const applicantName = (dbFirst || dbLast)
      ? `${dbFirst} ${dbLast}`.trim()
      : validationResult.data.applicantName;
    const motorModel = dbMotor || validationResult.data.motorModel;
    const amountToFinance = Number.isFinite(dbAmount) && dbAmount > 0
      ? dbAmount
      : validationResult.data.amountToFinance;

    // Rate limit per recipient email to prevent abuse.
    const rateLimitResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/check_rate_limit`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          _identifier: applicantEmail,
          _action: 'confirmation_email_send',
          _max_attempts: 3,
          _window_minutes: 60
        })
      }
    );

    if (!rateLimitResponse.ok) {
      throw new Error('Rate limit check failed');
    }

    const rateLimitData = await rateLimitResponse.json();

    if (rateLimitData === false) {
      console.warn(`Rate limit exceeded for email: ${applicantEmail}`);
      return new Response(
        JSON.stringify({ error: 'Too many email requests. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('Sending confirmation emails:', { applicationId, applicantEmail });

    const referenceNumber = applicationId.substring(0, 8).toUpperCase();
    const submittedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // --- Send Applicant Confirmation Email ---
    const applicantContent = `
      <h1>Application Received!</h1>
      <p>Hi ${applicantName},</p>
      <p>Thank you for submitting your financing application. We have received your information and our team will review it shortly.</p>

      <div class="reference-number">
        #${referenceNumber}
      </div>

      <div class="info-box">
        <strong>Application Details:</strong><br>
        Motor: ${motorModel}<br>
        Amount to Finance: $${amountToFinance.toLocaleString()}<br>
        Submitted: ${submittedDate}
      </div>

      <h2>What Happens Next?</h2>
      <ol style="padding-left: 20px;">
        <li style="margin-bottom: 8px;">Our financing team will review your application within 1-2 business days</li>
        <li style="margin-bottom: 8px;">We may contact you if we need additional information</li>
        <li style="margin-bottom: 8px;">You will receive a decision via email and phone</li>
        <li style="margin-bottom: 8px;">If approved, we will guide you through the final steps to complete your purchase</li>
      </ol>

      <div class="divider"></div>

      <p><strong>Questions?</strong> Reply to this email or call us at <a href="tel:905-342-2153">(905) 342-2153</a></p>

      <p>
        Best regards,<br>
        <strong>The Harris Boat Works Financing Team</strong>
      </p>
    `;

    const applicantHtml = createBrandedEmailTemplate(
      applicantContent,
      `Application #${referenceNumber} received`
    );

    console.log('Sending confirmation email to:', applicantEmail);

    const applicantEmailResponse = await resend.emails.send({
      from: 'Harris Boat Works Financing <financing@hbwsales.ca>',
      reply_to: ['info@harrisboatworks.ca'],
      to: [applicantEmail],
      subject: `Financing Application Received - Ref #${referenceNumber}`,
      html: applicantHtml,
    });

    console.log('Applicant email response:', applicantEmailResponse);

    if (applicantEmailResponse.error) {
      console.error('Applicant email error:', applicantEmailResponse.error);
      throw new Error(`Applicant email failed: ${applicantEmailResponse.error.message}`);
    }
    if (!applicantEmailResponse.data?.id) {
      throw new Error('Applicant email failed: No email ID returned');
    }

    // --- Send Admin Notification Email ---
    let adminEmailResponse;
    const smsResults: Array<{ to: string; ok: boolean }> = [];

    if (sendAdminNotification) {
      // Canonical admin email. Prefer ADMIN_EMAIL secret, default to the
      // HBW business inbox.
      const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'info@harrisboatworks.ca';
      console.log('Admin notification will be sent to:', adminEmail);
      const siteUrl = Deno.env.get('APP_URL') || 'https://mercuryrepower.ca';
      const reviewUrl = `${siteUrl}/admin/financing-applications?id=${applicationId}`;

      const adminContent = `
        <h1>New Financing Application</h1>
        <p>A new financing application has been submitted and is ready for review.</p>

        <div class="reference-number">
          #${referenceNumber}
        </div>

        <div class="info-box">
          <strong>Applicant:</strong> ${applicantName}<br>
          <strong>Email:</strong> ${applicantEmail}<br>
          <strong>Motor:</strong> ${motorModel}<br>
          <strong>Amount:</strong> $${amountToFinance.toLocaleString()}<br>
          <strong>Submitted:</strong> ${submittedDate}
        </div>

        <div style="text-align: center;">
          ${createButtonHtml(reviewUrl, 'Review Application in Admin Dashboard')}
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          Or copy and paste this link:<br>
          <a href="${reviewUrl}" style="color: #3b82f6; word-break: break-all;">${reviewUrl}</a>
        </p>
      `;

      const adminHtml = createBrandedEmailTemplate(
        adminContent,
        `New application from ${applicantName} - $${amountToFinance.toLocaleString()}`
      );

      adminEmailResponse = await resend.emails.send({
        from: 'Harris Boat Works System <noreply@hbwsales.ca>',
        reply_to: ['info@harrisboatworks.ca'],
        to: [adminEmail],
        subject: `New Financing Application - ${applicantName} - $${amountToFinance.toLocaleString()}`,
        html: adminHtml,
      });

      console.log('Admin email response:', adminEmailResponse);

      if (adminEmailResponse.error) {
        console.error('Admin email error:', adminEmailResponse.error);
        throw new Error(`Admin email failed: ${adminEmailResponse.error.message}`);
      }
      if (!adminEmailResponse.data?.id) {
        throw new Error('Admin email failed: No email ID returned');
      }

      // --- Send admin SMS notifications (best-effort, never fail the request) ---
      const adminPhonesRaw = Deno.env.get('ADMIN_PHONES') || '';
      const phones = adminPhonesRaw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (phones.length === 0) {
        console.warn('ADMIN_PHONES not configured, skipping financing SMS notifications');
      } else {
        const smsBody = `New HBW Financing Application: ${applicantName}, ${motorModel}, $${amountToFinance.toLocaleString()}. Check info@harrisboatworks.ca for details.`;
        for (const phone of phones) {
          const ok = await sendTwilioSms(phone, smsBody);
          smsResults.push({ to: phone, ok });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        applicantEmailId: applicantEmailResponse.data.id,
        adminEmailId: adminEmailResponse?.data?.id,
        smsResults,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error sending confirmation emails:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while sending the confirmation email. Please try again.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
