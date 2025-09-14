import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';
import { Resend } from 'npm:resend@2.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuoteEmailRequest {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  motorModel: string;
  totalPrice: number;
  pdfUrl?: string;
  emailType: 'quote_delivery' | 'follow_up' | 'reminder';
}

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
              <p>Your detailed quote is attached as a PDF, or you can <a href="${data.pdfUrl}" class="btn">View Your Quote Online</a></p>
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

    const emailData: QuoteEmailRequest = await req.json();
    
    console.log('Sending email:', emailData);

    // Validate required fields
    if (!emailData.customerEmail || !emailData.customerName || !emailData.emailType) {
      throw new Error('Missing required email data');
    }

    let subject = '';
    let htmlContent = '';

    switch (emailData.emailType) {
      case 'quote_delivery':
        subject = `Your Mercury Motor Quote #${emailData.quoteNumber} is Ready!`;
        htmlContent = generateQuoteDeliveryEmail(emailData);
        break;
      case 'follow_up':
        subject = `Following up on your Mercury Motor quote #${emailData.quoteNumber}`;
        htmlContent = generateFollowUpEmail(emailData);
        break;
      case 'reminder':
        subject = `Reminder: Your Mercury Motor Quote #${emailData.quoteNumber} expires soon`;
        htmlContent = generateFollowUpEmail(emailData);
        break;
      default:
        throw new Error('Invalid email type');
    }

    // Send email via Resend with Reply-To header
    const emailResponse = await resend.emails.send({
      from: 'Harris Boat Works - Mercury Marine <noreply@hbwsales.ca>',
      to: [emailData.customerEmail],
      replyTo: 'info@harrisboatworks.ca', // Customer replies go to your business email
      subject: subject,
      html: htmlContent,
    });

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