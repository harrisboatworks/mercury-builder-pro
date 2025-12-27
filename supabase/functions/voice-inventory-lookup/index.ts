import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Build motor object with parsed configuration
function buildMotorResponse(m: Record<string, unknown>) {
  const modelDisplay = (m.model_display || m.model) as string;
  const config = parseMotorConfig(modelDisplay);
  
  return {
    model: modelDisplay,
    horsepower: m.horsepower,
    family: m.family,
    inStock: m.in_stock && ((m.stock_quantity as number) || 0) > 0,
    quantity: m.stock_quantity || 0,
    price: m.msrp || m.dealer_price,
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result: unknown;

    switch (action) {
      case "check_inventory": {
        // Search inventory by horsepower, family, stock status
        let query = supabase
          .from("motor_models")
          .select("id, model, model_display, horsepower, family, in_stock, stock_quantity, msrp, dealer_price, availability")
          .order("horsepower", { ascending: true });

        if (params?.horsepower) {
          query = query.eq("horsepower", params.horsepower);
        }
        if (params?.family) {
          query = query.ilike("family", `%${params.family}%`);
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
          result = { found: false, message: "No motors found matching your criteria." };
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
