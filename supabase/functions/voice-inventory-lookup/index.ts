import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse motor configuration from model display name
function parseMotorConfig(modelDisplay: string) {
  const code = (modelDisplay || '')
    .replace(/FourStroke|Verado|Pro\s*XS|SeaPro|ProKicker|EFI|Sail\s*Power|Command\s*Thrust/gi, '')
    .trim()
    .toUpperCase();
  
  // Extract HP
  const hpMatch = code.match(/^([\d.]+)/);
  const hp = hpMatch ? parseFloat(hpMatch[1]) : null;
  
  // Start type: M = Manual, E = Electric (motors 40HP+ default to electric)
  const startMatch = code.match(/^[\d.]+\s*([EM])/);
  let startType: 'electric' | 'manual' | 'unknown' = 'unknown';
  if (startMatch) {
    startType = startMatch[1] === 'E' ? 'electric' : 'manual';
  } else if (hp && hp >= 40) {
    startType = 'electric';
  }
  
  // Shaft length from code patterns
  // Default to short (15") if no L/XL suffix found
  // L = Long (20"), XL = Extra Long (25"), XXL = Extra Extra Long (30")
  // The H suffix indicates tiller control, NOT shaft length
  let shaftLength = 'short (15")';
  if (code.includes('XXL')) {
    shaftLength = 'extra-extra-long (30")';
  } else if (code.includes('XL')) {
    shaftLength = 'extra-long (25")';
  } else if (code.match(/[\d.]+\s*[EM]?L/) || code.includes('LH') || code.includes('LPT')) {
    // L suffix (including ELH, MLH, ELPT, etc.) = long shaft
    shaftLength = 'long (20")';
  }
  // If no L/XL pattern found, stays as 'short (15")'
  
  // Control type: H suffix = tiller, otherwise remote
  const isTiller = /[\d.]+\s*[EM]?[LXSM]*H(?!PT)/i.test(code) || 
                   code.includes('MH') || 
                   code.includes('EH') ||
                   code.includes('MLH') ||
                   code.includes('ELH');
  const controlType = isTiller ? 'tiller' : 'remote';
  
  return {
    startType,
    shaftLength,
    controlType,
    hasPowerTrim: code.includes('PT') || code.includes('ELPT') || code.includes('EXLPT'),
    isCommandThrust: modelDisplay.toLowerCase().includes('command thrust') || code.includes('CT'),
    isProKicker: modelDisplay.toLowerCase().includes('prokicker'),
  };
}

// Check if motor matches configuration filters
function matchesConfigFilters(config: ReturnType<typeof parseMotorConfig>, params: Record<string, unknown>): boolean {
  if (params?.start_type) {
    const wantedStart = String(params.start_type).toLowerCase();
    if (wantedStart === 'electric' && config.startType !== 'electric') return false;
    if (wantedStart === 'manual' && config.startType !== 'manual') return false;
  }
  
  if (params?.shaft_length) {
    const wantedShaft = String(params.shaft_length).toLowerCase();
    if (wantedShaft === 'short' && !config.shaftLength.includes('short')) return false;
    if (wantedShaft === 'long' && !config.shaftLength.includes('long (20')) return false;
    if (wantedShaft === 'extra-long' && !config.shaftLength.includes('extra-long')) return false;
  }
  
  if (params?.control_type) {
    const wantedControl = String(params.control_type).toLowerCase();
    if (wantedControl === 'tiller' && config.controlType !== 'tiller') return false;
    if (wantedControl === 'remote' && config.controlType !== 'remote') return false;
  }
  
  if (params?.has_power_trim === true && !config.hasPowerTrim) return false;
  
  return true;
}

// Format price for natural voice readout
function formatPriceForVoice(price: number | null | undefined): string | null {
  if (!price || price <= 0) return null;
  
  // Round to nearest dollar
  const rounded = Math.round(price);
  
  // Format naturally for voice: "$4,655" → "forty-six fifty-five dollars"
  // For prices over $1000, we want clear articulation
  if (rounded >= 10000) {
    // e.g., $12,345 → "twelve thousand three forty-five dollars"
    const thousands = Math.floor(rounded / 1000);
    const remainder = rounded % 1000;
    if (remainder === 0) {
      return `${thousands} thousand dollars`;
    } else if (remainder < 100) {
      return `${thousands} thousand ${remainder} dollars`;
    } else {
      const hundreds = Math.floor(remainder / 100);
      const tens = remainder % 100;
      if (tens === 0) {
        return `${thousands} thousand ${hundreds} hundred dollars`;
      }
      return `${thousands} thousand ${hundreds} ${tens.toString().padStart(2, '0')} dollars`;
    }
  } else if (rounded >= 1000) {
    // e.g., $4,655 → "four thousand six fifty-five dollars"
    const thousands = Math.floor(rounded / 1000);
    const remainder = rounded % 1000;
    if (remainder === 0) {
      return `${thousands} thousand dollars`;
    } else if (remainder < 100) {
      return `${thousands} thousand ${remainder} dollars`;
    } else {
      const hundreds = Math.floor(remainder / 100);
      const tens = remainder % 100;
      if (tens === 0) {
        return `${thousands} thousand ${hundreds} hundred dollars`;
      }
      return `${thousands} thousand ${hundreds} ${tens.toString().padStart(2, '0')} dollars`;
    }
  } else {
    // Under $1000 - just say it directly
    return `${rounded} dollars`;
  }
}

// Build motor object with parsed configuration
function buildMotorResponse(m: Record<string, unknown>) {
  const modelDisplay = (m.model_display || m.model) as string;
  const config = parseMotorConfig(modelDisplay);
  const price = (m.msrp || m.dealer_price) as number | null;
  
  return {
    model: modelDisplay,
    horsepower: m.horsepower,
    family: m.family,
    inStock: m.in_stock && ((m.stock_quantity as number) || 0) > 0,
    quantity: m.stock_quantity || 0,
    price: price,
    priceSpoken: formatPriceForVoice(price), // Natural voice readout
    availability: m.availability,
    // Decoded configuration
    startType: config.startType,
    shaftLength: config.shaftLength,
    controlType: config.controlType,
    hasPowerTrim: config.hasPowerTrim,
    isCommandThrust: config.isCommandThrust,
    isProKicker: config.isProKicker,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    console.log(`Voice inventory lookup: ${action}`, params);

    // Ultra-cheap warmup (avoids a DB query)
    if (action === 'ping') {
      return new Response(JSON.stringify({ result: { ok: true } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result: unknown;

    // Common spoken number to actual number mapping - shared across actions
    const spokenNumbers: Record<string, number> = {
      'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'eight': 8, 'nine': 9, 'ten': 10,
      'fifteen': 15, 'twenty': 20, 'twenty-five': 25, 'twentyfive': 25, 'thirty': 30,
      'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'seventy-five': 75, 'seventyfive': 75,
      'eighty': 80, 'ninety': 90, 'hundred': 100, 'one-fifteen': 115, 'onefifteen': 115,
      'one fifteen': 115, 'one-fifty': 150, 'onefifty': 150, 'one fifty': 150,
      'two-hundred': 200, 'twohundred': 200, 'two hundred': 200,
      'two-fifty': 250, 'twofifty': 250, 'two fifty': 250,
      'three-hundred': 300, 'threehundred': 300, 'three hundred': 300,
      '9.9': 9.9, 'nine point nine': 9.9, '3.5': 3.5, 'three point five': 3.5
    };

    // Helper function to extract HP from any string (user message, etc.)
    function extractHPFromText(text: string): number | null {
      if (!text) return null;
      const normalized = text.toLowerCase().trim();
      
      // Try spoken numbers first
      for (const [key, value] of Object.entries(spokenNumbers)) {
        if (normalized.includes(key)) {
          console.log(`[HP Extract] Found spoken number "${key}" = ${value}`);
          return value;
        }
      }
      
      // Try patterns like "20 HP", "20hp", "20 horsepower", "20-hp"
      const patterns = [
        /(\d+(?:\.\d+)?)\s*(?:hp|horse\s*power)/i,
        /(\d+(?:\.\d+)?)\s*-?\s*hp/i,
        /(\d+(?:\.\d+)?)\s+(?:outboard|motor|engine)/i
      ];
      
      for (const pattern of patterns) {
        const match = normalized.match(pattern);
        if (match) {
          const hp = parseFloat(match[1]);
          console.log(`[HP Extract] Pattern matched: "${match[0]}" = ${hp}`);
          return hp;
        }
      }
      
      return null;
    }

    switch (action) {
      case "check_inventory": {
        // Search inventory by horsepower, family, stock status
        let query = supabase
          .from("motor_models")
          .select("id, model, model_display, horsepower, family, in_stock, stock_quantity, msrp, dealer_price, availability")
          .order("horsepower", { ascending: true });

        // ROBUST PARAM PARSING: Handle cases where ElevenLabs sends params incorrectly
        // e.g., { horsepower: "FourStroke" } instead of { family: "FourStroke" }
        // or { horsepower: true } instead of { horsepower: 150 }
        let hpValue = params?.horsepower;
        let familyValue = params?.family;
        const userMessage = params?.user_message || params?.originalRequest || '';
        
        // Handle boolean misinterpretation: ElevenLabs sometimes sends horsepower as true/false instead of a number
        if (typeof hpValue === 'boolean') {
          console.warn(`[Param Fix] MISINTERPRETATION: horsepower received as boolean (${hpValue}) instead of number`);
          // Try to recover from user message
          if (userMessage) {
            const recoveredHP = extractHPFromText(userMessage);
            if (recoveredHP) {
              console.log(`[Param Fix] Recovered HP=${recoveredHP} from user message: "${userMessage}"`);
              hpValue = recoveredHP;
            } else {
              console.log(`[Param Fix] Could not recover HP from user message`);
              hpValue = null;
            }
          } else {
            hpValue = null;
          }
          
          // If we still have no HP and no other filters, ask for clarification
          if (!hpValue && !familyValue && !params?.in_stock && !params?.min_hp && !params?.max_hp) {
            result = {
              found: false,
              error: true,
              message: "I didn't catch the horsepower. Could you say that again? For example: 'Do you have any 150 horsepower motors?'"
            };
            break;
          }
        }
        
        // If horsepower looks like a family name, swap it and try to recover HP from user message
        if (typeof hpValue === 'string' && /^(FourStroke|Verado|Pro\s*XS|SeaPro|ProKicker)$/i.test(hpValue)) {
          console.warn(`[Param Fix] MISINTERPRETATION DETECTED: horsepower="${hpValue}" is a family name!`);
          familyValue = familyValue || hpValue;
          
          // Try to recover the actual HP from user message if provided
          if (userMessage) {
            const recoveredHP = extractHPFromText(userMessage);
            if (recoveredHP) {
              console.log(`[Param Fix] Recovered HP=${recoveredHP} from user message: "${userMessage}"`);
              hpValue = recoveredHP;
            } else {
              console.log(`[Param Fix] Could not recover HP from user message, proceeding with family-only search`);
              hpValue = null;
            }
          } else {
            console.log(`[Param Fix] No user message provided for HP recovery`);
            hpValue = null;
          }
        }
        
        // Try to parse spoken numbers to actual numbers
        if (typeof hpValue === 'string') {
          const normalizedHp = hpValue.toLowerCase().replace(/\s+/g, '-');
          if (spokenNumbers[normalizedHp]) {
            console.log(`[Param Fix] Converting spoken "${hpValue}" to number ${spokenNumbers[normalizedHp]}`);
            hpValue = spokenNumbers[normalizedHp];
          } else if (/^\d+(\.\d+)?$/.test(hpValue)) {
            // Parse numeric string
            hpValue = parseFloat(hpValue);
          } else {
            // Try to extract any number from the string
            const numMatch = hpValue.match(/(\d+(?:\.\d+)?)/);
            if (numMatch) {
              console.log(`[Param Fix] Extracted number ${numMatch[1]} from "${hpValue}"`);
              hpValue = parseFloat(numMatch[1]);
            } else {
              console.log(`[Param Fix] Could not parse HP from "${hpValue}", ignoring`);
              hpValue = null;
            }
          }
        }
        
        if (hpValue && typeof hpValue === 'number') {
          query = query.eq("horsepower", hpValue);
        }
        if (familyValue) {
          query = query.ilike("family", `%${familyValue}%`);
        }
        if (params?.in_stock === true) {
          query = query.eq("in_stock", true).gt("stock_quantity", 0);
        }
        if (params?.min_hp) {
          query = query.gte("horsepower", params.min_hp);
        }
        if (params?.max_hp) {
          query = query.lte("horsepower", params.max_hp);
        }

        // Fetch more results to allow for config filtering
        const { data, error } = await query.limit(50);
        
        if (error) throw error;

        if (!data || data.length === 0) {
          // Provide helpful response based on what was searched
          const searchedFor = hpValue ? `${hpValue} HP` : familyValue ? `${familyValue} motors` : 'your criteria';
          result = { 
            found: false, 
            message: `No motors found matching ${searchedFor}.`,
            searchedHP: hpValue,
            searchedFamily: familyValue
          };
        } else {
          // Build motor objects with config and apply config filters
          let motors = data
            .map(m => buildMotorResponse(m))
            .filter(motor => {
              const config = parseMotorConfig(motor.model);
              return matchesConfigFilters(config, params);
            })
            .slice(0, 10);

          if (motors.length === 0) {
            result = { 
              found: false, 
              message: "No motors found matching those specific configuration requirements.",
              hint: "Try relaxing the shaft length or start type requirements."
            };
          } else {
            result = { 
              found: true, 
              count: motors.length,
              motors,
              searchedHP: hpValue,
              searchedFamily: familyValue,
              summary: `Found ${motors.length} motor${motors.length > 1 ? 's' : ''} matching your criteria.`
            };
          }
        }
        break;
      }

      case "get_motor_price": {
        // Look up specific motor pricing
        const { data, error } = await supabase
          .from("motor_models")
          .select("model, model_display, horsepower, msrp, dealer_price, sale_price, in_stock, stock_quantity")
          .or(`model_display.ilike.%${params?.model || ''}%,model.ilike.%${params?.model || ''}%`)
          .limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
          result = { found: false, message: `No motor found matching "${params?.model}".` };
        } else {
          const motor = data[0];
          const config = parseMotorConfig(motor.model_display || motor.model);
          result = {
            found: true,
            model: motor.model_display || motor.model,
            horsepower: motor.horsepower,
            msrp: motor.msrp,
            salePrice: motor.sale_price,
            inStock: motor.in_stock && (motor.stock_quantity || 0) > 0,
            ...config,
          };
        }
        break;
      }

      case "check_availability": {
        // Check if a specific motor is in stock
        const { data, error } = await supabase
          .from("motor_models")
          .select("model, model_display, horsepower, in_stock, stock_quantity, availability")
          .or(`model_display.ilike.%${params?.model || ''}%,model.ilike.%${params?.model || ''}%`)
          .limit(5);

        if (error) throw error;

        if (!data || data.length === 0) {
          result = { found: false, message: `No motor found matching "${params?.model}".` };
        } else {
          const motor = data[0];
          const config = parseMotorConfig(motor.model_display || motor.model);
          const inStock = motor.in_stock && (motor.stock_quantity || 0) > 0;
          result = {
            found: true,
            model: motor.model_display || motor.model,
            horsepower: motor.horsepower,
            inStock,
            quantity: motor.stock_quantity || 0,
            availability: motor.availability || (inStock ? "In Stock" : "Out of Stock"),
            ...config,
          };
        }
        break;
      }

      case "list_in_stock": {
        // Get all in-stock motors
        const { data, error } = await supabase
          .from("motor_models")
          .select("model, model_display, horsepower, family, stock_quantity, msrp")
          .eq("in_stock", true)
          .gt("stock_quantity", 0)
          .order("horsepower", { ascending: true })
          .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
          result = { found: false, message: "No motors currently in stock." };
        } else {
          // Apply config filters if provided
          let motors = data
            .map(m => buildMotorResponse(m))
            .filter(motor => {
              const config = parseMotorConfig(motor.model);
              return matchesConfigFilters(config, params);
            })
            .slice(0, 20);

          if (motors.length === 0) {
            result = { 
              found: false, 
              message: "No in-stock motors match those configuration requirements." 
            };
          } else {
            result = {
              found: true,
              count: motors.length,
              motors,
              summary: `${motors.length} motor${motors.length > 1 ? 's' : ''} currently in stock.`
            };
          }
        }
        break;
      }

      case "get_hp_range": {
        // Get motors in a horsepower range
        const minHp = params?.min_hp || 0;
        const maxHp = params?.max_hp || 999;
        
        const { data, error } = await supabase
          .from("motor_models")
          .select("model, model_display, horsepower, family, in_stock, stock_quantity, msrp")
          .gte("horsepower", minHp)
          .lte("horsepower", maxHp)
          .order("horsepower", { ascending: true })
          .limit(50);

        if (error) throw error;

        if (!data || data.length === 0) {
          result = { found: false, message: `No motors found between ${minHp} and ${maxHp} HP.` };
        } else {
          // Apply config filters if provided
          let motors = data
            .map(m => buildMotorResponse(m))
            .filter(motor => {
              const config = parseMotorConfig(motor.model);
              return matchesConfigFilters(config, params);
            })
            .slice(0, 15);

          if (motors.length === 0) {
            result = { 
              found: false, 
              message: `No motors between ${minHp} and ${maxHp} HP match those configuration requirements.` 
            };
          } else {
            result = {
              found: true,
              count: motors.length,
              motors,
              summary: `Found ${motors.length} motor${motors.length > 1 ? 's' : ''} between ${minHp} and ${maxHp} HP.`
            };
          }
        }
        break;
      }

      case "get_motor_for_quote": {
        // Get full motor data for adding to quote
        const { data, error } = await supabase
          .from("motor_models")
          .select("id, model, model_display, horsepower, msrp, sale_price, in_stock, stock_quantity")
          .or(`model_display.ilike.%${params?.model || ''}%,model.ilike.%${params?.model || ''}%`)
          .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
          result = { found: false, message: `No motor found matching "${params?.model}".` };
        } else {
          const m = data[0];
          result = {
            found: true,
            motor: {
              id: m.id,
              model: m.model_display || m.model,
              horsepower: m.horsepower,
              msrp: m.msrp,
              salePrice: m.sale_price,
              inStock: m.in_stock && (m.stock_quantity || 0) > 0,
            }
          };
        }
        break;
      }

      case "compare_motors": {
        // Compare two motors side by side
        const motor1Query = params?.motor1 || '';
        const motor2Query = params?.motor2 || '';
        
        const { data: motors, error } = await supabase
          .from("motor_models")
          .select("id, model, model_display, horsepower, family, msrp, dealer_price, in_stock, stock_quantity, specifications")
          .or(`model_display.ilike.%${motor1Query}%,model_display.ilike.%${motor2Query}%,model.ilike.%${motor1Query}%,model.ilike.%${motor2Query}%`)
          .limit(10);
        
        if (error) throw error;
        
        const motor1 = motors?.find(m => 
          (m.model_display || m.model).toLowerCase().includes(motor1Query.toLowerCase())
        );
        const motor2 = motors?.find(m => 
          (m.model_display || m.model).toLowerCase().includes(motor2Query.toLowerCase())
        );
        
        if (!motor1 && !motor2) {
          result = { found: false, message: "Couldn't find either motor. Can you be more specific about which models?" };
        } else if (!motor1) {
          result = { found: false, message: `Found ${motor2?.model_display || motor2?.model} but couldn't find the first motor.` };
        } else if (!motor2) {
          result = { found: false, message: `Found ${motor1?.model_display || motor1?.model} but couldn't find the second motor.` };
        } else {
          const config1 = parseMotorConfig(motor1.model_display || motor1.model);
          const config2 = parseMotorConfig(motor2.model_display || motor2.model);
          
          result = {
            found: true,
            comparison: {
              motor1: {
                model: motor1.model_display || motor1.model,
                horsepower: motor1.horsepower,
                price: motor1.msrp || motor1.dealer_price,
                family: motor1.family,
                inStock: motor1.in_stock && (motor1.stock_quantity || 0) > 0,
                ...config1,
              },
              motor2: {
                model: motor2.model_display || motor2.model,
                horsepower: motor2.horsepower,
                price: motor2.msrp || motor2.dealer_price,
                family: motor2.family,
                inStock: motor2.in_stock && (motor2.stock_quantity || 0) > 0,
                ...config2,
              },
              differences: {
                hpDifference: (motor2.horsepower || 0) - (motor1.horsepower || 0),
                priceDifference: ((motor2.msrp || motor2.dealer_price || 0) - (motor1.msrp || motor1.dealer_price || 0)),
              }
            }
          };
        }
        break;
      }

      case "recommend_motor": {
        // Recommend motors based on boat info and usage
        const boatLength = params?.boat_length || 0;
        const boatType = params?.boat_type || 'aluminum';
        const usage = params?.usage || 'general';
        const maxBudget = params?.max_budget || 999999;
        
        // Calculate ideal HP range based on boat
        let minHp = 0;
        let maxHp = 999;
        
        if (boatLength) {
          // Rule of thumb: 5-10 HP per foot for aluminum, 8-12 for fiberglass
          const multiplier = boatType === 'fiberglass' ? 10 : boatType === 'pontoon' ? 6 : 7;
          minHp = Math.round(boatLength * (multiplier * 0.6));
          maxHp = Math.round(boatLength * (multiplier * 1.2));
        }
        
        // Adjust for usage
        if (usage === 'fishing') {
          maxHp = Math.round(maxHp * 0.9); // Slightly lower HP, prioritize fuel economy
        } else if (usage === 'watersports') {
          minHp = Math.round(minHp * 1.2); // Need more power for pulling
        }
        
        const { data: motors, error } = await supabase
          .from("motor_models")
          .select("id, model, model_display, horsepower, family, msrp, dealer_price, in_stock, stock_quantity")
          .gte("horsepower", minHp)
          .lte("horsepower", maxHp)
          .lte("msrp", maxBudget)
          .eq("in_stock", true)
          .gt("stock_quantity", 0)
          .order("horsepower", { ascending: true })
          .limit(20);
        
        if (error) throw error;
        
        if (!motors || motors.length === 0) {
          result = { 
            found: false, 
            message: `No motors found for a ${boatLength}ft ${boatType}. Try expanding your budget or we can look at what's available.`,
            suggestedHpRange: { min: minHp, max: maxHp }
          };
        } else {
          // Score motors based on usage fit
          const scoredMotors = motors.map(m => {
            let score = 100;
            const family = (m.family || '').toLowerCase();
            
            // Usage-based scoring
            if (usage === 'fishing' && family.includes('fourstroke')) score += 20;
            if (usage === 'watersports' && family.includes('pro')) score += 20;
            if (usage === 'commercial' && family.includes('seapro')) score += 30;
            if (boatType === 'pontoon' && family.includes('fourstroke')) score += 15;
            
            // In-stock bonus
            if (m.in_stock && (m.stock_quantity || 0) > 0) score += 10;
            
            return { ...buildMotorResponse(m), score };
          });
          
          scoredMotors.sort((a, b) => b.score - a.score);
          
          result = {
            found: true,
            recommendations: scoredMotors.slice(0, 3),
            reasoning: `For a ${boatLength}ft ${boatType} used for ${usage}, I'd recommend ${minHp}-${maxHp}HP.`,
            suggestedHpRange: { min: minHp, max: maxHp }
          };
        }
        break;
      }

      default:
        result = { error: `Unknown action: ${action}` };
    }

    console.log(`Voice inventory lookup result:`, result);

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voice inventory lookup error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
