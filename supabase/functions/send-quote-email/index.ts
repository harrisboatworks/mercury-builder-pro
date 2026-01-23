import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const leadDataSchema = z.object({
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().max(255).optional(),
  customerPhone: z.string().max(20).optional(),
  contactMethod: z.string().max(50).optional(),
  leadScore: z.number().min(0).max(100).optional(),
  quoteId: z.string().uuid().optional(),
}).optional();

const quoteEmailSchema = z.object({
  customerEmail: z.string().trim().email("Invalid email").max(255),
  customerName: z.string().trim().min(1).max(100),
  quoteNumber: z.string().max(50),
  motorModel: z.string().max(200),
  totalPrice: z.number().min(0).max(2000000),
  pdfUrl: z.string().url().max(2000).optional(),
  emailType: z.enum(['quote_delivery', 'follow_up', 'reminder', 'admin_quote_notification']),
  leadData: leadDataSchema,
});

type QuoteEmailRequest = z.infer<typeof quoteEmailSchema>;

// Replace template variables with actual data
function replaceTemplateVariables(template: string, data: QuoteEmailRequest): string {
  return template
    .replace(/{{customerName}}/g, data.customerName)
    .replace(/{{quoteNumber}}/g, data.quoteNumber)
    .replace(/{{motorModel}}/g, data.motorModel)
    .replace(/{{totalPrice}}/g, data.totalPrice.toLocaleString());
}

// Generate email content based on type (fallback for when templates aren't found)
function generateQuoteDeliveryEmail(data: QuoteEmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Mercury Motor Quote</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .quote-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .price { font-size: 24px; font-weight: bold; color: #1e40af; }
          .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Mercury Motor Quote is Ready!</h1>
            <p>Quote #${data.quoteNumber}</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>Thank you for your interest in Mercury motors! We've prepared a personalized quote for you.</p>
            
            <div class="quote-details">
              <h3>Quote Details</h3>
              <p><strong>Motor Model:</strong> ${data.motorModel}</p>
              <p><strong>Total Price:</strong> <span class="price">$${data.totalPrice.toLocaleString()}</span></p>
              <p><strong>Quote Number:</strong> ${data.quoteNumber}</p>
            </div>
            
            ${data.pdfUrl ? `
              <p style="margin: 20px 0;">Your detailed quote is attached to this email as a PDF. You can also view it online:</p>
              <p style="text-align: center; margin: 24px 0;">
                <a href="${data.pdfUrl}" class="btn" style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Download Quote PDF</a>
              </p>
            ` : ''}
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Review your personalized quote</li>
              <li>Schedule a consultation to discuss options</li>
              <li>Ask about current promotions and financing</li>
            </ul>
            
            <p>This quote is valid for 30 days. Contact us to lock in this pricing or discuss any modifications.</p>
            
            <p>Ready to move forward? Reply to this email or call us at <strong>(555) 123-4567</strong></p>
            
            <p>Best regards,<br>
            The Mercury Motors Team</p>
          </div>
          
          <div class="footer">
            <p>Have questions? Simply reply to this email and we'll get back to you!</p>
            <p>Or call us directly at <strong>(555) 123-4567</strong></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateFollowUpEmail(data: QuoteEmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Following Up on Your Mercury Motor Quote</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .highlight { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
          .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Still Interested in Your Mercury Motor?</h1>
            <p>Quote #${data.quoteNumber}</p>
          </div>
          
          <div class="content">
            <p>Hi ${data.customerName},</p>
            
            <p>I wanted to follow up on the Mercury motor quote we prepared for you a few days ago.</p>
            
            <div class="highlight">
              <h3>Your Quote Summary</h3>
              <p><strong>Motor:</strong> ${data.motorModel}</p>
              <p><strong>Price:</strong> $${data.totalPrice.toLocaleString()}</p>
            </div>
            
            <p><strong>Have questions about:</strong></p>
            <ul>
              <li>Financing options and monthly payments?</li>
              <li>Installation and setup services?</li>
              <li>Warranty coverage and protection plans?</li>
              <li>Current promotions or seasonal discounts?</li>
            </ul>
            
            <p>I'm here to help! As your Mercury specialist, I can answer any questions and even schedule a time to see the motor in person.</p>
            
            <p><strong>Ready to take the next step?</strong><br>
            Simply reply to this email or give me a call at <strong>(555) 123-4567</strong></p>
            
            <p>Don't forget - your quote is valid for another few weeks, so there's no rush. But if you're ready to move forward, I'd love to help make it happen!</p>
            
            <p>Best regards,<br>
            Mike Johnson<br>
            Mercury Motor Specialist</p>
          </div>
          
           <div class="footer">
             <p>Questions? Simply reply to this email or call us at <strong>(555) 123-4567</strong></p>
           </div>
        </div>
      </body>
    </html>
  `;
}

function generateAdminNotificationEmail(data: QuoteEmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Quote Submitted</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px 20px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .label { font-weight: 600; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { color: #1e293b; font-size: 16px; margin-top: 5px; }
          .btn { background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
          .priority { background: #dc2626; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🔔 New Quote Submitted</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Immediate Action Required</p>
        </div>
        
        <div class="content">
          <div class="priority">HIGH PRIORITY LEAD</div>
          
          <h2 style="color: #1e40af; margin-top: 20px;">Quote Details</h2>
          
          <div class="info-box">
            <div class="label">Quote Number</div>
            <div class="value">${data.quoteNumber}</div>
          </div>
          
          <div class="info-box">
            <div class="label">Motor Model</div>
            <div class="value">${data.motorModel}</div>
          </div>
          
          <div class="info-box">
            <div class="label">Total Quote Amount</div>
            <div class="value">$${data.totalPrice?.toLocaleString()}</div>
          </div>
          
          <h2 style="color: #1e40af; margin-top: 30px;">Customer Information</h2>
          
          <div class="info-box">
            <div class="label">Name</div>
            <div class="value">${data.leadData?.customerName || 'Not provided'}</div>
          </div>
          
          <div class="info-box">
            <div class="label">Email</div>
            <div class="value"><a href="mailto:${data.leadData?.customerEmail}">${data.leadData?.customerEmail}</a></div>
          </div>
          
          <div class="info-box">
            <div class="label">Phone</div>
            <div class="value"><a href="tel:${data.leadData?.customerPhone}">${data.leadData?.customerPhone || 'Not provided'}</a></div>
          </div>
          
          <div class="info-box">
            <div class="label">Preferred Contact Method</div>
            <div class="value">${data.leadData?.contactMethod || 'email'}</div>
          </div>
          
          <div class="info-box">
            <div class="label">Lead Score</div>
            <div class="value">${data.leadData?.leadScore || 0}/100</div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://quote.harrisboatworks.ca/admin/quotes/${data.leadData?.quoteId}" class="btn">View Full Quote in Admin Dashboard</a>
          </div>
          
          ${data.pdfUrl ? `
            <div style="text-align: center; margin-top: 10px;">
              <a href="${data.pdfUrl}" class="btn" style="background: #059669;">Download Quote PDF</a>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <strong>Next Steps:</strong><br>
            1. Review the quote details in the admin dashboard<br>
            2. Contact the customer via their preferred method within 24 hours<br>
            3. Follow up on any special requests or questions<br>
            4. Update the quote status in the admin panel
          </p>
        </div>
      </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawData = await req.json();
    
    // Validate input data
    const validationResult = quoteEmailSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email data',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailData = validationResult.data;
    
    console.log('Sending email:', emailData.emailType, 'to:', emailData.customerEmail);

    // Try to get template from database first
    let subject: string;
    let htmlContent: string;
    
    try {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('subject, html_content')
        .eq('type', emailData.emailType)
        .eq('is_active', true)
        .single();

      if (template && !templateError) {
        // Use database template
        subject = replaceTemplateVariables(template.subject, emailData);
        htmlContent = replaceTemplateVariables(template.html_content, emailData);
        console.log('Using database template for:', emailData.emailType);
      } else {
        throw new Error('Template not found, using fallback');
      }
    } catch (templateError) {
      console.log('No database template found, using fallback for:', emailData.emailType);
      
      // Fallback to hardcoded templates
      switch (emailData.emailType) {
        case 'quote_delivery':
          subject = `Your Mercury Motor Quote #${emailData.quoteNumber} from Harris Boat Works`;
          htmlContent = generateQuoteDeliveryEmail(emailData);
          break;
        case 'follow_up':
        case 'reminder':
          subject = `Following up on your Mercury Motor quote #${emailData.quoteNumber}`;
          htmlContent = generateFollowUpEmail(emailData);
          break;
        case 'admin_quote_notification':
          subject = `🔔 New Quote: ${emailData.quoteNumber} - ${emailData.motorModel} ($${emailData.totalPrice?.toLocaleString()})`;
          htmlContent = generateAdminNotificationEmail(emailData);
          break;
        default:
          subject = `Your Mercury Motor Quote #${emailData.quoteNumber} from Harris Boat Works`;
          htmlContent = generateQuoteDeliveryEmail(emailData);
      }
    }

    // Prepare email options
    const emailOptions: {
      from: string;
      to: string[];
      replyTo: string;
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: string }>;
    } = {
      from: 'Harris Boat Works - Mercury Marine <noreply@hbwsales.ca>',
      to: [emailData.customerEmail],
      replyTo: 'info@harrisboatworks.ca',
      subject: subject,
      html: htmlContent,
    };

    // If PDF URL is provided, fetch and attach it
    if (emailData.pdfUrl) {
      try {
        console.log('Fetching PDF from:', emailData.pdfUrl);
        const pdfResponse = await fetch(emailData.pdfUrl);
        
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }
        
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = btoa(
          new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        emailOptions.attachments = [{
          filename: `Quote-${emailData.quoteNumber}.pdf`,
          content: pdfBase64,
        }];
        
        console.log('PDF attachment prepared, size:', pdfBuffer.byteLength, 'bytes');
      } catch (pdfError) {
        console.error('Error fetching/attaching PDF:', pdfError);
        // Continue sending email without attachment
      }
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send(emailOptions);

    console.log('Email sent successfully:', emailResponse);

    // Log the email activity
    await supabase
      .from('customer_quotes')
      .update({
        notes: `Email sent: ${emailData.emailType} on ${new Date().toISOString()}`
      })
      .eq('quote_number', emailData.quoteNumber);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        emailType: emailData.emailType 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-quote-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
