import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DepositConfirmationRequest {
  customerEmail: string;
  customerName: string;
  depositAmount: string;
  paymentId?: string;
  motorInfo?: {
    model?: string;
    hp?: number;
    year?: number;
  };
}

function logStep(step: string, data?: Record<string, unknown>) {
  console.log(`[DEPOSIT-EMAIL] ${step}`, data ? JSON.stringify(data) : "");
}

function generateReferenceNumber(paymentId?: string): string {
  if (paymentId) {
    // Extract last 8 characters of payment intent ID
    return `HBW-${paymentId.slice(-8).toUpperCase()}`;
  }
  return `HBW-${Date.now().toString(36).toUpperCase()}`;
}

function createDepositConfirmationEmail(
  customerName: string,
  depositAmount: string,
  referenceNumber: string,
  motorInfo?: { model?: string; hp?: number; year?: number }
): string {
  const appUrl = Deno.env.get("APP_URL") || "https://quote.harrisboatworks.ca";
  
  const motorDetails = motorInfo?.model 
    ? `<div class="motor-details">
        <h3>Motor Being Reserved:</h3>
        <p><strong>${motorInfo.year || 2025} ${motorInfo.model}</strong></p>
        ${motorInfo.hp ? `<p>${motorInfo.hp} Horsepower</p>` : ""}
       </div>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deposit Confirmation - Harris Boat Works</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #007DC5 0%, #1e40af 100%);
      padding: 24px 20px;
      text-align: center;
    }
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 30px;
      max-width: 600px;
      margin: 0 auto;
    }
    .logo {
      height: 50px;
      width: auto;
    }
    .tagline {
      color: #ffffff;
      font-size: 14px;
      margin-top: 12px;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 40px 32px;
      color: #374151;
      line-height: 1.6;
    }
    .success-banner {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      margin-bottom: 24px;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }
    .reference-number {
      font-size: 28px;
      font-weight: 700;
      color: #007DC5;
      font-family: 'Courier New', monospace;
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 12px;
      margin: 24px 0;
      border: 2px solid #007DC5;
    }
    .deposit-amount {
      font-size: 36px;
      font-weight: 700;
      color: #10b981;
      text-align: center;
      margin: 16px 0;
    }
    .motor-details {
      background-color: #f9fafb;
      border-left: 4px solid #007DC5;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .motor-details h3 {
      margin: 0 0 8px 0;
      color: #374151;
      font-size: 14px;
      font-weight: 600;
    }
    .motor-details p {
      margin: 4px 0;
      color: #1f2937;
    }
    .next-steps {
      background-color: #eff6ff;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .next-steps h3 {
      color: #1e40af;
      margin: 0 0 16px 0;
      font-size: 18px;
    }
    .next-steps ul {
      margin: 0;
      padding-left: 20px;
    }
    .next-steps li {
      margin: 8px 0;
      color: #374151;
    }
    .refund-policy {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .refund-policy h4 {
      margin: 0 0 8px 0;
      color: #92400e;
      font-size: 14px;
    }
    .refund-policy p {
      margin: 0;
      color: #78350f;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #007DC5 0%, #1e40af 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 125, 197, 0.3);
    }
    .trust-footer {
      background-color: #f9fafb;
      padding: 32px 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .badges-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 24px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-block;
      padding: 8px 16px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 12px;
      color: #374151;
      font-weight: 600;
    }
    .contact-info {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.8;
    }
    .contact-info a {
      color: #007DC5;
      text-decoration: none;
      font-weight: 500;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 24px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 24px 16px;
      }
      .header {
        padding: 20px 16px;
      }
      .logo-container {
        flex-direction: column;
        gap: 15px;
      }
      .badges-container {
        flex-direction: column;
        gap: 12px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-container">
        <img src="${appUrl}/email-assets/harris-logo.png" alt="Harris Boat Works" class="logo" />
        <img src="${appUrl}/email-assets/mercury-logo.png" alt="Mercury Marine" class="logo" />
      </div>
      <div class="tagline">Authorized Mercury Marine Dealer • Go Boldly</div>
    </div>
    
    <div class="content">
      <div class="success-banner">
        <div class="success-icon">✓</div>
        <h2 style="margin: 0; font-size: 24px;">Deposit Confirmed!</h2>
      </div>
      
      <p>Hi ${customerName},</p>
      
      <p>Great news! Your deposit has been successfully processed. Your motor is now reserved and we're excited to help you get on the water!</p>
      
      <div class="reference-number">
        Reference: ${referenceNumber}
      </div>
      
      <div class="deposit-amount">
        $${depositAmount} CAD
      </div>
      
      ${motorDetails}
      
      <div class="next-steps">
        <h3>📋 What Happens Next</h3>
        <ul>
          <li><strong>Within 24-48 hours:</strong> A member of our team will contact you to discuss delivery options and finalize your order.</li>
          <li><strong>Rigging appointment:</strong> We'll schedule a time to discuss installation details if applicable.</li>
          <li><strong>Balance payment:</strong> The remaining balance will be due upon delivery or pickup.</li>
        </ul>
      </div>
      
      <div class="refund-policy">
        <h4>💰 Refund Policy</h4>
        <p>Your deposit is fully refundable if you change your mind before delivery. Just give us a call and we'll process your refund promptly.</p>
      </div>
      
      <p style="text-align: center;">
        <a href="tel:905-342-2153" class="button">Call Us: (905) 342-2153</a>
      </p>
      
      <p>Thank you for choosing Harris Boat Works. We look forward to serving you!</p>
      
      <p>
        Best regards,<br>
        <strong>The Harris Boat Works Team</strong>
      </p>
    </div>
    
    <div class="trust-footer">
      <div class="badges-container">
        <div class="badge">🏆 Mercury CSI Award Winner</div>
        <div class="badge">✓ Certified Repower Center</div>
        <div class="badge">🇨🇦 Proudly Canadian</div>
      </div>
      <div class="contact-info">
        <strong>Harris Boat Works</strong><br>
        5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0<br>
        Phone: <a href="tel:905-342-2153">(905) 342-2153</a><br>
        Email: <a href="mailto:info@harrisboatworks.ca">info@harrisboatworks.ca</a>
      </div>
      <div class="divider"></div>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
        You received this email because you made a deposit payment at Harris Boat Works.
        Keep this email as your receipt.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, customerName, depositAmount, paymentId, motorInfo }: DepositConfirmationRequest = await req.json();

    logStep("Sending deposit confirmation email", {
      customerEmail,
      customerName,
      depositAmount,
      paymentId,
      motorInfo,
    });

    if (!customerEmail) {
      throw new Error("Customer email is required");
    }

    const referenceNumber = generateReferenceNumber(paymentId);
    const emailHtml = createDepositConfirmationEmail(customerName, depositAmount, referenceNumber, motorInfo);

    const emailResponse = await resend.emails.send({
      from: "Harris Boat Works <deposits@harrisboatworks.ca>",
      to: [customerEmail],
      subject: `Deposit Confirmed - Ref ${referenceNumber}`,
      html: emailHtml,
      // Also BCC the business for records
      bcc: ["info@harrisboatworks.ca"],
    });

    logStep("Email sent successfully", { emailResponse });

    return new Response(JSON.stringify({ success: true, referenceNumber }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logStep("ERROR: Failed to send email", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
