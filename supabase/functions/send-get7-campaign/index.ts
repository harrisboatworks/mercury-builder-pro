import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { buildEmail, detailsCard, esc } from "../_shared/email-layout.ts";


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

// Generate Get 7 email HTML using shared layout
const generateGet7EmailHtml = (data: {
  customerName?: string;
  motorModel?: string;
  motorHp?: number;
  rebateAmount?: number;
  expiryDate: string;
  promoUrl: string;
}) => {
  const { customerName, motorModel, motorHp, rebateAmount, expiryDate, promoUrl } = data;

  const rows: Array<{ label: string; value: string }> = [
    { label: "Warranty", value: "7-Year Factory Warranty (3 + 4 bonus years)" },
    { label: "Choose one", value: "6 months no payments, special financing from 2.99%, or up to $1,500 cash back" },
  ];
  if (motorModel) rows.push({ label: "Your motor", value: esc(motorModel) });
  if (rebateAmount && motorHp) {
    rows.push({ label: "Your rebate", value: `$${rebateAmount.toLocaleString()} on your ${motorHp}HP` });
  }
  rows.push({ label: "Offer ends", value: esc(expiryDate) });

  const body = `
    <p style="margin:0 0 14px 0;">${customerName ? `Hi ${esc(customerName)},` : "Hi there,"}</p>
    <p style="margin:0 0 14px 0;">Mercury's <strong>Get 7 plus Choose One</strong> is live. A 7-year factory warranty on qualifying outboards, plus your pick of one bonus offer.</p>

    <h2 style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#0f2a43;margin:28px 0 12px 0;font-weight:400;">What is included</h2>
    <div style="height:1px;background:#d9d3c7;line-height:1px;font-size:1px;margin:0 0 6px 0;">&nbsp;</div>
    ${detailsCard(rows)}
    <p style="margin:18px 0 0 0;color:#c8102e;font-weight:600;text-align:center;">Offer ends ${esc(expiryDate)}.</p>
    <p style="margin:22px 0 0 0;">Reply to this email or call <a href="tel:9053422153" style="color:#0f2a43;font-weight:600;">(905) 342-2153</a> if you want help applying it to your motor.</p>
  `;

  return buildEmail({
    preheader: `Mercury Get 7 plus your choice of bonus. Ends ${expiryDate}.`,
    eyebrow: "Mercury Get 7",
    heading: "Get 7 plus choose one bonus",
    bodyHtml: body,
    ctaText: "Build your quote",
    ctaUrl: promoUrl,
    unsubscribeUrl: `${promoUrl}/unsubscribe`,
  });
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
        from: "Harris Boat Works <promotions@mercuryrepower.ca>",
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

    const promoUrl = "https://mercuryrepower.ca/promotions";
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
