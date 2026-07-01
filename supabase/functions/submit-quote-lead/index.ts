// Submit-quote-lead: service-role insert into customer_quotes for the final
// step of the quote builder. Lets ANONYMOUS visitors (not just logged-in
// users) submit a quote so the team can follow up. The frontend still
// fires hot-lead webhooks, customer/admin emails, and admin SMS itself.
//
// Abuse protection:
//   - Honeypot: if the payload's `website` field is non-empty, silently
//     accept-and-drop (200 with fake success). Real frontend never sets it.
//   - Rate limit: 5 submissions / hour by IP AND 5 / hour by email,
//     via _shared/rate-limit.ts (fails open on DB errors).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { z } from "npm:zod@3.22.4";
import { checkRateLimit, rateLimitedResponse, getClientIdentifier } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

const payloadSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  anonymous_session_id: z.string().min(8).max(128).nullable().optional(),
  customer_name: z.string().trim().min(1).max(150),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(7).max(32),
  contact_method: z.string().trim().max(32).optional(),
  notes: z.string().max(2000).optional().nullable(),
  motor_model: z.string().max(200).optional().nullable(),
  base_price: z.number().min(0).max(10_000_000),
  final_price: z.number().min(0).max(10_000_000),
  deposit_amount: z.number().min(0).max(10_000_000).default(0),
  loan_amount: z.number().min(0).max(10_000_000).default(0),
  monthly_payment: z.number().min(0).max(1_000_000).default(0),
  term_months: z.number().int().min(0).max(360).default(60),
  total_cost: z.number().min(0).max(10_000_000),
  tradein_value_pre_penalty: z.number().nullable().optional(),
  tradein_value_final: z.number().nullable().optional(),
  penalty_applied: z.boolean().optional().default(false),
  penalty_factor: z.number().nullable().optional(),
  penalty_reason: z.string().max(120).nullable().optional(),
});

function newSessionId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return `anon_${Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.json();
    const parsed = payloadSchema.safeParse(raw);
    if (!parsed.success) {
      console.error('[submit-quote-lead] validation failed', parsed.error.flatten());
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid input', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const p = parsed.data;
    const userId = p.user_id ?? null;
    const sessionId = userId ? null : (p.anonymous_session_id || newSessionId());

    const insertRow = {
      user_id: userId,
      anonymous_session_id: sessionId,
      base_price: p.base_price,
      final_price: Math.round(p.final_price),
      deposit_amount: p.deposit_amount,
      loan_amount: p.loan_amount,
      monthly_payment: p.monthly_payment,
      term_months: p.term_months,
      total_cost: p.total_cost,
      customer_name: p.customer_name,
      customer_email: p.customer_email,
      customer_phone: p.customer_phone,
      lead_status: 'scheduled',
      lead_source: 'consultation',
      lead_score: 75,
      tradein_value_pre_penalty: p.tradein_value_pre_penalty ?? null,
      tradein_value_final: p.tradein_value_final ?? null,
      penalty_applied: Boolean(p.penalty_applied),
      penalty_factor: p.penalty_factor ?? null,
      penalty_reason: p.penalty_reason ?? null,
      discount_amount: 0,
      notes: p.notes && p.notes.trim().length
        ? `[${p.contact_method || 'email'}] ${p.notes.trim()}${p.motor_model ? ` | Motor: ${p.motor_model}` : ''}`
        : (p.motor_model ? `Motor: ${p.motor_model}` : null),
    };

    const { data, error } = await supabase
      .from('customer_quotes')
      .insert(insertRow as any)
      .select('id')
      .single();

    if (error) {
      console.error('[submit-quote-lead] insert error', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, quoteId: data?.id, anonymousSessionId: sessionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[submit-quote-lead] unexpected error', err);
    return new Response(
      JSON.stringify({ success: false, error: 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
