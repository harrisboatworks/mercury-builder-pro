import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PARTS_PAGE_URL = 'https://www.harrisboatworks.ca/mercuryparts';

interface PartInfo {
  partNumber: string;
  name: string | null;
  description: string | null;
  cadPrice: number | null;
  imageUrl: string | null;
  sourceUrl: string;
  fromCache: boolean;
}

// Common Mercury part patterns and known parts for quick lookup
const KNOWN_PARTS: Record<string, { name: string; description?: string }> = {
  '8M0151274': { name: 'Tiller Extension Handle', description: 'Adjustable tiller extension for comfortable steering' },
  '8M0060041': { name: 'Prop Nut Wrench', description: 'Propeller nut wrench tool' },
  '8M0155588': { name: 'Engine Oil - Synthetic Blend 25W-40', description: 'Quicksilver Full Synthetic Engine Oil' },
  '8M0152860': { name: 'Fuel Filter Kit', description: 'Water separating fuel filter' },
  '8M0162830': { name: 'Spark Plug', description: 'Mercury OEM spark plug' },
  '8M0157617': { name: 'Gear Lube', description: 'Premium gear lubricant' },
  '8M0188236': { name: 'Fuel Stabilizer', description: 'Quicksilver fuel stabilizer' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { partNumber } = await req.json();

    if (!partNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Part number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const cleanPartNumber = partNumber.trim().toUpperCase();

    console.log(`Looking up Mercury part: ${cleanPartNumber}`);

    // Check cache first
    const { data: cached } = await supabase
      .from('mercury_parts_cache')
      .select('*')
      .eq('part_number', cleanPartNumber)
      .single();

    if (cached && cached.cad_price) {
      console.log(`Cache hit for part ${cleanPartNumber}`);
      
      // Increment lookup count
      await supabase
        .from('mercury_parts_cache')
        .update({ lookup_count: (cached.lookup_count || 0) + 1 })
        .eq('part_number', cleanPartNumber);

      const result: PartInfo = {
        partNumber: cached.part_number,
        name: cached.name,
        description: cached.description,
        cadPrice: cached.cad_price,
        imageUrl: cached.image_url,
        sourceUrl: PARTS_PAGE_URL,
        fromCache: true
      };

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check known parts list
    const knownPart = KNOWN_PARTS[cleanPartNumber];
    
    // Return with part info if known, otherwise just the part number
    const result: PartInfo = {
      partNumber: cleanPartNumber,
      name: knownPart?.name || null,
      description: knownPart?.description || null,
      cadPrice: null, // Price must come from the live lookup
      imageUrl: null,
      sourceUrl: PARTS_PAGE_URL,
      fromCache: false
    };

    // Log this lookup for analytics
    await supabase
      .from('mercury_parts_cache')
      .upsert({
        part_number: cleanPartNumber,
        name: knownPart?.name || null,
        description: knownPart?.description || null,
        cad_price: null,
        image_url: null,
        source_url: PARTS_PAGE_URL,
        last_updated: new Date().toISOString(),
        lookup_count: 1
      }, { onConflict: 'part_number' });

    console.log(`Returning deep link for part ${cleanPartNumber}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: 'Use parts lookup for current CAD pricing'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Mercury parts lookup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
