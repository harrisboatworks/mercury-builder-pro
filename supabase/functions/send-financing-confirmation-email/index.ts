import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { createBrandedEmailTemplate, createButtonHtml } from '../_shared/email-template.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmationEmailRequest {
  applicationId: string;
  applicantEmail: string;
  applicantName: string;
  motorModel: string;
  amountToFinance: number;
  sendAdminNotification?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const {
      applicationId,
      applicantEmail,
      applicantName,
      motorModel,
      amountToFinance,
      sendAdminNotification = true,
    }: ConfirmationEmailRequest = await req.json();

    // Rate limiting: Check if user has exceeded email sending limit
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const rateLimitResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/check_rate_limit`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
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
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Sending confirmation emails:', { applicationId, applicantEmail });

    // Generate reference number (first 8 chars of UUID)
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
      <p>Thank you for submitting your financing application. We've received your information and our team will review it shortly.</p>
      
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
        <li style="margin-bottom: 8px;">You'll receive a decision via email and phone</li>
        <li style="margin-bottom: 8px;">If approved, we'll guide you through the final steps to complete your purchase</li>
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

    // Check for applicant email error
    if (applicantEmailResponse.error) {
      console.error('Applicant email error:', applicantEmailResponse.error);
      throw new Error(`Applicant email failed: ${applicantEmailResponse.error.message}`);
    }

    if (!applicantEmailResponse.data?.id) {
      throw new Error('Applicant email failed: No email ID returned');
    }

    // --- Send Admin Notification Email ---
    let adminEmailResponse;
    if (sendAdminNotification) {
      // TEMPORARY: Using verified email for testing. Change back to actual admin email after domain verification.
      const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'harrisboatworks@hotmail.com';
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

      // Check for admin email error
      if (adminEmailResponse.error) {
        console.error('Admin email error:', adminEmailResponse.error);
        throw new Error(`Admin email failed: ${adminEmailResponse.error.message}`);
      }

      if (!adminEmailResponse.data?.id) {
        throw new Error('Admin email failed: No email ID returned');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        applicantEmailId: applicantEmailResponse.data.id,
        adminEmailId: adminEmailResponse?.data?.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error sending confirmation emails:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
