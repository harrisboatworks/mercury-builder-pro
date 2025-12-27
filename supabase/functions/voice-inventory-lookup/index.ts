import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

        const { data, error } = await query.limit(10);
        
        if (error) throw error;

        if (!data || data.length === 0) {
          result = { found: false, message: "No motors found matching your criteria." };
        } else {
          const motors = data.map(m => ({
            model: m.model_display || m.model,
            horsepower: m.horsepower,
            family: m.family,
            inStock: m.in_stock && (m.stock_quantity || 0) > 0,
            quantity: m.stock_quantity || 0,
            price: m.msrp || m.dealer_price,
            availability: m.availability,
          }));
          result = { 
            found: true, 
            count: motors.length,
            motors,
            summary: `Found ${motors.length} motor${motors.length > 1 ? 's' : ''} matching your criteria.`
          };
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
          result = {
            found: true,
            model: motor.model_display || motor.model,
            horsepower: motor.horsepower,
            msrp: motor.msrp,
            salePrice: motor.sale_price,
            inStock: motor.in_stock && (motor.stock_quantity || 0) > 0,
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
          const inStock = motor.in_stock && (motor.stock_quantity || 0) > 0;
          result = {
            found: true,
            model: motor.model_display || motor.model,
            horsepower: motor.horsepower,
            inStock,
            quantity: motor.stock_quantity || 0,
            availability: motor.availability || (inStock ? "In Stock" : "Out of Stock"),
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
          .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
          result = { found: false, message: "No motors currently in stock." };
        } else {
          const motors = data.map(m => ({
            model: m.model_display || m.model,
            horsepower: m.horsepower,
            family: m.family,
            quantity: m.stock_quantity,
            price: m.msrp,
          }));
          result = {
            found: true,
            count: motors.length,
            motors,
            summary: `${motors.length} motor${motors.length > 1 ? 's' : ''} currently in stock.`
          };
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
          .limit(15);

        if (error) throw error;

        if (!data || data.length === 0) {
          result = { found: false, message: `No motors found between ${minHp} and ${maxHp} HP.` };
        } else {
          const motors = data.map(m => ({
            model: m.model_display || m.model,
            horsepower: m.horsepower,
            family: m.family,
            inStock: m.in_stock && (m.stock_quantity || 0) > 0,
            price: m.msrp,
          }));
          result = {
            found: true,
            count: motors.length,
            motors,
            summary: `Found ${motors.length} motor${motors.length > 1 ? 's' : ''} between ${minHp} and ${maxHp} HP.`
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
