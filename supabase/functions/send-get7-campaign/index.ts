import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");

// HP-based rebate matrix
const getRebateAmount = (hp: number): number => {
  if (hp >= 300) return 1500;
  if (hp >= 250) return 1000;
  if (hp >= 200) return 750;
  if (hp >= 150) return 500;
  if (hp >= 115) return 400;
  if (hp >= 75) return 300;
  if (hp >= 40) return 200;
  if (hp >= 2.5) return 100;
  return 0;
};

// Generate Get 7 email HTML
const generateGet7EmailHtml = (data: {
  customerName?: string;
  motorModel?: string;
  motorHp?: number;
  rebateAmount?: number;
  expiryDate: string;
  promoUrl: string;
}) => {
  const { customerName, motorModel, motorHp, rebateAmount, expiryDate, promoUrl } = data;
  
  const personalizedRebate = rebateAmount && motorHp 
    ? `<div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your ${motorHp}HP motor qualifies for</p>
        <p style="margin: 8px 0; font-size: 32px; font-weight: bold;">$${rebateAmount} Cash Back!</p>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mercury Get 7 + Choose One</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0c1929 100%); padding: 30px; text-align: center;">
      <img src="https://quote.harrisboatworks.ca/mercury-logo-white.png" alt="Mercury Marine" style="height: 40px; margin-bottom: 15px;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">GET 7 + CHOOSE ONE</h1>
      <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">Limited Time Offer • Ends ${expiryDate}</p>
    </div>
    
    <!-- Hero Banner -->
    <div style="background: url('https://quote.harrisboatworks.ca/assets/mercury-get-7-choose-one.jpg') center/cover; height: 200px; position: relative;">
      <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="font-size: 18px; color: #1f2937; margin: 0 0 20px 0;">
        ${customerName ? `Hi ${customerName},` : 'Hi there,'}
      </p>
      
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 25px 0;">
        Great news! Mercury Marine's <strong>Get 7 + Choose One</strong> promotion is now available. 
        Get a <strong>7-Year Factory Warranty</strong> on qualifying outboards, PLUS choose one bonus:
      </p>
      
      <!-- Three Options Grid -->
      <div style="display: flex; gap: 15px; margin: 25px 0;">
        <div style="flex: 1; background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">📅</div>
          <div style="font-weight: bold; color: #1e40af; font-size: 14px;">6 MONTHS</div>
          <div style="font-size: 12px; color: #64748b;">No Payments</div>
        </div>
        <div style="flex: 1; background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">💰</div>
          <div style="font-weight: bold; color: #166534; font-size: 14px;">FROM 2.99%</div>
          <div style="font-size: 12px; color: #64748b;">Special Financing</div>
        </div>
        <div style="flex: 1; background: #fefce8; border: 2px solid #eab308; border-radius: 12px; padding: 20px; text-align: center;">
          <div style="font-size: 24px; margin-bottom: 8px;">🎁</div>
          <div style="font-weight: bold; color: #a16207; font-size: 14px;">UP TO $1,500</div>
          <div style="font-size: 12px; color: #64748b;">Cash Rebate</div>
        </div>
      </div>
      
      ${personalizedRebate}
      
      ${motorModel ? `<p style="color: #6b7280; font-size: 14px; text-align: center; margin: 15px 0;">Based on your interest in: <strong>${motorModel}</strong></p>` : ''}
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${promoUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Build Your Quote →
        </a>
      </div>
      
      <!-- Urgency Banner -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0;">
        <p style="margin: 0; color: #dc2626; font-weight: bold;">
          ⏰ Offer ends ${expiryDate} — Don't miss out!
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #1f2937; color: #9ca3af; padding: 25px; text-align: center; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">Harris Boat Works • Your Trusted Mercury Dealer Since 1947</p>
      <p style="margin: 0 0 10px 0;">📍 1234 Marina Drive, Orillia, ON • 📞 (705) 555-0123</p>
      <p style="margin: 15px 0 0 0; font-size: 11px; color: #6b7280;">
        You're receiving this because you've shown interest in Mercury outboards.
        <a href="${promoUrl}/unsubscribe" style="color: #9ca3af;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
};

// Send email via Resend
const sendEmail = async (to: string, subject: string, html: string) => {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "Email not configured" };
  }
  
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Harris Boat Works <promotions@harrisboatworks.ca>",
        to: [to],
        subject,
        html,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      return { success: false, error };
    }
    
    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: String(error) };
  }
};

// Send SMS via Twilio
const sendSms = async (to: string, message: string) => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log("Twilio not configured, skipping SMS");
    return { success: false, error: "SMS not configured" };
  }
  
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Twilio error:", error);
      return { success: false, error };
    }
    
    const data = await response.json();
    return { success: true, sid: data.sid };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error: String(error) };
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      targetType = "all", // "all", "by_hp", "by_date"
      minHp,
      maxHp,
      sinceDays,
      sendEmail: shouldSendEmail = true,
      sendSms: shouldSendSms = false,
      testMode = false,
      testEmail,
      testPhone
    } = await req.json();

    console.log("Get7 Campaign request:", { targetType, minHp, maxHp, sinceDays, testMode });

    const promoUrl = "https://quote.harrisboatworks.ca/promotions";
    const expiryDate = "March 31, 2026";

    // Test mode - send to single recipient
    if (testMode) {
      const results = { email: null as any, sms: null as any };
      
      if (testEmail && shouldSendEmail) {
        const html = generateGet7EmailHtml({
          customerName: "Test Customer",
          motorModel: "Mercury 115 FourStroke",
          motorHp: 115,
          rebateAmount: 400,
          expiryDate,
          promoUrl,
        });
        results.email = await sendEmail(testEmail, "🎉 Mercury Get 7 + Choose One — Limited Time!", html);
      }
      
      if (testPhone && shouldSendSms) {
        const smsMessage = `🎉 Mercury Get 7 is HERE!

7-Year Warranty PLUS Choose One:
• 6 Months No Payments
• Special Financing from 2.99%
• Up to $1,500 Cash Back

Ends Mar 31, 2026!
Build your quote: ${promoUrl}

- Harris Boat Works
Reply STOP to unsubscribe`;
        results.sms = await sendSms(testPhone, smsMessage);
      }
      
      return new Response(JSON.stringify({ testMode: true, results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build query for customer quotes
    let query = supabase
      .from("customer_quotes")
      .select("id, customer_name, customer_email, customer_phone, motor_model_id, final_price, created_at, motor_models(model, horsepower)")
      .not("customer_email", "is", null);

    // Apply filters
    if (targetType === "by_date" && sinceDays) {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - sinceDays);
      query = query.gte("created_at", sinceDate.toISOString());
    }

    const { data: customers, error: queryError } = await query.limit(500);

    if (queryError) {
      console.error("Query error:", queryError);
      throw new Error(`Failed to fetch customers: ${queryError.message}`);
    }

    console.log(`Found ${customers?.length || 0} customers to contact`);

    // Filter by HP if specified
    let filteredCustomers = customers || [];
    if (targetType === "by_hp" && (minHp !== undefined || maxHp !== undefined)) {
      filteredCustomers = filteredCustomers.filter((c: any) => {
        const hp = c.motor_models?.horsepower || 0;
        if (minHp !== undefined && hp < minHp) return false;
        if (maxHp !== undefined && hp > maxHp) return false;
        return true;
      });
    }

    const results = {
      total: filteredCustomers.length,
      emailsSent: 0,
      smsSent: 0,
      errors: [] as string[],
    };

    // Send campaigns
    for (const customer of filteredCustomers) {
      const motorHp = (customer as any).motor_models?.horsepower || 0;
      const motorModel = (customer as any).motor_models?.model || null;
      const rebateAmount = getRebateAmount(motorHp);

      // Send email
      if (shouldSendEmail && customer.customer_email) {
        const html = generateGet7EmailHtml({
          customerName: customer.customer_name || undefined,
          motorModel,
          motorHp: motorHp || undefined,
          rebateAmount: rebateAmount || undefined,
          expiryDate,
          promoUrl,
        });
        
        const emailResult = await sendEmail(
          customer.customer_email,
          "🎉 Mercury Get 7 + Choose One — 7-Year Warranty + Your Choice of Bonus!",
          html
        );
        
        if (emailResult.success) {
          results.emailsSent++;
        } else {
          results.errors.push(`Email to ${customer.customer_email}: ${emailResult.error}`);
        }
      }

      // Send SMS
      if (shouldSendSms && customer.customer_phone) {
        const smsMessage = `🎉 ${customer.customer_name ? `Hi ${customer.customer_name}! ` : ''}Mercury Get 7 is HERE!

7-Year Warranty PLUS Choose One:
• 6 Months No Payments
• Financing from 2.99%
• Up to $1,500 Cash Back${rebateAmount ? `\n💰 Your motor: $${rebateAmount} rebate!` : ''}

Ends Mar 31! ${promoUrl}

- Harris Boat Works
Reply STOP to unsubscribe`;

        const smsResult = await sendSms(customer.customer_phone, smsMessage);
        
        if (smsResult.success) {
          results.smsSent++;
        } else {
          results.errors.push(`SMS to ${customer.customer_phone}: ${smsResult.error}`);
        }
      }

      // Rate limiting - small delay between sends
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("Campaign results:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Campaign error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
