import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER')!;
const adminPhone = Deno.env.get('ADMIN_PHONE')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface ContactInquiry {
  name: string;
  email: string;
  phone?: string;
  inquiry_type: string;
  message: string;
  preferred_contact_method: string;
  urgency_level: string;
  user_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const inquiryData: ContactInquiry = await req.json();
    
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

    // Send confirmation email to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Harris Boat Works <info@harrisboatworks.ca>",
      to: [inquiryData.email],
      subject: "We received your inquiry - Harris Boat Works",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #007DC5, #1e40af); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">Thank You for Contacting Us!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your inquiry has been received</p>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <p style="font-size: 16px; color: #334155; margin: 0 0 20px 0;">
              Hi ${inquiryData.name},
            </p>
            
            <p style="font-size: 16px; color: #334155; line-height: 1.6;">
              Thank you for reaching out to Harris Boat Works. We've received your <strong>${inquiryData.inquiry_type}</strong> inquiry and will get back to you as soon as possible.
            </p>
            
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #007DC5; margin: 0 0 15px 0;">Your Inquiry Details:</h3>
              <p style="margin: 5px 0; color: #64748b;"><strong>Type:</strong> ${inquiryData.inquiry_type}</p>
              <p style="margin: 5px 0; color: #64748b;"><strong>Priority:</strong> ${inquiryData.urgency_level}</p>
              <p style="margin: 5px 0; color: #64748b;"><strong>Preferred Contact:</strong> ${inquiryData.preferred_contact_method}</p>
              <p style="margin: 15px 0 5px 0; color: #64748b;"><strong>Message:</strong></p>
              <p style="margin: 0; color: #475569; font-style: italic;">"${inquiryData.message}"</p>
            </div>
            
            <div style="background: #007DC5; color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">What's Next?</h3>
              <p style="margin: 0; line-height: 1.6;">
                ${inquiryData.urgency_level === 'urgent' 
                  ? 'We understand this is urgent and will respond within 2-4 hours during business hours.' 
                  : 'We typically respond to inquiries within 24 hours during business hours.'
                }
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
              <h3 style="color: #334155; margin: 0 0 15px 0;">Contact Information</h3>
              <p style="margin: 5px 0; color: #64748b;">📞 <strong>(905) 342-2153</strong></p>
              <p style="margin: 5px 0; color: #64748b;">📧 <strong>info@harrisboatworks.ca</strong></p>
              <p style="margin: 5px 0; color: #64748b;">📍 <strong>5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0</strong></p>
            </div>
          </div>
          
          <div style="background: #334155; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              Harris Boat Works - Go Boldly - Authorized Mercury Marine Dealer
            </p>
          </div>
        </div>
      `,
    });

    // Send notification to admin
    const adminSubject = `New ${inquiryData.inquiry_type} Inquiry${inquiryData.urgency_level === 'urgent' ? ' - URGENT' : ''}`;
    const adminEmailResponse = await resend.emails.send({
      from: "Harris Boat Works <info@harrisboatworks.ca>",
      to: ["info@harrisboatworks.ca"],
      subject: adminSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${inquiryData.urgency_level === 'urgent' ? '#dc2626' : '#007DC5'}; color: white; padding: 20px;">
            <h1 style="margin: 0; font-size: 24px;">New Contact Inquiry</h1>
            ${inquiryData.urgency_level === 'urgent' 
              ? '<p style="margin: 10px 0 0 0; font-weight: bold; background: rgba(255,255,255,0.2); padding: 8px; border-radius: 4px;">⚠️ URGENT INQUIRY</p>' 
              : ''
            }
          </div>
          
          <div style="padding: 20px; background: #f8fafc;">
            <h2 style="color: #334155; margin: 0 0 15px 0;">Customer Details</h2>
            <p><strong>Name:</strong> ${inquiryData.name}</p>
            <p><strong>Email:</strong> ${inquiryData.email}</p>
            <p><strong>Phone:</strong> ${inquiryData.phone || 'Not provided'}</p>
            <p><strong>Preferred Contact:</strong> ${inquiryData.preferred_contact_method}</p>
            
            <h2 style="color: #334155; margin: 20px 0 15px 0;">Inquiry Details</h2>
            <p><strong>Type:</strong> ${inquiryData.inquiry_type}</p>
            <p><strong>Priority:</strong> ${inquiryData.urgency_level}</p>
            <p><strong>Message:</strong></p>
            <div style="background: white; border-left: 4px solid #007DC5; padding: 15px; margin: 10px 0;">
              ${inquiryData.message}
            </div>
            
            <p style="margin-top: 20px; color: #64748b; font-size: 14px;">
              Inquiry ID: ${inquiry.id}<br>
              Received: ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    });

    // Send SMS notification for urgent inquiries or if preferred contact method is SMS
    if (inquiryData.urgency_level === 'urgent' || inquiryData.preferred_contact_method === 'sms') {
      try {
        const smsMessage = `New ${inquiryData.urgency_level === 'urgent' ? 'URGENT ' : ''}inquiry from ${inquiryData.name} (${inquiryData.email}). Type: ${inquiryData.inquiry_type}. Message: ${inquiryData.message.substring(0, 200)}${inquiryData.message.length > 200 ? '...' : ''}`;
        
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
        error: error.message || 'Failed to process inquiry'
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