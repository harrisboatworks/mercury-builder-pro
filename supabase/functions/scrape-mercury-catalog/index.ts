import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findMercurySpecs, getAvailableHpValues } from "../_shared/mercury-specs-database.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeResult {
  motorId: string;
  model: string;
  hp: number;
  success: boolean;
  source: 'perplexity' | 'firecrawl' | 'static-database' | 'failed';
  updatedFields: string[];
  error?: string;
}

// PROTECTED FIELDS - Never touch pricing from scraper
const PROTECTED_PRICE_FIELDS = ['price', 'msrp', 'basePrice', 'base_price', 'dealer_price', 'cost', 'sale_price'];

// Extract HP from model string
function extractHp(model: string): number | null {
  const hpMatch = model.match(/(\d+(?:\.\d+)?)\s*(?:hp|HP)/i);
  if (hpMatch) {
    return parseFloat(hpMatch[1]);
  }
  
  const patterns = [
    /^(\d+(?:\.\d+)?)\s+/,
    /\s(\d+(?:\.\d+)?)\s*$/,
    /(?:fourstroke|pro\s*xs|prokicker|verado)\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = model.match(pattern);
    if (match) {
      const num = parseFloat(match[1]);
      if (num >= 2 && num <= 600) {
        return num;
      }
    }
  }
  
  return null;
}

// Enhanced family detection
function extractFamily(model: string): string | null {
  const modelLower = model.toLowerCase();
  
  if (modelLower.includes('verado')) return 'Verado';
  if (modelLower.includes('pro xs') || modelLower.includes('proxs') || modelLower.includes('pro-xs')) return 'Pro XS';
  if (modelLower.includes('prokicker') || modelLower.includes('pro kicker')) return 'ProKicker';
  if (modelLower.includes('seapro') || modelLower.includes('sea pro') || modelLower.includes('sea-pro')) return 'SeaPro';
  if (modelLower.includes('command thrust') || modelLower.includes('ct')) return 'Command Thrust';
  if (modelLower.includes('sail power') || modelLower.includes('sailpower')) return 'Sail Power';
  if (modelLower.includes('fourstroke') || modelLower.includes('four stroke') || modelLower.includes('4-stroke')) return 'FourStroke';
  if (modelLower.includes('efi')) return 'FourStroke EFI';
  
  return null;
}

// Clean and validate description content
function cleanDescription(text: string | undefined | null): string | null {
  if (!text || typeof text !== 'string') return null;
  
  let cleaned = text;
  
  // Remove markdown images and links
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Reject promotional content
  const promotionalPatterns = [
    /step up to the all-new/i,
    /get the facts/i,
    /zero compromises/i,
    /mercury marine homepage/i,
    /browse our/i,
    /learn more about/i,
    /visit our/i,
    /click here/i,
    /^engines$/i,
    /^outboard$/i,
    /carousel/i,
    /banner/i,
    /\|\s*$/,
  ];
  
  for (const pattern of promotionalPatterns) {
    if (pattern.test(cleaned)) {
      return null;
    }
  }
  
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  const lines = cleaned.split(/[.!?]/).filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 20 && !trimmed.match(/^(home|engines|outboard|about|contact)/i);
  });
  
  cleaned = lines.join('. ').trim();
  if (cleaned && !cleaned.endsWith('.')) cleaned += '.';
  
  if (cleaned.length < 50) return null;
  if (cleaned.length > 1000) {
    cleaned = cleaned.substring(0, 1000);
    const lastPeriod = cleaned.lastIndexOf('.');
    if (lastPeriod > 500) {
      cleaned = cleaned.substring(0, lastPeriod + 1);
    }
  }
  
  return cleaned;
}

// Marketing buzzwords to filter out
const MARKETING_BUZZWORDS = [
  'innovative', 'cutting-edge', 'unmatched', 'revolutionary', 
  'industry-leading', 'best-in-class', 'state-of-the-art',
  'exceptional', 'outstanding', 'extraordinary', 'unparalleled',
  'world-class', 'next-generation', 'groundbreaking', 'game-changing',
  'premium quality', 'ultimate', 'unrivaled', 'superior performance'
];

// Check if text contains marketing buzzwords
function containsBuzzwords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return MARKETING_BUZZWORDS.some(bw => lowerText.includes(bw));
}

// Clean features array - filter out marketing speak
function cleanFeatures(features: any): string[] | null {
  if (!Array.isArray(features)) return null;
  
  const cleanedFeatures = features
    .filter((f): f is string => typeof f === 'string')
    .map(f => f.trim())
    .filter(f => {
      if (f.length < 10 || f.length > 200) return false;
      if (f.includes('http') || f.includes('[') || f.includes('](')) return false;
      if (/learn more|click|visit|browse|shop now/i.test(f)) return false;
      if (containsBuzzwords(f)) return false;
      return true;
    });
  
  return cleanedFeatures.length > 0 ? cleanedFeatures.slice(0, 12) : null;
}

// Clean key takeaways - ensure conversational tone
function cleanKeyTakeaways(takeaways: any): string[] | null {
  if (!Array.isArray(takeaways)) return null;
  
  const cleanedTakeaways = takeaways
    .filter((t): t is string => typeof t === 'string')
    .map(t => t.trim())
    .filter(t => {
      if (t.length < 15 || t.length > 150) return false;
      if (t.includes('http') || containsBuzzwords(t)) return false;
      // Prefer conversational starters
      return true;
    });
  
  return cleanedTakeaways.length > 0 ? cleanedTakeaways.slice(0, 6) : null;
}

// Validate scraped specifications are legitimate
function validateSpecs(specs: Record<string, any>): Record<string, any> {
  const validated: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(specs)) {
    // Skip price-related fields
    if (PROTECTED_PRICE_FIELDS.some(pf => key.toLowerCase().includes(pf))) {
      continue;
    }
    
    // Validate specific fields
    if (key === 'displacement' || key === 'cc') {
      const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.]/g, '')) : value;
      if (num && num > 50 && num < 10000) {
        validated.displacement = `${num} cc`;
      }
    } else if (key === 'cylinders') {
      const num = typeof value === 'number' ? value : parseInt(value);
      if (num && num >= 1 && num <= 8) {
        validated.cylinders = num;
      }
    } else if (key === 'weight' || key === 'dryWeight') {
      const numMatch = String(value).match(/(\d+)/);
      if (numMatch) {
        const weight = parseInt(numMatch[1]);
        if (weight > 20 && weight < 1500) {
          validated.weight = value;
        }
      }
    } else if (key === 'gearRatio') {
      if (/\d+\.?\d*\s*:\s*1/.test(String(value))) {
        validated.gearRatio = value;
      }
    } else if (value && typeof value === 'string' && value.length < 200) {
      validated[key] = value;
    } else if (typeof value === 'number') {
      validated[key] = value;
    }
  }
  
  return validated;
}

// Merge specs while protecting price fields
function mergeSpecs(existing: Record<string, any>, scraped: Record<string, any>): Record<string, any> {
  const merged = { ...existing };
  
  for (const [key, value] of Object.entries(scraped)) {
    // Never overwrite price fields
    if (PROTECTED_PRICE_FIELDS.some(pf => key.toLowerCase().includes(pf))) {
      continue;
    }
    merged[key] = value;
  }
  
  return merged;
}

// PRIORITY 1: Perplexity - PRIMARY source for structured specs with CONVERSATIONAL tone
async function searchWithPerplexity(hp: number, family: string | null, apiKey: string): Promise<{
  description?: string;
  keyTakeaways?: string[];
  features?: string[];
  specifications?: Record<string, any>;
} | null> {
  try {
    const motorName = `${hp}hp ${family || 'FourStroke'}`;
    console.log(`[Perplexity] Searching: Mercury ${motorName}`);
    
    // Determine motor category for better targeting
    const isSmallPortable = hp <= 15;
    const isMidRange = hp > 15 && hp <= 75;
    const isHighPower = hp > 75;
    
    const targetAudience = isSmallPortable 
      ? "cottage owners, tender users, small fishing boat owners" 
      : isMidRange 
        ? "pontoon owners, fishing enthusiasts, recreational boaters"
        : "serious anglers, performance boaters, offshore fishermen";
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: `You are a friendly, knowledgeable boat salesperson at a Mercury Marine dealership.
Your job is to explain motors in simple, engaging language - like you're chatting with a customer in the showroom.

Return ONLY valid JSON for a Mercury ${motorName}:
{
  "description": "Write 2-3 sentences like you're talking to a customer. Start with WHO this motor is perfect for (${targetAudience}). Then explain WHAT makes it great in everyday terms. Avoid buzzwords like 'innovative', 'cutting-edge', 'unmatched'. Use friendly phrases like 'you'll love', 'perfect for', 'great choice for'. Example tone: 'This is our go-to motor for cottage weekends - light enough to carry yourself and quiet enough to enjoy the water.'",
  
  "keyTakeaways": [
    "5-6 bullet points written like you're chatting with a friend",
    "Start each with an action verb or benefit",
    "Examples: 'Runs quietly so you won't spook the fish'",
    "'Light enough to throw in your truck by yourself'",
    "'Sips fuel - a tank lasts all weekend'",
    "'Starts first pull, every time'"
  ],
  
  "features": ["6-8 technical features for the specs section"],
  
  "specifications": {
    "displacement": "cc value",
    "cylinders": number,
    "boreStroke": "bore x stroke mm",
    "fuelSystem": "EFI or Carburetor",
    "startingType": "Manual/Electric",
    "weight": "lbs (kg)",
    "shaftLengths": ["15\\"", "20\\""],
    "gearRatio": "ratio:1",
    "alternatorOutput": "amp",
    "fullThrottleRPM": "RPM range"
  }
}

IMPORTANT TONE GUIDELINES:
- Write like you're explaining to a neighbor who just bought a fishing boat
- Focus on real benefits (quiet, light, reliable, fuel-efficient) not marketing claims
- Use "you" and "your" to make it personal
- Keep it simple - no jargon or spec-speak in descriptions
- Make the customer feel excited about owning this motor

Use ONLY official Mercury Marine specifications. No markdown, just JSON.
Do NOT include any pricing information.`
          },
          { role: 'user', content: `Tell me about the Mercury ${motorName} outboard motor - who is it for and why would someone love it?` }
        ],
        search_domain_filter: ['mercurymarine.com', 'boattest.com', 'boats.com', 'boatingmag.com'],
      }),
    });

    if (!response.ok) {
      console.log(`[Perplexity] Failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const result: any = {};
        
        const cleanedDesc = cleanDescription(parsed.description);
        if (cleanedDesc) result.description = cleanedDesc;
        
        const cleanedTakeaways = cleanKeyTakeaways(parsed.keyTakeaways);
        if (cleanedTakeaways) result.keyTakeaways = cleanedTakeaways;
        
        const cleanedFeatures = cleanFeatures(parsed.features);
        if (cleanedFeatures) result.features = cleanedFeatures;
        
        if (parsed.specifications && typeof parsed.specifications === 'object') {
          const validatedSpecs = validateSpecs(parsed.specifications);
          if (Object.keys(validatedSpecs).length > 0) {
            result.specifications = validatedSpecs;
          }
        }
        
        console.log(`[Perplexity] Got: desc=${!!result.description}, takeaways=${result.keyTakeaways?.length || 0}, features=${result.features?.length || 0}, specs=${Object.keys(result.specifications || {}).length}`);
        return Object.keys(result).length > 0 ? result : null;
      } catch (e) {
        console.log('[Perplexity] JSON parse failed');
      }
    }

    return null;
  } catch (error) {
    console.error('[Perplexity] Error:', error);
    return null;
  }
}

// PRIORITY 2: Firecrawl FIRE-1 Agent with structured spec extraction
async function scrapeWithFirecrawl(url: string, apiKey: string, hp: number, family: string | null): Promise<{
  description?: string;
  keyTakeaways?: string[];
  features?: string[];
  specifications?: Record<string, any>;
} | null> {
  try {
    const motorName = `${hp}hp ${family || 'FourStroke'}`;
    console.log(`[Firecrawl FIRE-1] Extracting specs for Mercury ${motorName} from: ${url}`);
    
    // Schema for structured extraction
    const specsSchema = {
      type: "object",
      properties: {
        description: { 
          type: "string", 
          description: "A 2-3 sentence product description focusing on who this motor is for and what makes it great. Use conversational, friendly tone. Avoid marketing buzzwords like 'innovative', 'cutting-edge', 'unmatched'. Do NOT include any pricing information."
        },
        keyTakeaways: { 
          type: "array", 
          items: { type: "string" },
          description: "5-6 bullet points highlighting key benefits in conversational tone. Start with action verbs. Examples: 'Runs quietly so you won't spook the fish', 'Light enough to carry yourself', 'Starts first pull, every time'."
        },
        features: { 
          type: "array", 
          items: { type: "string" },
          description: "6-8 technical features for the specifications section."
        },
        specifications: {
          type: "object",
          properties: {
            displacement: { type: "string", description: "Engine displacement in cc, e.g. '123 cc'" },
            cylinders: { type: "number", description: "Number of cylinders" },
            boreStroke: { type: "string", description: "Bore x Stroke in mm, e.g. '73 x 69 mm'" },
            fuelSystem: { type: "string", description: "Fuel system type, e.g. 'Electronic Fuel Injection'" },
            startingType: { type: "string", description: "Starting method, e.g. 'Electric' or 'Manual'" },
            weight: { type: "string", description: "Dry weight in lbs (kg), e.g. '352 lbs (160 kg)'" },
            shaftLengths: { type: "array", items: { type: "string" }, description: "Available shaft lengths, e.g. ['20\"', '25\"']" },
            gearRatio: { type: "string", description: "Gear ratio, e.g. '2.08:1'" },
            alternatorOutput: { type: "string", description: "Alternator output in amps, e.g. '60 amp'" },
            fullThrottleRPM: { type: "string", description: "Full throttle RPM range, e.g. '5000-6000'" },
            oilCapacity: { type: "string", description: "Oil capacity, e.g. '6 qts (5.7 L)'" },
            recommendedFuel: { type: "string", description: "Recommended fuel type" },
            steering: { type: "string", description: "Steering type" },
            trimMethod: { type: "string", description: "Trim/tilt method" }
          },
          description: "Technical specifications. Do NOT include any price, MSRP, cost, or dealer price information."
        }
      },
      required: ["description", "features", "specifications"]
    };
    
    const response = await fetch('https://api.firecrawl.dev/v1/extract', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: [url],
        agent: { model: 'FIRE-1' },
        schema: specsSchema,
        prompt: `Extract detailed specifications for this Mercury ${motorName} outboard motor.
        
IMPORTANT GUIDELINES:
- Write the description in a friendly, conversational tone - like a salesperson chatting with a customer
- Focus on WHO this motor is perfect for and WHY they would love it
- Avoid marketing buzzwords like 'innovative', 'cutting-edge', 'unmatched', 'revolutionary'
- Use specific, measurable benefits (quiet, light, fuel-efficient, reliable)
- NEVER include any pricing information (MSRP, dealer price, cost, etc.)
- Extract accurate technical specifications from the page
- If a spec is not available on the page, omit it rather than guessing`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Firecrawl FIRE-1] API error ${response.status}: ${errorText}`);
      return null;
    }

    const data = await response.json();
    
    // Handle FIRE-1 response structure
    const extractedData = data.data?.[0] || data.data || data;
    
    if (!extractedData || typeof extractedData !== 'object') {
      console.log('[Firecrawl FIRE-1] No extracted data');
      return null;
    }

    const result: { 
      description?: string; 
      keyTakeaways?: string[];
      features?: string[]; 
      specifications?: Record<string, any> 
    } = {};
    
    // Process description
    const cleanedDesc = cleanDescription(extractedData.description);
    if (cleanedDesc) {
      result.description = cleanedDesc;
    }
    
    // Process key takeaways
    const cleanedTakeaways = cleanKeyTakeaways(extractedData.keyTakeaways);
    if (cleanedTakeaways) {
      result.keyTakeaways = cleanedTakeaways;
    }
    
    // Process features
    const cleanedFeatures = cleanFeatures(extractedData.features);
    if (cleanedFeatures) {
      result.features = cleanedFeatures;
    }
    
    // Process specifications
    if (extractedData.specifications && typeof extractedData.specifications === 'object') {
      const validatedSpecs = validateSpecs(extractedData.specifications);
      if (Object.keys(validatedSpecs).length > 0) {
        result.specifications = validatedSpecs;
      }
    }
    
    console.log(`[Firecrawl FIRE-1] Extracted: desc=${!!result.description}, takeaways=${result.keyTakeaways?.length || 0}, features=${result.features?.length || 0}, specs=${Object.keys(result.specifications || {}).length}`);
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.error('[Firecrawl FIRE-1] Error:', error);
    return null;
  }
}

// Normalize spec key names to standard format
function normalizeSpecKey(key: string): string {
  const keyMap: Record<string, string> = {
    'displacement': 'displacement',
    'cc': 'displacement',
    'engine displacement': 'displacement',
    'horsepower': 'hp',
    'hp': 'hp',
    'cylinders': 'cylinders',
    'cylinder': 'cylinders',
    'bore and stroke': 'boreStroke',
    'bore stroke': 'boreStroke',
    'borestroke': 'boreStroke',
    'gear ratio': 'gearRatio',
    'gearratio': 'gearRatio',
    'dry weight': 'weight',
    'weight': 'weight',
    'dryweight': 'weight',
    'shaft length': 'shaftLengths',
    'shaftlength': 'shaftLengths',
    'alternator': 'alternatorOutput',
    'alternator output': 'alternatorOutput',
    'full throttle rpm': 'fullThrottleRPM',
    'wot rpm': 'fullThrottleRPM',
    'fuel system': 'fuelSystem',
    'fuel injection': 'fuelSystem',
    'starting': 'startingType',
    'start type': 'startingType',
    'oil capacity': 'oilCapacity',
    'fuel tank': 'fuelTankCapacity',
  };
  
  const normalized = key.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  return keyMap[normalized] || key.replace(/[^a-zA-Z0-9]/g, '');
}

// PRIORITY 3: Static database - FALLBACK only
function getStaticDatabaseData(hp: number, family: string | null): {
  description: string | null;
  features: string[] | null;
  specifications: Record<string, any> | null;
  url: string | null;
} | null {
  const staticSpecs = findMercurySpecs(hp, family || undefined);
  
  if (!staticSpecs) {
    console.log(`[Static] No specs for ${hp}hp ${family || 'FourStroke'}`);
    return null;
  }
  
  console.log(`[Static] Found fallback specs for ${hp}hp ${staticSpecs.family}`);
  
  return {
    description: staticSpecs.description,
    features: staticSpecs.features,
    specifications: staticSpecs.specifications,
    url: staticSpecs.url,
  };
}

// Construct Mercury URL based on HP and family
function constructMercuryUrl(hp: number, family: string | null): string | null {
  const baseUrl = 'https://www.mercurymarine.com/en/us/engines/outboard';
  
  if (family?.toLowerCase() === 'verado') {
    return `${baseUrl}/verado/${hp}hp/`;
  }
  if (family?.toLowerCase() === 'pro xs') {
    return `${baseUrl}/pro-xs/${hp}hp/`;
  }
  if (family?.toLowerCase() === 'prokicker') {
    return `${baseUrl}/prokicker/${hp}hp/`;
  }
  if (family?.toLowerCase() === 'seapro') {
    return `${baseUrl}/seapro/${hp}hp/`;
  }
  
  // FourStroke ranges
  if (hp <= 3.5) return `${baseUrl}/fourstroke/2-5hp-3-5hp/`;
  if (hp <= 6) return `${baseUrl}/fourstroke/4hp-6hp/`;
  if (hp <= 9.9) return `${baseUrl}/fourstroke/8hp-9-9hp/`;
  if (hp <= 20) return `${baseUrl}/fourstroke/15hp-20hp/`;
  if (hp <= 30) return `${baseUrl}/fourstroke/25hp-30hp/`;
  if (hp <= 60) return `${baseUrl}/fourstroke/40hp-60hp/`;
  if (hp <= 115) return `${baseUrl}/fourstroke/75hp-115hp/`;
  if (hp <= 150) return `${baseUrl}/fourstroke/150hp/`;
  if (hp <= 225) return `${baseUrl}/fourstroke/175hp-225hp/`;
  if (hp <= 300) return `${baseUrl}/fourstroke/250hp-300hp/`;
  
  return null;
}

// Check if existing description is promotional/garbage
function isPromotionalContent(text: string | null): boolean {
  if (!text) return false;
  
  const promotionalIndicators = [
    /step up to/i,
    /get the facts/i,
    /zero compromises/i,
    /!\[/,
    /\[.*\]\(/,
    /https?:\/\//,
    /browse our/i,
    /learn more/i,
  ];
  
  return promotionalIndicators.some(pattern => pattern.test(text));
}

// Main scrape function - NEW PRIORITY: Perplexity > Firecrawl > Static (fallback)
async function scrapeMotor(
  motor: any,
  supabase: any,
  firecrawlKey: string | undefined,
  perplexityKey: string | undefined,
  forceRefresh: boolean = false
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    motorId: motor.id,
    model: motor.model,
    hp: motor.horsepower || 0,
    success: false,
    source: 'failed',
    updatedFields: [],
  };

  // Extract HP if not in database
  if (!result.hp) {
    result.hp = extractHp(motor.model) || extractHp(motor.model_display || '') || 0;
  }

  if (!result.hp) {
    result.error = 'Could not determine HP';
    return result;
  }

  const family = extractFamily(motor.model) || extractFamily(motor.model_display || '');
  
  console.log(`\n=== Processing: ${motor.model} (${result.hp}hp ${family || 'FourStroke'}) ===`);
  
  let finalDescription: string | null = null;
  let finalKeyTakeaways: string[] | null = null;
  let finalFeatures: string[] | null = null;
  let finalSpecs: Record<string, any> | null = null;
  
  // ============ PRIORITY 1: PERPLEXITY (Primary Source) ============
  if (perplexityKey) {
    const perplexityData = await searchWithPerplexity(result.hp, family, perplexityKey);
    
    if (perplexityData) {
      if (perplexityData.description) {
        finalDescription = perplexityData.description;
        result.source = 'perplexity';
      }
      if (perplexityData.keyTakeaways) {
        finalKeyTakeaways = perplexityData.keyTakeaways;
      }
      if (perplexityData.features) {
        finalFeatures = perplexityData.features;
      }
      if (perplexityData.specifications) {
        finalSpecs = perplexityData.specifications;
      }
    }
  }
  
  // ============ PRIORITY 2: FIRECRAWL FIRE-1 (If missing data) ============
  if (firecrawlKey && (!finalDescription || !finalSpecs)) {
    const mercuryUrl = constructMercuryUrl(result.hp, family);
    
    if (mercuryUrl) {
      const firecrawlData = await scrapeWithFirecrawl(mercuryUrl, firecrawlKey, result.hp, family);
      
      if (firecrawlData) {
        if (!finalDescription && firecrawlData.description) {
          finalDescription = firecrawlData.description;
          result.source = result.source === 'failed' ? 'firecrawl' : result.source;
        }
        
        if (!finalKeyTakeaways && firecrawlData.keyTakeaways) {
          finalKeyTakeaways = firecrawlData.keyTakeaways;
        }
        
        if (!finalFeatures && firecrawlData.features) {
          finalFeatures = firecrawlData.features;
        }
        
        if (firecrawlData.specifications) {
          finalSpecs = mergeSpecs(finalSpecs || {}, firecrawlData.specifications);
        }
      }
    }
  }
  
  // ============ PRIORITY 3: STATIC DATABASE (Fallback) ============
  if (!finalDescription || !finalFeatures) {
    const staticData = getStaticDatabaseData(result.hp, family);
    
    if (staticData) {
      if (!finalDescription && staticData.description) {
        finalDescription = staticData.description;
        result.source = result.source === 'failed' ? 'static-database' : result.source;
      }
      
      if (!finalFeatures && staticData.features) {
        finalFeatures = staticData.features;
      }
      
      if (staticData.specifications) {
        // Static specs fill in gaps, don't override scraped data
        finalSpecs = mergeSpecs(staticData.specifications, finalSpecs || {});
      }
    }
  }
  
  // ============ PREPARE UPDATE ============
  if (!finalDescription && !finalFeatures && !finalSpecs && !finalKeyTakeaways) {
    result.error = 'No data from any source';
    return result;
  }
  
  const updateData: any = {};
  
  // Update description if new or refreshing
  if (finalDescription && (forceRefresh || !motor.description || motor.description.length < 50 || isPromotionalContent(motor.description))) {
    updateData.description = finalDescription;
    result.updatedFields.push('description');
  }
  
  // Update key takeaways (store in spec_json for now as custom field)
  if (finalKeyTakeaways && finalKeyTakeaways.length > 0) {
    const existingSpecJson = (motor.spec_json && typeof motor.spec_json === 'object') 
      ? motor.spec_json 
      : {};
    updateData.spec_json = { ...existingSpecJson, keyTakeaways: finalKeyTakeaways };
    result.updatedFields.push('keyTakeaways');
  }
  
  // Update features
  if (finalFeatures && finalFeatures.length > 0) {
    const existingFeatures = cleanFeatures(motor.features) || [];
    const allFeatures = [...new Set([...finalFeatures, ...existingFeatures])];
    
    if (forceRefresh || allFeatures.length > existingFeatures.length || existingFeatures.length === 0) {
      updateData.features = allFeatures.slice(0, 12);
      result.updatedFields.push('features');
    }
  }
  
  // Update specifications - NEVER touch price fields
  if (finalSpecs && Object.keys(finalSpecs).length > 0) {
    const existingSpecs = (motor.specifications && typeof motor.specifications === 'object') 
      ? motor.specifications 
      : {};
    
    // Preserve any existing price fields
    const pricePreserved: Record<string, any> = {};
    for (const key of Object.keys(existingSpecs)) {
      if (PROTECTED_PRICE_FIELDS.some(pf => key.toLowerCase().includes(pf))) {
        pricePreserved[key] = existingSpecs[key];
      }
    }
    
    const mergedSpecs = { ...existingSpecs, ...finalSpecs, ...pricePreserved };
    
    if (forceRefresh || Object.keys(mergedSpecs).length > Object.keys(existingSpecs).length) {
      updateData.specifications = mergedSpecs;
      result.updatedFields.push('specifications');
    }
  }
  
  // Perform update
  if (Object.keys(updateData).length > 0) {
    updateData.last_scraped = new Date().toISOString();
    updateData.last_enriched = new Date().toISOString();
    
    const { error } = await supabase
      .from('motor_models')
      .update(updateData)
      .eq('id', motor.id);

    if (error) {
      result.error = `Database update failed: ${error.message}`;
      return result;
    }
    
    result.success = true;
    console.log(`✓ Updated ${motor.model}: ${result.updatedFields.join(', ')} [${result.source}]`);
  } else {
    result.success = true;
    result.error = 'No new data to update';
    console.log(`- Skipped ${motor.model}: no changes needed`);
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const perplexityKey = Deno.env.get('PERPLEXITY_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { 
      batch_size = 10, 
      offset = 0,
      motor_id,
      prioritize_missing = true,
      background = false,
      refresh = false,
      clear_bad_data = false
    } = body;

    console.log('\n========== Mercury Catalog Scrape ==========');
    console.log('Config:', { 
      batch_size, 
      offset, 
      motor_id: motor_id || 'all',
      background,
      refresh,
      clear_bad_data,
      hasPerplexity: !!perplexityKey,
      hasFirecrawl: !!firecrawlKey,
    });
    console.log('Priority: Perplexity → Firecrawl FIRE-1 Agent → Static (fallback)');
    console.log('Protected fields (never updated):', PROTECTED_PRICE_FIELDS.join(', '));

    // Clear bad/promotional data if requested
    if (clear_bad_data) {
      console.log('\nClearing promotional descriptions...');
      const { data: badDescriptions, error: clearError } = await supabase
        .from('motor_models')
        .update({ 
          description: null, 
          features: null,
          last_scraped: null 
        })
        .eq('make', 'Mercury')
        .or('description.ilike.%step up to%,description.ilike.%get the facts%,description.ilike.%![%,description.ilike.%http%')
        .select('id');
      
      if (clearError) {
        console.error('Failed to clear bad data:', clearError);
      } else {
        console.log(`Cleared ${badDescriptions?.length || 0} motors with promotional content`);
      }
    }

    // Build query
    let query = supabase
      .from('motor_models')
      .select('id, model, model_display, horsepower, description, features, specifications, detail_url, family, motor_type')
      .eq('make', 'Mercury');

    if (motor_id) {
      query = query.eq('id', motor_id);
    } else if (refresh) {
      query = query
        .order('horsepower', { ascending: true })
        .range(offset, offset + batch_size - 1);
    } else if (prioritize_missing) {
      query = query
        .or('description.is.null,description.eq.,features.is.null')
        .order('horsepower', { ascending: true })
        .range(offset, offset + batch_size - 1);
    } else {
      query = query
        .order('horsepower', { ascending: true })
        .range(offset, offset + batch_size - 1);
    }

    const { data: motors, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch motors: ${error.message}`);
    }

    if (!motors || motors.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No motors to process',
          results: [],
          summary: { total: 0, updated: 0, failed: 0 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\nProcessing ${motors.length} motors...`);

    async function processMotors() {
      const results: ScrapeResult[] = [];
      
      for (const motor of motors) {
        const motorResult = await scrapeMotor(motor, supabase, firecrawlKey, perplexityKey, refresh);
        results.push(motorResult);
        
        // Delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      const summary = {
        total: results.length,
        updated: results.filter(r => r.success && r.updatedFields.length > 0).length,
        noChanges: results.filter(r => r.success && r.updatedFields.length === 0).length,
        failed: results.filter(r => !r.success).length,
        sources: {
          perplexity: results.filter(r => r.source === 'perplexity').length,
          firecrawl: results.filter(r => r.source === 'firecrawl').length,
          staticDatabase: results.filter(r => r.source === 'static-database').length,
        }
      };

      console.log('\n========== Scrape Completed ==========');
      console.log('Summary:', summary);
      return { results, summary };
    }

    if (background) {
      EdgeRuntime.waitUntil(processMotors());
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Background processing started for ${motors.length} motors`,
          motorsQueued: motors.length,
          next_offset: offset + batch_size,
          priority: 'Perplexity → Firecrawl FIRE-1 Agent → Static',
          protectedFields: PROTECTED_PRICE_FIELDS
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { results, summary } = await processMotors();

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${summary.total} motors: ${summary.updated} updated, ${summary.noChanges} unchanged`,
        results,
        summary,
        next_offset: offset + batch_size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
