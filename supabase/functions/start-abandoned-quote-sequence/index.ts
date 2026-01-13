import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[start-abandoned-quote-sequence] Starting abandoned quote check");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Find saved quotes that are:
    // 1. Created more than 24 hours ago
    // 2. Not completed (no deposit/order)
    // 3. Have customer email
    // 4. Not already in an active email sequence
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);
    
    const { data: abandonedQuotes, error: fetchError } = await supabase
      .from("saved_quotes")
      .select("*")
      .lt("created_at", cutoffTime.toISOString())
      .not("customer_email", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`[start-abandoned-quote-sequence] Found ${abandonedQuotes?.length || 0} potential abandoned quotes`);

    let started = 0;
    let skipped = 0;

    for (const quote of abandonedQuotes || []) {
      // Check if this email already has an active abandoned_quote sequence
      const { data: existingSequence } = await supabase
        .from("email_sequence_queue")
        .select("id")
        .eq("email", quote.customer_email)
        .eq("sequence_type", "abandoned_quote")
        .in("status", ["active", "completed"])
        .single();

      if (existingSequence) {
        console.log(`[start-abandoned-quote-sequence] Skipping ${quote.customer_email} - already in sequence`);
        skipped++;
        continue;
      }

      // Parse quote state to extract relevant data
      const quoteState = quote.quote_state || {};
      const motor = quoteState.motor || {};
      const selectedPromoOption = quoteState.selectedPromoOption || null;
      
      // Calculate promo display value based on option and HP
      let promoDisplayValue = '';
      const hp = motor.horsepower || 0;
      
      if (selectedPromoOption === 'no_payments') {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + 6);
        promoDisplayValue = `Payments begin ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
      } else if (selectedPromoOption === 'special_financing') {
        promoDisplayValue = '2.99% APR';
      } else if (selectedPromoOption === 'cash_rebate') {
        if (hp >= 200) promoDisplayValue = '$750';
        else if (hp >= 115) promoDisplayValue = '$500';
        else if (hp >= 40) promoDisplayValue = '$300';
        else promoDisplayValue = '$200';
      }

      // Generate unsubscribe token
      const unsubscribeToken = crypto.randomUUID();

      // Calculate first email send time (send immediately or in 1 hour)
      const nextSendAt = new Date();
      nextSendAt.setHours(nextSendAt.getHours() + 1);

      // Get active promotion end date for urgency
      const { data: activePromo } = await supabase
        .from("promotions")
        .select("end_date, name, bonus_title")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .order("priority", { ascending: false })
        .limit(1)
        .single();

      // Create the email sequence entry
      const { error: insertError } = await supabase
        .from("email_sequence_queue")
        .insert({
          email: quote.customer_email,
          customer_name: quote.customer_name || null,
          sequence_type: "abandoned_quote",
          current_step: 0,
          emails_sent: 0,
          status: "active",
          next_send_at: nextSendAt.toISOString(),
          unsubscribe_token: unsubscribeToken,
          lead_id: quote.id,
          metadata: {
            // Quote details
            quoteId: quote.id,
            motorModel: motor.model || null,
            motorHP: hp,
            motorPrice: motor.price || null,
            // Promo selection
            selectedPromoOption,
            promoDisplayValue,
            // Active promotion info
            promoName: activePromo?.bonus_title || activePromo?.name || 'Mercury Get 7',
            promoEndDate: activePromo?.end_date || null,
            // Quote totals (if available)
            estimatedTotal: quoteState.runningTotal || null,
            // Source tracking
            source: 'abandoned_quote_cron',
            quoteCreatedAt: quote.created_at,
          },
        });

      if (insertError) {
        console.error(`[start-abandoned-quote-sequence] Error creating sequence for ${quote.customer_email}:`, insertError);
        continue;
      }

      console.log(`[start-abandoned-quote-sequence] Started sequence for ${quote.customer_email} (${motor.model || 'Unknown motor'})`);
      started++;
    }

    console.log(`[start-abandoned-quote-sequence] Complete. Started: ${started}, Skipped: ${skipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        started,
        skipped,
        total: abandonedQuotes?.length || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[start-abandoned-quote-sequence] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
