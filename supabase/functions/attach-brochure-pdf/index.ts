import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Admin auth check
  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult instanceof Response) return authResult;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { url, apply_to = "all", family, keys, dry_run = false } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'url is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🔗 attach-brochure-pdf: ${url} → apply_to: ${apply_to}`)

    // Build the query based on apply_to parameter
    let query = supabase
      .from('motor_models')
      .select('id, model_key, family, source_doc_urls')
      .eq('is_brochure', true)

    if (apply_to === 'family' && family) {
      query = query.eq('family', family)
    } else if (apply_to === 'keys' && keys && keys.length > 0) {
      query = query.in('model_key', keys)
    }
    // For 'all', no additional filters needed

    const { data: models, error: queryError } = await query

    if (queryError) {
      console.error('Query error:', queryError)
      return new Response(
        JSON.stringify({ success: false, error: queryError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!models || models.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          models_matched: 0, 
          models_updated: 0, 
          dry_run,
          message: 'No matching brochure models found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (dry_run) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          models_matched: models.length, 
          models_updated: 0, 
          dry_run: true,
          message: `Would add PDF URL to ${models.length} models`,
          sample_models: models.slice(0, 5).map(m => m.model_key)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update models with the new PDF URL
    let updatedCount = 0
    const errors: string[] = []

    for (const model of models) {
      try {
        // Get current source_doc_urls or initialize as empty array
        let currentUrls = model.source_doc_urls || []
        
        // Ensure it's an array
        if (!Array.isArray(currentUrls)) {
          currentUrls = []
        }
        
        // Add new URL if not already present
        if (!currentUrls.includes(url)) {
          currentUrls.push(url)
          
          // Keep only the most recent 5 URLs
          if (currentUrls.length > 5) {
            currentUrls = currentUrls.slice(-5)
          }
          
          // Update the model
          const { error: updateError } = await supabase
            .from('motor_models')
            .update({ source_doc_urls: currentUrls })
            .eq('id', model.id)
          
          if (updateError) {
            console.error(`Error updating ${model.model_key}:`, updateError)
            errors.push(`${model.model_key}: ${updateError.message}`)
          } else {
            updatedCount++
          }
        }
      } catch (error) {
        console.error(`Error processing ${model.model_key}:`, error)
        errors.push(`${model.model_key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`✅ Updated ${updatedCount}/${models.length} models with PDF URL`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        models_matched: models.length, 
        models_updated: updatedCount,
        pdf_url: url,
        apply_to,
        family: apply_to === 'family' ? family : undefined,
        keys: apply_to === 'keys' ? keys : undefined,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('attach-brochure-pdf error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
