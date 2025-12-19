import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildModelKey } from '../_shared/motor-helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  motor_id?: string;
  detail_url?: string;
}

interface ScrapeResult {
  description: string | null;
  features: string[];
  specifications: Record<string, unknown>;
  images: string[];
}

// Schema for FIRE-1 agent structured extraction
const motorDataSchema = {
  type: "object",
  properties: {
    description: { 
      type: "string", 
      description: "2-3 sentence conversational product description focusing on benefits and use cases. Do NOT include pricing." 
    },
    features: { 
      type: "array", 
      items: { type: "string" },
      description: "6-10 key features and benefits as concise bullet points"
    },
    specifications: {
      type: "object",
      properties: {
        displacement: { type: "string", description: "Engine displacement in cc or L" },
        cylinders: { type: "string", description: "Number of cylinders" },
        boreStroke: { type: "string", description: "Bore x stroke dimensions" },
        gearRatio: { type: "string", description: "Gear ratio" },
        weight: { type: "string", description: "Dry weight" },
        fuelSystem: { type: "string", description: "Fuel injection type (EFI, Carburetor, etc.)" },
        ignition: { type: "string", description: "Ignition system type" },
        exhaustSystem: { type: "string", description: "Exhaust system type" },
        engineType: { type: "string", description: "Engine type (inline, V, etc.)" },
        alternatorOutput: { type: "string", description: "Alternator output in amps" },
        recommendedFuel: { type: "string", description: "Recommended fuel type/octane" },
        oilCapacity: { type: "string", description: "Oil capacity" },
        coolingSystem: { type: "string", description: "Cooling system type" },
        propShaftHorsepower: { type: "string", description: "Prop shaft horsepower rating" },
        maxRPM: { type: "string", description: "Maximum RPM range" },
        shaftLengths: { type: "array", items: { type: "string" }, description: "Available shaft lengths" },
        steering: { type: "string", description: "Steering type" },
        tiltTrim: { type: "string", description: "Tilt and trim system" },
        starting: { type: "string", description: "Starting system (Electric/Manual)" },
        controls: { type: "string", description: "Control type (Remote/Tiller)" }
      },
      description: "Technical specifications extracted from the page"
    },
    images: {
      type: "array",
      items: { type: "string" },
      description: "Product image URLs (full absolute URLs only, no icons/logos/thumbnails)"
    }
  },
  required: ["description", "features", "specifications"]
};

function normalizeDetailUrl(input: string): string {
  const base = 'https://www.harrisboatworks.ca';
  if (!input) return '';
  try {
    let s = input.trim();
    // Fix duplicated domain pattern
    s = s.replace(/https?:\/\/(?:www\.)?harrisboatworks\.ca\/?https?:\/\/(?:www\.)?harrisboatworks\.ca/i, 'https://www.harrisboatworks.ca');
    const u = new URL(s.startsWith('http') ? s : s.startsWith('/') ? `${base}${s}` : `${base}/${s}`);
    // Remove duplicated host fragment in pathname and collapse slashes
    const dupHost = `//${u.host}`;
    let path = u.pathname.startsWith(dupHost) ? u.pathname.slice(dupHost.length) : u.pathname;
    path = path.replace(/\/+/, '/');
    const normalized = `${u.protocol}//${u.host}${path}${u.search}${u.hash}`;
    return normalized;
  } catch {
    return input.startsWith('/') ? `${base}${input}` : `${base}/${input}`;
  }
}

// Upload inventory image to storage and return URL
async function uploadInventoryImage(imageUrl: string, modelKey: string, supabase: any): Promise<string | null> {
  try {
    console.log(`Uploading inventory image for ${modelKey}:`, imageUrl);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const imageBlob = await response.blob();
    
    // Determine file extension
    let fileExtension = 'jpg';
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('png')) fileExtension = 'png';
    if (contentType?.includes('webp')) fileExtension = 'webp';
    
    // Upload to mercury/inventory/ path
    const fileName = `mercury/inventory/${modelKey}_${Date.now()}.${fileExtension}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('motor-images')
      .upload(fileName, imageBlob, {
        upsert: true,
        contentType: imageBlob.type
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('motor-images')
      .getPublicUrl(fileName);
    
    console.log(`Inventory image uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Failed to upload inventory image:', error);
    return null;
  }
}

// Poll for extraction completion - Firecrawl extract is async
async function pollForExtraction(jobId: string, apiKey: string, maxWaitMs = 60000): Promise<any> {
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < maxWaitMs) {
    attempts++;
    await new Promise(r => setTimeout(r, 2000)); // Wait 2 seconds between polls
    
    console.log(`[Firecrawl FIRE-1] Poll attempt ${attempts} for job ${jobId}`);
    
    const response = await fetch(`https://api.firecrawl.dev/v1/extract/${jobId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    if (!response.ok) {
      console.error(`[Firecrawl FIRE-1] Poll error: ${response.status}`);
      continue;
    }
    
    const result = await response.json();
    console.log(`[Firecrawl FIRE-1] Poll status: ${result.status}`);
    
    if (result.status === 'completed') {
      return result.data;
    }
    
    if (result.status === 'failed') {
      throw new Error(`Extraction failed: ${result.error || 'Unknown error'}`);
    }
  }
  
  throw new Error('Extraction timeout - exceeded 60 seconds');
}

// FIRE-1 agent extraction - replaces all manual regex parsing
async function scrapeWithFire1Agent(url: string, apiKey: string, modelName?: string): Promise<ScrapeResult> {
  console.log(`[Firecrawl FIRE-1] Extracting motor details from: ${url}`);
  
  const extractionPrompt = `
You are extracting outboard motor product information from a dealer or manufacturer website.
${modelName ? `The motor model is: ${modelName}` : ''}

EXTRACTION REQUIREMENTS:
1. Description: Write a 2-3 sentence conversational description focusing on what makes this motor special and ideal use cases. Do NOT include pricing information.

2. Features: Extract 6-10 key features and benefits. Format as concise bullet points. Include information about:
   - Fuel efficiency
   - Power and performance
   - Reliability features
   - Special technology (EFI, SmartCraft, etc.)

3. Specifications: Extract ALL technical specifications you can find, including:
   - Displacement (cc or L)
   - Number of cylinders
   - Bore x stroke
   - Gear ratio
   - Weight (dry weight, lbs or kg)
   - Fuel system type
   - Ignition system
   - Alternator output (amps)
   - Available shaft lengths
   - Maximum RPM
   - Starting system (electric/manual)
   - Control type (remote/tiller)

4. Images: Extract full product image URLs only. Exclude:
   - Icons, logos, navigation images
   - Thumbnails (URLs containing 'thumb', 'small', '-320')
   - Social media icons
   - Placeholder images

Be accurate and thorough. Only include information that is explicitly stated on the page.
`;

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        schema: motorDataSchema,
        prompt: extractionPrompt,
        enableWebSearch: false,
        allowExternalLinks: false,
        agent: {
          model: 'FIRE-1'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Firecrawl FIRE-1] API error: ${response.status} - ${errorText}`);
      throw new Error(`Firecrawl FIRE-1 API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Firecrawl FIRE-1] Initial response:`, JSON.stringify(data).substring(0, 500));
    
    if (!data.success) {
      throw new Error(data.error || 'Firecrawl FIRE-1 extraction failed');
    }

    // Handle async job - poll for completion if we get a job ID
    let extractedData;
    if (data.id && !data.data) {
      console.log(`[Firecrawl FIRE-1] Got job ID ${data.id}, polling for completion...`);
      const pollResult = await pollForExtraction(data.id, apiKey);
      extractedData = Array.isArray(pollResult) ? pollResult[0] : pollResult;
    } else {
      // Immediate result (shouldn't happen with FIRE-1 but handle it)
      extractedData = Array.isArray(data.data) ? data.data[0] : data.data;
    }
    
    if (!extractedData) {
      console.log('[Firecrawl FIRE-1] No data extracted, returning empty result');
      return {
        description: null,
        features: [],
        specifications: {},
        images: []
      };
    }

    // Flatten specifications object if nested
    let specifications = extractedData.specifications || {};
    if (specifications.specifications) {
      specifications = { ...specifications, ...specifications.specifications };
      delete specifications.specifications;
    }

    const result: ScrapeResult = {
      description: extractedData.description || null,
      features: Array.isArray(extractedData.features) ? extractedData.features : [],
      specifications,
      images: Array.isArray(extractedData.images) ? extractedData.images.filter((url: string) => 
        typeof url === 'string' && url.startsWith('http')
      ) : [],
    };

    console.log(`[Firecrawl FIRE-1] Extraction successful:`, {
      hasDescription: !!result.description,
      featuresCount: result.features.length,
      specsCount: Object.keys(result.specifications).length,
      imagesCount: result.images.length
    });

    return result;
    
  } catch (error) {
    console.error('[Firecrawl FIRE-1] Extraction error:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Supabase credentials' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Missing FIRECRAWL_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = (await req.json()) as ScrapeRequest;
    const motorId = body.motor_id?.trim();
    let detailUrl = body.detail_url?.trim() || '';
    let modelName: string | undefined;

    if (!detailUrl && motorId) {
      const { data: motor, error } = await supabase
        .from('motor_models')
        .select('id, detail_url, model')
        .eq('id', motorId)
        .single();
      if (error) throw error;
      detailUrl = (motor?.detail_url || '').trim();
      modelName = motor?.model ? String(motor.model).trim() : undefined;
    }

    // Normalize any malformed URLs
    detailUrl = normalizeDetailUrl(detailUrl);

    if (!detailUrl) {
      return new Response(JSON.stringify({ success: false, error: 'No detail_url provided or found for motor_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(JSON.stringify({ event: 'scrape_motor_details_start', motorId, detailUrl }));

    // Use FIRE-1 agent for extraction
    const result = await scrapeWithFire1Agent(detailUrl, FIRECRAWL_API_KEY, modelName);

    // Update DB if motor id provided
    if (motorId) {
      // Get existing motor data
      const { data: existingMotor } = await supabase
        .from('motor_models')
        .select('*')
        .eq('id', motorId)
        .single();

      const existingImages = Array.isArray(existingMotor?.images) ? existingMotor.images : [];
      const newImageUrls = result.images || [];
      
      // Determine if this is an in-stock page
      const isInStockPage = detailUrl.includes('inventory') || 
                           detailUrl.includes('stock') || 
                           result.description?.toLowerCase().includes('in stock');
      
      let updatedImages = existingImages;
      let setInStock = false;
      
      // If this is an in-stock page and we have a good main image, upload it
      if (isInStockPage && newImageUrls.length > 0) {
        const mainImage = newImageUrls[0];
        const modelKey = existingMotor?.model_key || 
          buildModelKey(existingMotor?.model || 'unknown');
        
        const inventoryImageUrl = await uploadInventoryImage(mainImage, modelKey, supabase);
        
        if (inventoryImageUrl) {
          updatedImages = [{
            url: inventoryImageUrl,
            type: 'inventory',
            source: 'scraped_inventory',
            scraped_at: new Date().toISOString()
          }, ...existingImages];
          setInStock = true;
        }
      }
      
      // Merge and deduplicate regular images
      for (const newUrl of newImageUrls) {
        const exists = updatedImages.some((img: any) => img.url === newUrl);
        if (!exists) {
          updatedImages.push({
            url: newUrl,
            type: newUrl.includes('detail') ? 'detail' : 
                  newUrl.includes('gallery') ? 'gallery' : 'main',
            source: 'scraped_fire1',
            scraped_at: new Date().toISOString()
          });
        }
      }

      // Prepare update data
      const updateData: Record<string, any> = {
        description: result.description,
        features: result.features,
        specifications: result.specifications,
        last_scraped: new Date().toISOString(),
        images: updatedImages.slice(0, 15),
        updated_at: new Date().toISOString()
      };
      
      if (setInStock) {
        updateData.in_stock = true;
      }

      // Smart merge for brochure records
      if (existingMotor && existingMotor.is_brochure && setInStock) {
        updateData.hero_image_url = existingMotor.hero_image_url;
        updateData.dealer_price = existingMotor.dealer_price;
        updateData.msrp = existingMotor.msrp;
        updateData.price_source = existingMotor.price_source;
        updateData.msrp_source = existingMotor.msrp_source;
        updateData.image_url = updatedImages[0]?.url || existingMotor.image_url;
        console.log(`Smart merging brochure record ${motorId} with inventory data`);
      }

      const { error: upErr } = await supabase
        .from('motor_models')
        .update(updateData)
        .eq('id', motorId);
      
      if (upErr) throw upErr;
      
      console.log(`Successfully updated motor ${motorId}${setInStock ? ' (marked as in-stock)' : ''}`);
    } else {
      // Update by detail_url
      const { error: upErr } = await supabase
        .from('motor_models')
        .update({
          description: result.description,
          features: result.features,
          specifications: result.specifications,
          images: result.images,
          updated_at: new Date().toISOString(),
        })
        .eq('detail_url', detailUrl);
      if (upErr) console.warn('Update by detail_url warning:', upErr?.message);
    }

    console.log(JSON.stringify({ event: 'scrape_motor_details_done', featuresCount: result.features.length, specsKeys: Object.keys(result.specifications).length }));

    return new Response(JSON.stringify({ 
      success: true, 
      motor_id: motorId || null, 
      detail_url: detailUrl,
      description: result.description,
      features: result.features,
      specifications: result.specifications,
      images: result.images
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('scrape-motor-details error', e);
    return new Response(JSON.stringify({ success: false, error: (e as Error).message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
