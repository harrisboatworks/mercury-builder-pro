import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Input validation schema
const chatLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  phone: z.string().trim().min(7, "Phone is required").max(20, "Phone too long"),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  conversationContext: z.string().max(2000, "Context too long").optional(),
  currentPage: z.string().max(500, "Page URL too long").optional(),
  motorContext: z.object({
    model: z.string().max(100).optional(),
    hp: z.number().min(0).max(1000).optional(),
    price: z.number().min(0).max(1000000).optional(),
  }).optional(),
});

type ChatLeadData = z.infer<typeof chatLeadSchema>;

// Generate cryptographically secure session ID
function generateSecureSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return `chat_${Array.from(array, b => b.toString(16).padStart(2, '0')).join('')}`;
}

// Calculate lead score based on available data
function calculateLeadScore(data: ChatLeadData): number {
  let score = 25; // Base score for chat engagement
  
  if (data.name) score += 15;
  if (data.phone) score += 25;
  if (data.email) score += 15;
  if (data.motorContext?.model) score += 10;
  if (data.motorContext?.price && data.motorContext.price > 15000) score += 10;
  
  return Math.min(score, 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting: Check IP-based limits
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientIP,
      p_action: 'chat_lead',
      p_max_attempts: 5,
      p_window_minutes: 60
    });

    if (!allowed) {
      console.log(`[capture-chat-lead] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawData = await req.json();
    
    // Validate input data
    const validationResult = chatLeadSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.log('[capture-chat-lead] Validation failed:', validationResult.error.errors);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid input data',
        details: validationResult.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const leadData = validationResult.data;
    console.log('[capture-chat-lead] Processing lead:', leadData.name);

    const leadScore = calculateLeadScore(leadData);
    const sessionId = generateSecureSessionId();

    // Build notes from conversation context (sanitized via Zod validation)
    const notes = [
      leadData.conversationContext || 'Requested callback from AI chat',
      leadData.motorContext?.model ? `Interested in: ${leadData.motorContext.model}` : null,
      leadData.currentPage ? `Page: ${leadData.currentPage}` : null,
    ].filter(Boolean).join(' | ');

    // Save to customer_quotes table
    const { data: savedLead, error: saveError } = await supabase
      .from('customer_quotes')
      .insert({
        customer_name: leadData.name,
        customer_phone: leadData.phone,
        customer_email: leadData.email || null,
        lead_status: 'downloaded',
        lead_source: 'ai_chat',
        lead_score: leadScore,
        notes: notes,
        anonymous_session_id: sessionId,
        base_price: leadData.motorContext?.price || 0,
        final_price: leadData.motorContext?.price || 0,
        deposit_amount: 0,
        loan_amount: 0,
        monthly_payment: 0,
        term_months: 60,
        total_cost: leadData.motorContext?.price || 0,
        discount_amount: 0,
        penalty_applied: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('[capture-chat-lead] Error saving lead:', saveError);
      throw saveError;
    }

    console.log('[capture-chat-lead] Lead saved successfully:', savedLead.id);

    // Send SMS notification to admin
    const ADMIN_PHONE = Deno.env.get('ADMIN_PHONE');
    if (ADMIN_PHONE) {
      const smsMessage = `💬 CHAT LEAD!\n\nName: ${leadData.name}\nPhone: ${leadData.phone}${leadData.email ? `\nEmail: ${leadData.email}` : ''}\n\nContext: ${leadData.conversationContext || 'Requested callback'}${leadData.motorContext?.model ? `\nMotor: ${leadData.motorContext.model}` : ''}\n\nLead Score: ${leadScore}/100\n\nAction: Call within 24hrs!\n\n- Harris Boat Works AI`;

      try {
        const { error: smsError } = await supabase.functions.invoke('send-sms', {
          body: {
            to: ADMIN_PHONE,
            message: smsMessage,
            messageType: 'chat_lead'
          }
        });

        if (smsError) {
          console.error('[capture-chat-lead] SMS notification failed:', smsError);
        } else {
          console.log('[capture-chat-lead] SMS notification sent to admin');
        }
      } catch (smsErr) {
        console.error('[capture-chat-lead] SMS error:', smsErr);
      }
    } else {
      console.log('[capture-chat-lead] No ADMIN_PHONE configured, skipping SMS');
    }

    // Send email notification to admin
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      try {
        const emailHtml = `
          <h2>💬 New Chat Lead!</h2>
          <p>A customer requested a callback from the AI chat.</p>
          <hr>
          <p><strong>Name:</strong> ${leadData.name}</p>
          <p><strong>Phone:</strong> ${leadData.phone}</p>
          ${leadData.email ? `<p><strong>Email:</strong> ${leadData.email}</p>` : ''}
          <p><strong>Lead Score:</strong> ${leadScore}/100</p>
          <hr>
          <p><strong>Context:</strong> ${leadData.conversationContext || 'Requested callback'}</p>
          ${leadData.motorContext?.model ? `<p><strong>Motor Interest:</strong> ${leadData.motorContext.model} (${leadData.motorContext.hp}HP)</p>` : ''}
          ${leadData.currentPage ? `<p><strong>Page:</strong> ${leadData.currentPage}</p>` : ''}
          <hr>
          <p><em>Action: Call within 24 hours</em></p>
        `;

        const { Resend } = await import('npm:resend@2.0.0');
        const resend = new Resend(RESEND_API_KEY);

        await resend.emails.send({
          from: 'Harris Boat Works <system@hbwsales.ca>',
          to: ['info@harrisboatworks.ca'],
          reply_to: 'info@harrisboatworks.ca',
          subject: `💬 New Chat Lead: ${leadData.name}`,
          html: emailHtml
        });

        console.log('[capture-chat-lead] Email notification sent');
      } catch (emailErr) {
        console.error('[capture-chat-lead] Email error:', emailErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      leadId: savedLead.id,
      leadScore
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[capture-chat-lead] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
