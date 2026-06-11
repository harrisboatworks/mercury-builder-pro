import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "npm:zod@3.22.4";
import { buildEmail, detailsCard, esc } from '../_shared/email-layout.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const resumeEmailSchema = z.object({
  applicationId: z.string().uuid("Invalid application ID"),
  email: z.string().trim().email("Invalid email address").max(255),
  applicantName: z.string().trim().max(100, "Name too long").optional(),
  completedSteps: z.number().int().min(0).max(10, "Invalid step count"),
});

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

    const rawBody = await req.json();
    const validationResult = resumeEmailSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: validationResult.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { applicationId, email, applicantName, completedSteps } = validationResult.data;

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
    const siteUrl = Deno.env.get('APP_URL') || 'https://mercuryrepower.ca';
    const resumeUrl = `${siteUrl}/financing/resume?token=${resumeToken}`;

    // Calculate progress
    const totalSteps = 7;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    const body = `
      <p style="margin:0 0 14px 0;">Hi${applicantName ? ` ${esc(applicantName)}` : ''},</p>
      <p style="margin:0 0 14px 0;">Your financing application is saved. You can pick it up where you left off whenever you have a few minutes.</p>
      ${detailsCard([
        { label: "Progress", value: `${completedSteps} of ${totalSteps} steps (${progressPercentage}%)` },
        { label: "Saved for", value: "30 days" },
      ])}
      <p style="margin:18px 0 0 0;">Need a hand? Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
    `;

    const html = buildEmail({
      preheader: "Pick up your financing application where you left off.",
      heading: "Resume your financing application",
      bodyHtml: body,
      ctaText: "Continue application",
      ctaUrl: resumeUrl,
      footerNote: "This resume link is good for 30 days.",
    });

    const emailResponse = await resend.emails.send({
      from: 'Harris Boat Works <noreply@mercuryrepower.ca>',
      replyTo: 'info@harrisboatworks.ca',
      to: [email],
      subject: 'Resume your financing application | Harris Boat Works',
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
      JSON.stringify({ error: 'An error occurred while sending the resume email. Please try again.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
