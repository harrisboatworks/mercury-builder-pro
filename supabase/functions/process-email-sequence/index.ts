import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") || "https://eutsoqdpjurknjsshxes.lovableproject.com";
const FUNCTIONS_URL = `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1`;

// Helper to wrap URLs with click tracking
const trackClick = (url: string, token: string, step: number) => 
  `${FUNCTIONS_URL}/track-email-event?type=click&token=${token}&step=${step}&url=${encodeURIComponent(url)}`;

// Helper to get tracking pixel
const trackingPixel = (token: string, step: number) => 
  `<img src="${FUNCTIONS_URL}/track-email-event?type=open&token=${token}&step=${step}" width="1" height="1" style="display:none" alt="" />`;

// Helper to format dates nicely
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'soon';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// Helper to calculate days until date
const daysUntil = (dateStr: string | null): number => {
  if (!dateStr) return 30;
  const now = new Date();
  const target = new Date(dateStr);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
};

// Email templates for the sequence
const emailTemplates = {
  // Email 2 - Day 3: Winter Repower Benefits (for repower_guide sequence)
  2: {
    subject: "❄️ Why Smart Boaters Repower in Winter",
    getHtml: (name: string | null, unsubscribeToken: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0;">Harris Boat Works</h1>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Mercury Dealer Since 1965</p>
    </div>
    
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
        The Winter Repower Advantage
      </h2>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${name ? `Hi ${name},` : 'Hi there,'}<br><br>
        Did you know that winter is actually the best time to repower your boat? Here's why experienced boaters schedule their repowers between November and March:
      </p>
      
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 2;">
          <li><strong>Skip the spring rush</strong> — No waiting when everyone else is scrambling</li>
          <li><strong>More technician attention</strong> — Slower season means more thorough work</li>
          <li><strong>Winter promotions</strong> — Manufacturers often offer the best deals</li>
          <li><strong>Ready for ice-out</strong> — Hit the water day one of the season</li>
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="color: white; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
          Current Mercury Promotions Available
        </p>
        <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 16px 0;">
          Extended warranty offers and special financing
        </p>
        <a href="${trackClick(`${APP_URL}/promotions`, unsubscribeToken, 2)}" style="display: inline-block; background: white; color: #1e40af; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">
          View Current Deals
        </a>
      </div>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">
        Want to discuss your options? Give us a call at <a href="tel:9053422153" style="color: #1e40af;">(905) 342-2153</a> or reply to this email.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 12px;">
        Harris Boat Works | 5369 Harris Boat Works Rd, Gores Landing, ON
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">
        <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
  ${trackingPixel(unsubscribeToken, 2)}
</body>
</html>
    `,
  },
  
  // Email 3 - Day 7: Personal Follow-up
  3: {
    subject: "Quick question about your boat",
    getHtml: (name: string | null, unsubscribeToken: string, hasBoat: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0;">Harris Boat Works</h1>
    </div>
    
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${name ? `Hi ${name},` : 'Hi,'}<br><br>
        ${hasBoat 
          ? `You mentioned you have a boat you're considering repowering. I wanted to personally reach out — do you have any questions about the process or pricing?`
          : `I noticed you downloaded our repower guide last week. Did you find it helpful? Is there anything specific you'd like to know more about?`
        }
      </p>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        A few things I can help with:
      </p>
      
      <ul style="color: #475569; font-size: 16px; line-height: 2; margin: 0 0 24px 20px; padding: 0;">
        <li>Getting a quick ballpark price for your specific boat</li>
        <li>Understanding which HP range makes sense</li>
        <li>Timing — planning for spring or taking advantage of winter pricing</li>
        <li>Trade-in value for your current motor</li>
      </ul>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        No pressure at all — just here to help if you have questions.
      </p>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
        <p style="color: #0f172a; font-weight: 600; margin: 0 0 8px 0;">
          Mike Harris
        </p>
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Harris Boat Works<br>
          📞 <a href="tel:9053422153" style="color: #1e40af;">(905) 342-2153</a><br>
          ✉️ <a href="mailto:info@harrisboatworks.ca" style="color: #1e40af;">info@harrisboatworks.ca</a>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 32px;">
        <a href="${trackClick(`${APP_URL}/quote/motor-selection`, unsubscribeToken, 3)}" style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
          Build Your Quote Online
        </a>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 11px;">
        <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
  ${trackingPixel(unsubscribeToken, 3)}
</body>
</html>
    `,
  },
  
  // ===== ABANDONED QUOTE SEQUENCE TEMPLATES =====
  // These use metadata from the quote for personalization
  
  // Email 4 (Step 1 for abandoned_quote) - Day 1: Quote Reminder
  4: {
    subject: "Your Mercury Quote is Waiting 🚤",
    getHtml: (name: string | null, unsubscribeToken: string, metadata: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0;">Harris Boat Works</h1>
      <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Mercury Dealer Since 1965</p>
    </div>
    
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
        Your Quote is Saved & Ready
      </h2>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${name ? `Hi ${name},` : 'Hi there,'}<br><br>
        You started building a quote for a <strong>${metadata?.motorModel || 'Mercury motor'}</strong> – great choice!
      </p>
      
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="color: #0f172a; font-weight: 600; margin: 0 0 12px 0;">Your quote includes:</p>
        <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 2;">
          <li>✓ <strong>7-Year Factory Warranty</strong> (3 + 4 FREE)</li>
          ${metadata?.selectedPromoOption ? `<li>✓ <strong>Your Selected Bonus:</strong> ${
            metadata.selectedPromoOption === 'no_payments' ? '6 Months No Payments' :
            metadata.selectedPromoOption === 'special_financing' ? `Special Financing at ${metadata.promoDisplayValue || '2.99% APR'}` :
            `Factory Cash Rebate: ${metadata.promoDisplayValue || 'Up to $750'}`
          }</li>` : ''}
          ${metadata?.motorPrice ? `<li>Motor Price: $${metadata.motorPrice.toLocaleString()}</li>` : ''}
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${trackClick(`${APP_URL}/quote/saved/${metadata?.quoteId || ''}`, unsubscribeToken, 4)}" style="display: inline-block; background: #1e40af; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Resume Your Quote →
        </a>
      </div>
      
      ${metadata?.promoEndDate ? `
      <p style="color: #dc2626; font-size: 14px; text-align: center; margin: 24px 0 0 0;">
        ⏰ This offer ends ${formatDate(metadata.promoEndDate)}
      </p>
      ` : ''}
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Questions? Call us at <a href="tel:9053422153" style="color: #1e40af;">(905) 342-2153</a> or reply to this email.
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 12px;">
        Harris Boat Works | 5369 Harris Boat Works Rd, Gores Landing, ON
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">
        <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
  ${trackingPixel(unsubscribeToken, 4)}
</body>
</html>
    `,
  },
  
  // Email 5 (Step 2 for abandoned_quote) - Day 3: Focus on Selected Bonus
  5: {
    getSubject: (metadata: any) => {
      if (metadata?.selectedPromoOption === 'cash_rebate') {
        return `Your ${metadata?.promoDisplayValue || '$500'} Mercury Rebate is Reserved ✓`;
      } else if (metadata?.selectedPromoOption === 'no_payments') {
        return '6 Months of Boating – No Payments Required';
      } else if (metadata?.selectedPromoOption === 'special_financing') {
        return `Lock in ${metadata?.promoDisplayValue || '2.99%'} Financing Before It Expires`;
      }
      return "Don't Miss Your Mercury Bonus Offer";
    },
    getHtml: (name: string | null, unsubscribeToken: string, metadata: any) => {
      const option = metadata?.selectedPromoOption;
      
      let bonusContent = '';
      if (option === 'cash_rebate') {
        bonusContent = `
          <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
            Your ${metadata?.promoDisplayValue || '$500'} Rebate is Reserved
          </h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            ${name ? `Hi ${name},` : 'Hi,'}<br><br>
            Quick reminder – your ${metadata?.motorHP || ''}HP motor qualifies for a <strong>${metadata?.promoDisplayValue || '$500'} factory cash rebate</strong> as part of Mercury's ${metadata?.promoName || 'Get 7'} promotion.
          </p>
          <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: white; font-size: 32px; font-weight: 700; margin: 0;">
              ${metadata?.promoDisplayValue || '$500'}
            </p>
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">
              Applied directly to your purchase
            </p>
          </div>
        `;
      } else if (option === 'no_payments') {
        bonusContent = `
          <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
            On the Water Now, Pay Later
          </h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            ${name ? `Hi ${name},` : 'Hi,'}<br><br>
            You chose the <strong>"6 Months No Payments"</strong> option – that means you can be on the water all season before making a single payment.
          </p>
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: white; font-size: 24px; font-weight: 700; margin: 0;">
              🕐 6 Months No Payments
            </p>
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">
              ${metadata?.promoDisplayValue || 'Enjoy the season payment-free'}
            </p>
          </div>
        `;
      } else if (option === 'special_financing') {
        bonusContent = `
          <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
            Special Financing Won't Last Forever
          </h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            ${name ? `Hi ${name},` : 'Hi,'}<br><br>
            Your quote includes Mercury's limited-time <strong>${metadata?.promoDisplayValue || '2.99%'} APR financing</strong> – one of the lowest rates of the year.
          </p>
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: white; font-size: 32px; font-weight: 700; margin: 0;">
              ${metadata?.promoDisplayValue || '2.99%'} APR
            </p>
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0 0;">
              Special promotional rate
            </p>
          </div>
        `;
      } else {
        bonusContent = `
          <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
            Complete Your Quote & Save
          </h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            ${name ? `Hi ${name},` : 'Hi,'}<br><br>
            Your ${metadata?.motorModel || 'Mercury motor'} quote is still waiting. Don't miss out on current promotions!
          </p>
        `;
      }
      
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0;">Harris Boat Works</h1>
    </div>
    
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${bonusContent}
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${trackClick(`${APP_URL}/quote/saved/${metadata?.quoteId || ''}`, unsubscribeToken, 5)}" style="display: inline-block; background: #0f172a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
          Resume Your Quote →
        </a>
      </div>
      
      <p style="color: #64748b; font-size: 14px; text-align: center;">
        Questions? Reply to this email or call <a href="tel:9053422153" style="color: #1e40af;">(905) 342-2153</a>
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 11px;">
        <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
  ${trackingPixel(unsubscribeToken, 5)}
</body>
</html>
      `;
    },
  },
  
  // Email 6 (Step 3 for abandoned_quote) - Day 7: Urgency/Last Chance
  6: {
    getSubject: (metadata: any) => {
      const days = daysUntil(metadata?.promoEndDate);
      return `⏰ Only ${days} Days Left – ${metadata?.promoName || 'Mercury Get 7'} Ends ${formatDate(metadata?.promoEndDate)}`;
    },
    getHtml: (name: string | null, unsubscribeToken: string, metadata: any) => {
      const days = daysUntil(metadata?.promoEndDate);
      
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; margin: 0;">Harris Boat Works</h1>
    </div>
    
    <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <p style="color: #dc2626; font-size: 18px; font-weight: 600; margin: 0;">
          ⏰ Only ${days} day${days === 1 ? '' : 's'} left
        </p>
      </div>
      
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px 0;">
        Last Chance: ${metadata?.promoName || 'Mercury Get 7'}
      </h2>
      
      <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        ${name ? `Hi ${name},` : 'Hi,'}<br><br>
        The ${metadata?.promoName || 'Mercury Get 7'} promotion ends <strong>${formatDate(metadata?.promoEndDate)}</strong> – that's just ${days} day${days === 1 ? '' : 's'} away.
      </p>
      
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <p style="color: #0f172a; font-weight: 600; margin: 0 0 12px 0;">
          Your saved quote for ${metadata?.motorModel || 'Mercury motor'} includes:
        </p>
        <ul style="color: #475569; margin: 0; padding-left: 20px; line-height: 2;">
          <li>✓ 7-Year Factory Warranty ($1,000+ value)</li>
          ${metadata?.selectedPromoOption ? `<li>✓ ${
            metadata.selectedPromoOption === 'no_payments' ? '6 Months No Payments' :
            metadata.selectedPromoOption === 'special_financing' ? `${metadata.promoDisplayValue || '2.99%'} APR Financing` :
            `${metadata.promoDisplayValue || '$500'} Factory Rebate`
          }</li>` : ''}
        </ul>
      </div>
      
      <p style="color: #dc2626; font-size: 16px; font-weight: 600; text-align: center; margin: 24px 0;">
        After ${formatDate(metadata?.promoEndDate)}, these offers expire.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${trackClick(`${APP_URL}/quote/saved/${metadata?.quoteId || ''}`, unsubscribeToken, 6)}" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 16px 36px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Complete Your Quote Now →
        </a>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 24px;">
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          Questions? Reply to this email or call <a href="tel:9053422153" style="color: #1e40af;">(905) 342-2153</a>
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #94a3b8; font-size: 12px;">
        Harris Boat Works | 5369 Harris Boat Works Rd, Gores Landing, ON
      </p>
      <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">
        <a href="${APP_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #94a3b8;">Unsubscribe</a>
      </p>
    </div>
  </div>
  ${trackingPixel(unsubscribeToken, 6)}
</body>
</html>
      `;
    },
  },
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[process-email-sequence] Starting sequence processing");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all active sequences that are due
    const now = new Date().toISOString();
    const { data: dueSequences, error: fetchError } = await supabase
      .from("email_sequence_queue")
      .select("*")
      .eq("status", "active")
      .lte("next_send_at", now)
      .order("next_send_at", { ascending: true })
      .limit(50); // Process in batches

    if (fetchError) {
      throw fetchError;
    }

    console.log(`[process-email-sequence] Found ${dueSequences?.length || 0} sequences to process`);

    let processed = 0;
    let errors = 0;

    for (const sequence of dueSequences || []) {
      try {
        const isAbandonedQuote = sequence.sequence_type === 'abandoned_quote';
        
        // For abandoned_quote, steps are 4, 5, 6 (maps to emails 1, 2, 3)
        // For repower_guide, steps are 2, 3
        const nextStep = isAbandonedQuote 
          ? (sequence.current_step === 0 ? 4 : sequence.current_step + 1)
          : sequence.current_step + 1;
          
        const maxStep = isAbandonedQuote ? 6 : 3;
        const template = emailTemplates[nextStep as keyof typeof emailTemplates];

        if (!template || nextStep > maxStep) {
          // Sequence complete
          await supabase
            .from("email_sequence_queue")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", sequence.id);
          
          console.log(`[process-email-sequence] Sequence ${sequence.id} completed`);
          continue;
        }

        // Get metadata for personalization
        const metadata = sequence.metadata || {};
        const hasBoat = metadata.hasBoatToRepower || false;
        
        // Generate email HTML based on sequence type
        let html: string;
        let subject: string;
        
        if (isAbandonedQuote) {
          // Abandoned quote templates have dynamic subjects and use metadata
          html = template.getHtml(sequence.customer_name, sequence.unsubscribe_token, metadata);
          subject = 'getSubject' in template 
            ? (template as any).getSubject(metadata) 
            : (template as any).subject;
        } else {
          // Repower guide templates
          html = nextStep === 3 
            ? template.getHtml(sequence.customer_name, sequence.unsubscribe_token, hasBoat)
            : template.getHtml(sequence.customer_name, sequence.unsubscribe_token);
          subject = (template as any).subject;
        }

        // Send email
        const emailResponse = await resend.emails.send({
          from: "Harris Boat Works <noreply@hbwsales.ca>",
          to: [sequence.email],
          replyTo: "info@harrisboatworks.ca",
          subject,
          html,
        });

        console.log(`[process-email-sequence] Email ${nextStep} sent to ${sequence.email}:`, emailResponse);

        // Calculate next send time based on sequence type
        let nextSendAt: string | null = null;
        
        if (isAbandonedQuote) {
          if (nextStep === 4) {
            // Email 5 is 2 days after Email 4 (Day 3 total)
            const next = new Date();
            next.setDate(next.getDate() + 2);
            nextSendAt = next.toISOString();
          } else if (nextStep === 5) {
            // Email 6 is 4 days after Email 5 (Day 7 total)
            const next = new Date();
            next.setDate(next.getDate() + 4);
            nextSendAt = next.toISOString();
          }
          // If nextStep === 6, no more emails
        } else {
          if (nextStep === 2) {
            // Email 3 is 4 days after Email 2 (Day 7 total)
            const next = new Date();
            next.setDate(next.getDate() + 4);
            nextSendAt = next.toISOString();
          }
          // If nextStep === 3, no more emails
        }

        // Update sequence
        await supabase
          .from("email_sequence_queue")
          .update({
            current_step: nextStep,
            emails_sent: sequence.emails_sent + 1,
            last_sent_at: new Date().toISOString(),
            next_send_at: nextSendAt,
            status: nextStep >= maxStep ? "completed" : "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sequence.id);

        processed++;
      } catch (emailError: any) {
        console.error(`[process-email-sequence] Error processing ${sequence.id}:`, emailError);
        
        // Mark as paused if too many errors
        await supabase
          .from("email_sequence_queue")
          .update({
            status: "paused",
            metadata: { 
              ...sequence.metadata, 
              lastError: emailError.message,
              errorAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", sequence.id);
        
        errors++;
      }
    }

    console.log(`[process-email-sequence] Completed. Processed: ${processed}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        total: dueSequences?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[process-email-sequence] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});