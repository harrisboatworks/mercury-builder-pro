import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// Lazy initialize Supabase client
async function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  return createClient(url, serviceKey);
}

// Extract model information from PDF text (simplified)
function extractModelsFromPdfText(text: string): Array<{family: string, horsepower: number}> {
  const models: Array<{family: string, horsepower: number}> = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Look for HP patterns
    const hpMatch = line.match(/(\d{1,3}(?:\.\d)?)\s*HP/i);
    if (hpMatch) {
      const horsepower = Number(hpMatch[1]);
      
      // Determine family from context
      let family = 'FourStroke';
      if (/PRO\s*XS/i.test(line)) family = 'ProXS';
      else if (/SEAPRO/i.test(line)) family = 'SeaPro';
      else if (/VERADO/i.test(line)) family = 'Verado';
      else if (/RACING/i.test(line)) family = 'Racing';
      
      models.push({ family, horsepower });
    }
  }
  
  return models;
}

// Simple PDF text extraction (for basic text-based PDFs only)
async function extractTextFromPdf(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    
    // Very basic text extraction - look for readable text patterns
    // This is a simplified approach and won't work for all PDFs
    const textMatches = text.match(/[A-Za-z0-9\s.,!?-]+/g) || [];
    return textMatches.join(' ');
  } catch (error) {
    console.warn('PDF text extraction failed, using URL as fallback:', error);
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { url, file_path, dry_run = false } = await req.json();
    
    if (!url && !file_path) {
      throw new Error('Either url or file_path must be provided');
    }
    
    const pdfUrl = url || file_path;
    console.log('Processing brochure PDF:', pdfUrl);
    
    // Try to extract models from PDF (simplified approach)
    let extractedModels: Array<{family: string, horsepower: number}> = [];
    
    try {
      const pdfText = await extractTextFromPdf(pdfUrl);
      extractedModels = extractModelsFromPdfText(pdfText);
      console.log(`Extracted ${extractedModels.length} models from PDF`);
    } catch (error) {
      console.warn('PDF extraction failed, will attach to all brochure models:', error);
    }
    
    const supabase = await getServiceClient();
    
    let matchingModels;
    if (extractedModels.length > 0) {
      // Match by family and horsepower
      const { data, error } = await supabase
        .from('motor_models')
        .select('id, model_key, family, horsepower, source_doc_urls')
        .eq('is_brochure', true)
        .in('family', [...new Set(extractedModels.map(m => m.family))])
        .in('horsepower', [...new Set(extractedModels.map(m => m.horsepower))]);
      
      if (error) throw error;
      matchingModels = data || [];
    } else {
      // Fallback: attach to all brochure models
      const { data, error } = await supabase
        .from('motor_models')
        .select('id, model_key, family, horsepower, source_doc_urls')
        .eq('is_brochure', true);
      
      if (error) throw error;
      matchingModels = data || [];
    }
    
    if (dry_run) {
      return new Response(JSON.stringify({
        success: true,
        dry_run: true,
        models_matched: matchingModels.length,
        extracted_models: extractedModels,
        preview: matchingModels.slice(0, 5).map(m => ({
          model_key: m.model_key,
          family: m.family,
          horsepower: m.horsepower
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Update models with PDF URL
    let updatedCount = 0;
    for (const model of matchingModels) {
      const currentUrls = model.source_doc_urls || [];
      
      // Check if URL already exists
      if (!currentUrls.includes(pdfUrl)) {
        const updatedUrls = [...currentUrls, pdfUrl];
        
        const { error } = await supabase
          .from('motor_models')
          .update({ source_doc_urls: updatedUrls })
          .eq('id', model.id);
        
        if (error) {
          console.error(`Failed to update model ${model.id}:`, error);
        } else {
          updatedCount++;
        }
      }
    }
    
    console.log(`Successfully linked PDF to ${updatedCount} models`);
    
    return new Response(JSON.stringify({
      success: true,
      models_matched: matchingModels.length,
      models_updated: updatedCount,
      pdf_url: pdfUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in attach-brochure-pdf:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});