import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

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
  // Handle CORS preflight requests
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

    const siteUrl = Deno.env.get("SITE_URL") || "https://hbwsales.ca";
    
    // Use savedQuoteId for full quote restoration if available
    const quoteLink = savedQuoteId 
      ? `${siteUrl}/quote/saved/${savedQuoteId}`
      : `${siteUrl}/quote/saved/${quoteId}`;
    
    const myQuotesLink = `${siteUrl}/my-quotes`;
    
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(finalPrice);

    // Build the account access section only if user doesn't have an account
    const accountSection = includeAccountInfo ? `
      <div style="background: #e8f4fd; border: 1px solid #0066cc; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 12px 0; color: #0066cc; font-size: 16px;">🔐 Access Your Account</h3>
        <p style="margin: 0 0 15px 0; color: #555; font-size: 14px; line-height: 1.5;">
          We've created an account for you! Click the button below to sign in and access all your saved quotes anytime.
        </p>
        <div style="text-align: center;">
          <a href="${myQuotesLink}" 
             style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; font-size: 14px;">
            View My Quotes
          </a>
        </div>
        <p style="margin: 15px 0 0 0; color: #888; font-size: 12px; text-align: center;">
          Check your inbox for a separate sign-in link to access your account
        </p>
      </div>
    ` : '';

    const emailResponse = await resend.emails.send({
      from: "Harris Boat Works <quotes@hbwsales.ca>",
      to: [customerEmail],
      subject: `Your Saved Quote - ${motorModel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 3px solid #0066cc; padding-bottom: 10px;">
            Your Mercury Motor Quote is Saved!
          </h1>
          
          <p style="font-size: 16px; color: #555;">
            Hi ${customerName},
          </p>
          
          <p style="font-size: 16px; color: #555;">
            Thanks for configuring your Mercury motor quote! We've saved your configuration so you can return anytime.
          </p>
          
          <div style="background: #f5f5f5; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">Quote Summary</h2>
            <p style="margin: 5px 0; color: #555;"><strong>Motor:</strong> ${motorModel}</p>
            <p style="margin: 5px 0; color: #555;"><strong>Total Price:</strong> ${formattedPrice}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${quoteLink}" 
               style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
              View Your Saved Quote
            </a>
          </div>
          
          ${accountSection}
          
          <div style="background: #fffbf0; border: 1px solid #ffd700; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">🎁 Special Offers Available</h3>
            <p style="margin: 5px 0; color: #555; font-size: 14px;">
              Contact us to learn about current promotions and financing options!
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">Questions? We're Here to Help!</h3>
            <p style="color: #555; font-size: 14px; margin: 5px 0;">
              📧 Email: sales@hbwsales.ca
            </p>
            <p style="color: #555; font-size: 14px; margin: 5px 0;">
              📞 Phone: (705) 327-2002
            </p>
            <p style="color: #555; font-size: 14px; margin: 5px 0;">
              ⏰ Hours: Mon-Fri 9AM-5PM, Sat 9AM-3PM
            </p>
          </div>
          
          <p style="font-size: 14px; color: #888; margin-top: 30px; text-align: center;">
            This quote is valid for 30 days. Prices subject to change.
          </p>
        </div>
      `,
    });

    console.log('Saved quote email sent successfully:', emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending saved quote email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);