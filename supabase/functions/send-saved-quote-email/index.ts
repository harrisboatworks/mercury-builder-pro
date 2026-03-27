import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";
import { createBrandedEmailTemplate, createButtonHtml } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SavedQuoteEmailRequest {
  customerEmail: string;
  customerName: string;
  quoteId: string;
  savedQuoteId?: string;
  resumeToken?: string;
  motorModel: string;
  finalPrice: number;
  quoteData?: any;
  includeAccountInfo?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      customerEmail, 
      customerName, 
      quoteId,
      savedQuoteId,
      motorModel, 
      finalPrice,
      includeAccountInfo = false
    }: SavedQuoteEmailRequest = await req.json();

    console.log('Sending saved quote email to:', customerEmail);

    const siteUrl = Deno.env.get("SITE_URL") || "https://mercuryrepower.ca";
    
    const quoteLink = savedQuoteId 
      ? `${siteUrl}/quote/saved/${savedQuoteId}`
      : `${siteUrl}/quote/saved/${quoteId}`;
    
    const myQuotesLink = `${siteUrl}/my-quotes`;
    
    const formattedPrice = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
    }).format(finalPrice);

    const refNumber = (savedQuoteId || quoteId || '').slice(0, 8).toUpperCase();

    const accountSection = includeAccountInfo ? `
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #007DC5; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #007DC5; font-size: 16px;">🔐 Access Your Account</h3>
        <p style="margin: 0 0 15px 0; color: #374151; font-size: 14px; line-height: 1.5;">
          We've created an account for you! Sign in to access all your saved quotes anytime.
        </p>
        <div style="text-align: center;">
          ${createButtonHtml(myQuotesLink, 'View My Quotes')}
        </div>
        <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
          Check your inbox for a separate sign-in link to access your account
        </p>
      </div>
    ` : '';

    const emailContent = `
      <h1>Your Mercury Motor Quote is Saved!</h1>
      
      <p style="font-size: 16px; color: #374151;">
        Hi ${customerName},
      </p>
      
      <p style="font-size: 16px; color: #374151;">
        Thanks for configuring your Mercury motor quote! We've saved your configuration so you can return anytime.
      </p>

      <div class="reference-number">${refNumber}</div>
      <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: -16px;">Quote Reference Number</p>
      
      <div class="info-box">
        <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 18px;">Quote Summary</h2>
        <p style="margin: 5px 0; color: #374151;"><strong>Motor:</strong> ${motorModel}</p>
        <p style="margin: 5px 0; color: #374151;"><strong>Total Price:</strong> ${formattedPrice} CAD</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        ${createButtonHtml(quoteLink, 'View Your Saved Quote')}
      </div>
      
      ${accountSection}
      
      <h2 style="font-size: 16px; color: #111827;">Next Steps</h2>
      <ul style="color: #374151; font-size: 14px; line-height: 1.8; padding-left: 20px;">
        <li>Review your full quote details online anytime</li>
        <li>Contact us to discuss your repower project</li>
        <li>Ask about current promotions and financing options</li>
      </ul>
      
      <p style="font-size: 13px; color: #6b7280; margin-top: 30px; text-align: center;">
        This quote is valid for 30 days. Prices subject to change.
      </p>
    `;

    const html = createBrandedEmailTemplate(emailContent, `Your Mercury ${motorModel} quote has been saved`);

    const emailResponse = await resend.emails.send({
      from: "Harris Boat Works <quotes@hbwsales.ca>",
      to: [customerEmail],
      subject: `Your Saved Quote - ${motorModel}`,
      html,
    });

    console.log('Saved quote email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending saved quote email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
