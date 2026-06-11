import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";
import { z } from "npm:zod@3.22.4";
import { buildEmail, buildAdminEmail, detailsCard, esc as escLayout } from "../_shared/email-layout.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER')!;
const adminPhone = Deno.env.get('ADMIN_PHONE')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

// Server-side validation schema
const contactInquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  phone: z.string().max(20, "Phone number too long").optional(),
  inquiry_type: z.enum(['general', 'sales', 'service', 'parts', 'quote', 'warranty', 'other']),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message too long"),
  preferred_contact_method: z.enum(['email', 'phone', 'sms']),
  urgency_level: z.enum(['low', 'medium', 'high', 'urgent']),
  user_id: z.string().uuid().optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: Check IP-based limits
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      _identifier: clientIP,
      _action: 'contact_inquiry',
      _max_attempts: 5,
      _window_minutes: 60
    });

    if (!allowed) {
      console.log(`[send-contact-inquiry] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawData = await req.json();
    
    // Validate input with zod
    const validationResult = contactInquirySchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data', 
          details: validationResult.error.errors 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const inquiryData = validationResult.data;

    // HTML-escape user-supplied strings before embedding in email bodies
    const escHtml = (s: unknown): string =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    // Sanitize free-text for SMS bodies (strip URLs, phone numbers, restrict chars)
    const sanitizeForSms = (val: unknown, max = 200): string => {
      const s = typeof val === 'string' ? val : '';
      return s
        .replace(/https?:\/\/\S+/gi, '')
        .replace(/\b\d[\d\s().-]{6,}\d\b/g, '')
        .replace(/[^A-Za-z0-9 ,.\-']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, max);
    };
    
    console.log('Processing contact inquiry:', { 
      name: inquiryData.name, 
      email: inquiryData.email, 
      type: inquiryData.inquiry_type 
    });

    // Get user ID from auth header if authenticated
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    // Store inquiry in database
    const { data: inquiry, error: dbError } = await supabase
      .from('contact_inquiries')
      .insert({
        ...inquiryData,
        user_id: userId
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save inquiry: ${dbError.message}`);
    }

    console.log('Inquiry saved with ID:', inquiry.id);

    // --- Customer acknowledgement email ---
    const responseTime = inquiryData.urgency_level === 'urgent'
      ? "We understand this is urgent and will respond within 2 to 4 hours during business hours."
      : "We typically respond within one business day.";

    const customerBody = `
      <p style="margin:0 0 14px 0;">Hi ${escHtml(inquiryData.name)},</p>
      <p style="margin:0 0 14px 0;">Thanks for reaching out. We received your ${escHtml(inquiryData.inquiry_type)} inquiry and will be in touch.</p>
      ${detailsCard([
        { label: "Type", value: escLayout(inquiryData.inquiry_type) },
        { label: "Priority", value: escLayout(inquiryData.urgency_level) },
        { label: "Preferred", value: escLayout(inquiryData.preferred_contact_method) },
      ])}
      <p style="margin:18px 0 14px 0;font-weight:600;color:#1f2430;">Your message</p>
      <div style="background:#f8fafb;border-left:3px solid #0f2a43;padding:14px 16px;border-radius:4px;color:#1f2430;white-space:pre-wrap;">${escHtml(inquiryData.message)}</div>
      <p style="margin:22px 0 0 0;">${responseTime}</p>
      <p style="margin:14px 0 0 0;">Need to reach us sooner? Call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a>.</p>
    `;

    const customerHtml = buildEmail({
      preheader: `We received your ${inquiryData.inquiry_type} inquiry.`,
      heading: "We received your inquiry",
      bodyHtml: customerBody,
    });

    const customerEmailResponse = await resend.emails.send({
      from: "Harris Boat Works <info@mercuryrepower.ca>",
      replyTo: "info@harrisboatworks.ca",
      to: [inquiryData.email],
      subject: "We received your inquiry | Harris Boat Works",
      html: customerHtml,
    });

    // --- Admin notification ---
    const adminBody = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:12px;">
        <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Name</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${escHtml(inquiryData.name)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td style="padding:6px 0;"><a href="mailto:${escHtml(inquiryData.email)}" style="color:#0f2a43;">${escHtml(inquiryData.email)}</a></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Phone</td><td style="padding:6px 0;">${inquiryData.phone ? `<a href="tel:${escHtml(inquiryData.phone)}" style="color:#0f2a43;">${escHtml(inquiryData.phone)}</a>` : 'Not provided'}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Preferred</td><td style="padding:6px 0;color:#1f2430;">${escHtml(inquiryData.preferred_contact_method)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Type</td><td style="padding:6px 0;color:#1f2430;">${escHtml(inquiryData.inquiry_type)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;">Priority</td><td style="padding:6px 0;color:#1f2430;font-weight:600;">${escHtml(inquiryData.urgency_level)}</td></tr>
      </table>
      <p style="margin:8px 0 6px 0;font-weight:600;color:#1f2430;">Message</p>
      <div style="background:#f8fafb;border-left:3px solid #0f2a43;padding:12px 14px;border-radius:4px;color:#1f2430;white-space:pre-wrap;">${escHtml(inquiryData.message)}</div>
      <p style="margin:12px 0 0 0;font-size:12px;color:#6b7280;">Inquiry ID ${inquiry.id} | ${new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' })} ET</p>
    `;
    const adminSubject = inquiryData.urgency_level === 'urgent'
      ? `[URGENT] ${inquiryData.name} - ${inquiryData.inquiry_type}`
      : `[CONTACT] ${inquiryData.name} - ${inquiryData.inquiry_type}`;

    const adminEmailResponse = await resend.emails.send({
      from: "Harris Boat Works <info@mercuryrepower.ca>",
      to: ["info@harrisboatworks.ca"],
      subject: adminSubject,
      html: buildAdminEmail({
        preheader: `${inquiryData.name} - ${inquiryData.inquiry_type}`,
        heading: `${inquiryData.name} - ${inquiryData.inquiry_type}`,
        bodyHtml: adminBody,
        tag: inquiryData.urgency_level === 'urgent' ? "Urgent" : "Contact",
      }),
    });

    // Send SMS notification for urgent inquiries or if preferred contact method is SMS
    if (inquiryData.urgency_level === 'urgent' || inquiryData.preferred_contact_method === 'sms') {
      try {
        const safeName = sanitizeForSms(inquiryData.name, 60);
        const safeMessage = sanitizeForSms(inquiryData.message, 200);
        const smsMessage = `New ${inquiryData.urgency_level === 'urgent' ? 'URGENT ' : ''}inquiry from ${safeName}. Type: ${inquiryData.inquiry_type}. Message: ${safeMessage}`;
        
        const smsResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioFromNumber,
            To: adminPhone,
            Body: smsMessage,
          }),
        });

        if (smsResponse.ok) {
          console.log('SMS notification sent successfully');
        } else {
          console.error('Failed to send SMS notification:', await smsResponse.text());
        }
      } catch (smsError) {
        console.error('SMS sending error:', smsError);
        // Don't fail the whole request if SMS fails
      }
    }

    console.log('All notifications sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Inquiry submitted successfully',
        inquiry_id: inquiry.id,
        estimated_response_time: inquiryData.urgency_level === 'urgent' ? '2-4 hours' : '24 hours'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error processing contact inquiry:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error instanceof Error ? error.message : String(error)) || 'Failed to process inquiry'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

serve(handler);