import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';
import { createBrandedEmailTemplate, createButtonHtml } from '../_shared/email-template.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeEmailRequest {
  applicationId: string;
  email: string;
  applicantName?: string;
  completedSteps: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, email, applicantName, completedSteps }: ResumeEmailRequest = await req.json();

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
          _identifier: email,
          _action: 'resume_email_send',
          _max_attempts: 5,
          _window_minutes: 60
        })
      }
    );

    if (!rateLimitResponse.ok) {
      throw new Error('Rate limit check failed');
    }

    const rateLimitData = await rateLimitResponse.json();
    
    if (rateLimitData === false) {
      console.warn(`Rate limit exceeded for email: ${email}`);
      return new Response(
        JSON.stringify({ error: 'Too many email requests. Please try again later.' }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('Sending resume email:', { applicationId, email, completedSteps });

    // Fetch the resume token from database
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/financing_applications?id=eq.${applicationId}&select=resume_token`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!dbResponse.ok) {
      throw new Error('Failed to fetch resume token');
    }

    const data = await dbResponse.json();
    const resumeToken = data[0]?.resume_token;

    if (!resumeToken) {
      throw new Error('Resume token not found');
    }

    // Generate resume URL
    const siteUrl = Deno.env.get('APP_URL') || 'https://harrisboatworks.com';
    const resumeUrl = `${siteUrl}/financing/resume?token=${resumeToken}`;

    // Calculate progress
    const totalSteps = 7;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    // Create email content
    const emailContent = `
      <h1>Resume Your Financing Application</h1>
      <p>Hi${applicantName ? ` ${applicantName}` : ''},</p>
      <p>Your financing application has been saved! You can continue where you left off at any time.</p>
      
      <div class="info-box">
        <strong>Progress:</strong> ${completedSteps} of ${totalSteps} steps complete (${progressPercentage}%)
      </div>
      
      <div style="text-align: center;">
        ${createButtonHtml(resumeUrl, 'Continue Your Application')}
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">
        Or copy and paste this link into your browser:<br>
        <a href="${resumeUrl}" style="color: #3b82f6; word-break: break-all;">${resumeUrl}</a>
      </p>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7280;">
        <strong>Important:</strong> This link will remain active for 30 days. After that, you'll need to start a new application.
      </p>
      
      <p>Need help? Contact us at <a href="tel:905-342-2153">(905) 342-2153</a> or reply to this email.</p>
      
      <p>
        Best regards,<br>
        <strong>The Harris Boat Works Team</strong>
      </p>
    `;

    const html = createBrandedEmailTemplate(emailContent, 'Resume your financing application');

    // TEMPORARY: Send to verified email for testing until domain is verified at resend.com/domains
    // Once domain is verified, change 'from' to 'Harris Boat Works <noreply@harrisboatworks.com>' and 'to' back to [email]
    const testRecipient = 'harrisboatworks@hotmail.com'; // Your verified Resend email
    const isTestMode = email !== testRecipient;
    
    console.log(`Sending email to: ${isTestMode ? `${testRecipient} (test mode, intended for: ${email})` : email}`);

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'Harris Boat Works <onboarding@resend.dev>',
      reply_to: ['info@harrisboatworks.ca'],
      to: [testRecipient], // Temporary: always send to verified email
      subject: isTestMode 
        ? `[TEST] Resume Your Financing Application (for ${email})`
        : 'Resume Your Financing Application',
      html,
    });

    console.log('Resend API response:', emailResponse);

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error('Resend API error:', emailResponse.error);
      throw new Error(`Email delivery failed: ${emailResponse.error.message}`);
    }

    // Only return success if we have a valid email ID
    if (!emailResponse.data?.id) {
      throw new Error('Email delivery failed: No email ID returned');
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data.id }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error sending resume email:', error);
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
