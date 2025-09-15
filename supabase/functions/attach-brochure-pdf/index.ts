import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { url, apply_to = 'all', family, keys, dry_run = false } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🔗 attach-brochure-pdf: ${url} → apply_to: ${apply_to}`)

    // Build the query for target models
    let query = supabase
      .from('motor_models')
      .select('id, model_key, model, family, source_doc_urls')
      .eq('is_brochure', true)

    if (apply_to === 'family' && family) {
      query = query.eq('family', family)
    } else if (apply_to === 'keys' && keys && keys.length > 0) {
      query = query.in('model_key', keys)
    }

    const { data: targetModels, error: queryError } = await query

    if (queryError) {
      console.error('Query error:', queryError)
      return new Response(
        JSON.stringify({ success: false, error: queryError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!targetModels || targetModels.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          models_matched: 0, 
          message: 'No matching models found',
          dry_run 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (dry_run) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          models_matched: targetModels.length, 
          message: `Would attach PDF to ${targetModels.length} models`,
          dry_run: true,
          sample_models: targetModels.slice(0, 5).map(m => ({ model_key: m.model_key, model: m.model }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update models with the PDF URL
    let updatedCount = 0
    for (const model of targetModels) {
      const currentUrls = Array.isArray(model.source_doc_urls) ? model.source_doc_urls : []
      
      // Check if URL already exists
      if (currentUrls.includes(url)) {
        continue
      }

      // Add new URL, keep max 5 entries
      const newUrls = [...currentUrls, url].slice(-5)

      const { error: updateError } = await supabase
        .from('motor_models')
        .update({ source_doc_urls: newUrls })
        .eq('id', model.id)

      if (updateError) {
        console.error(`Update error for model ${model.model_key}:`, updateError)
      } else {
        updatedCount++
      }
    }

    console.log(`✅ Updated ${updatedCount}/${targetModels.length} models with brochure PDF`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        models_matched: targetModels.length,
        models_updated: updatedCount,
        url,
        apply_to,
        family: family || null,
        keys_count: keys ? keys.length : null
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
