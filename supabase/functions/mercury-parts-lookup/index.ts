import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

const CACHE_DURATION_HOURS = 48;
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
    const cacheExpiry = new Date();
    cacheExpiry.setHours(cacheExpiry.getHours() - CACHE_DURATION_HOURS);

    const { data: cached } = await supabase
      .from('mercury_parts_cache')
      .select('*')
      .eq('part_number', cleanPartNumber)
      .gte('last_updated', cacheExpiry.toISOString())
      .single();

    if (cached) {
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

    // If no Firecrawl key, return deep link fallback
    if (!firecrawlApiKey) {
      console.log('Firecrawl API key not configured, using deep link fallback');
      
      const result: PartInfo = {
        partNumber: cleanPartNumber,
        name: null,
        description: null,
        cadPrice: null,
        imageUrl: null,
        sourceUrl: PARTS_PAGE_URL,
        fromCache: false
      };

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result,
          message: 'Deep link fallback - Firecrawl not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try Firecrawl scrape with actions to interact with search form
    console.log(`Attempting Firecrawl scrape for part ${cleanPartNumber}`);
    
    try {
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: PARTS_PAGE_URL,
          formats: ['markdown', 'html'],
          waitFor: 2000,
          actions: [
            // Type the part number into the search field
            { type: 'fill', selector: 'input[name="keyword"], input[type="text"], #keyword, .search-input', value: cleanPartNumber },
            // Click the search button
            { type: 'click', selector: 'button[type="submit"], input[type="submit"], .search-button, #search-btn' },
            // Wait for results to load
            { type: 'wait', milliseconds: 1500 }
          ]
        }),
      });

      if (firecrawlResponse.ok) {
        const scrapeData = await firecrawlResponse.json();
        
        // Try to extract part information from the scraped content
        const markdown = scrapeData.data?.markdown || '';
        const html = scrapeData.data?.html || '';
        
        console.log(`Firecrawl returned ${markdown.length} chars of markdown`);
        
        // Parse the scraped data for part info
        let extractedPrice: number | null = null;
        let extractedName: string | null = null;
        let extractedImage: string | null = null;

        // Try to find price patterns like "$XX.XX" or "CAD $XX.XX"
        const priceMatch = markdown.match(/(?:CAD\s*)?\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i) ||
                          html.match(/(?:CAD\s*)?\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
        if (priceMatch) {
          extractedPrice = parseFloat(priceMatch[1].replace(',', ''));
          console.log(`Extracted price: $${extractedPrice}`);
        }

        // Try to find part name near the part number
        const partNumberPattern = new RegExp(`${cleanPartNumber}[\\s\\-:]*([^\\n\\$]{5,50})`, 'i');
        const nameMatch = markdown.match(partNumberPattern) || html.match(partNumberPattern);
        if (nameMatch) {
          extractedName = nameMatch[1].trim().replace(/<[^>]*>/g, '').substring(0, 100);
          console.log(`Extracted name: ${extractedName}`);
        }

        // Try to find image URL
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+(?:mercury|part|product)[^"']*\.(?:jpg|jpeg|png|gif|webp))["']/i) ||
                        html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|gif|webp))["']/i);
        if (imgMatch) {
          extractedImage = imgMatch[1];
          if (extractedImage && !extractedImage.startsWith('http')) {
            extractedImage = `https://www.harrisboatworks.ca${extractedImage.startsWith('/') ? '' : '/'}${extractedImage}`;
          }
          console.log(`Extracted image: ${extractedImage}`);
        }

        // Cache the result even if partial
        if (extractedPrice || extractedName || extractedImage) {
          await supabase
            .from('mercury_parts_cache')
            .upsert({
              part_number: cleanPartNumber,
              name: extractedName,
              cad_price: extractedPrice,
              image_url: extractedImage,
              source_url: PARTS_PAGE_URL,
              last_updated: new Date().toISOString(),
              lookup_count: 1
            }, { onConflict: 'part_number' });

          console.log(`Cached scraped data for part ${cleanPartNumber}`);
        }

        const result: PartInfo = {
          partNumber: cleanPartNumber,
          name: extractedName,
          description: null,
          cadPrice: extractedPrice,
          imageUrl: extractedImage,
          sourceUrl: PARTS_PAGE_URL,
          fromCache: false
        };

        return new Response(
          JSON.stringify({ success: true, data: result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('Firecrawl API error:', firecrawlResponse.status);
      }
    } catch (scrapeError) {
      console.error('Firecrawl scrape error:', scrapeError);
    }

    // Fallback: Return part number with deep link
    console.log(`Fallback to deep link for part ${cleanPartNumber}`);
    
    const result: PartInfo = {
      partNumber: cleanPartNumber,
      name: null,
      description: null,
      cadPrice: null,
      imageUrl: null,
      sourceUrl: PARTS_PAGE_URL,
      fromCache: false
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        message: 'Deep link fallback - scrape unsuccessful'
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
