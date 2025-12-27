import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// MCP Tool definitions with JSON schemas
const TOOLS = [
  {
    name: "schedule_callback",
    description: "Schedule a callback for a customer. Use when someone wants a human to call them back.",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer's name" },
        customer_phone: { type: "string", description: "Customer's phone number" },
        preferred_time: { type: "string", description: "When they'd like to be called (e.g., 'tomorrow morning', 'this afternoon')" },
        motor_interest: { type: "string", description: "Motor model they're interested in (optional)" },
        notes: { type: "string", description: "Additional notes (optional)" }
      },
      required: ["customer_name", "customer_phone"]
    }
  },
  {
    name: "set_reminder",
    description: "Set a reminder to text the customer later about motors, promotions, or services.",
    inputSchema: {
      type: "object",
      properties: {
        customer_phone: { type: "string", description: "Customer's phone number" },
        customer_name: { type: "string", description: "Customer's name" },
        reminder_type: { 
          type: "string", 
          enum: ["motor", "promotion", "service", "custom"],
          description: "Type of reminder" 
        },
        when: { type: "string", description: "When to send reminder (e.g., 'in 2 hours', 'tomorrow', 'next week')" },
        custom_note: { type: "string", description: "Custom message or note (optional)" }
      },
      required: ["customer_phone", "reminder_type", "when"]
    }
  },
  {
    name: "estimate_service_cost",
    description: "Estimate the cost for boat motor service. Use when customers ask about service pricing.",
    inputSchema: {
      type: "object",
      properties: {
        service_type: { 
          type: "string", 
          enum: ["100-hour", "winterization", "spring-commissioning", "oil-change", "lower-unit", "tune-up"],
          description: "Type of service" 
        },
        horsepower: { type: "number", description: "Motor horsepower" }
      },
      required: ["service_type", "horsepower"]
    }
  },
  {
    name: "estimate_trade_value",
    description: "Estimate trade-in value for a used motor. Use when customers want to trade in their current motor.",
    inputSchema: {
      type: "object",
      properties: {
        brand: { type: "string", description: "Motor brand (Mercury, Yamaha, etc.)" },
        year: { type: "number", description: "Year of motor" },
        horsepower: { type: "number", description: "Motor horsepower" },
        condition: { 
          type: "string", 
          enum: ["excellent", "good", "fair", "poor"],
          description: "Overall condition" 
        },
        hours: { type: "number", description: "Engine hours (optional)" }
      },
      required: ["brand", "year", "horsepower", "condition"]
    }
  },
  {
    name: "recommend_motor",
    description: "Recommend motors based on boat specifications and usage. Use when customers describe their boat.",
    inputSchema: {
      type: "object",
      properties: {
        boat_length: { type: "number", description: "Boat length in feet" },
        boat_type: { 
          type: "string", 
          enum: ["fishing", "pontoon", "runabout", "bass", "aluminum", "inflatable", "other"],
          description: "Type of boat" 
        },
        usage: { 
          type: "string", 
          enum: ["fishing", "cruising", "watersports", "commercial", "general"],
          description: "Primary usage" 
        },
        budget: { type: "number", description: "Maximum budget in dollars (optional)" }
      },
      required: ["boat_length", "boat_type"]
    }
  },
  {
    name: "compare_motors",
    description: "Compare two motors side by side. Use when customers want to compare options.",
    inputSchema: {
      type: "object",
      properties: {
        motor_1: { type: "string", description: "First motor model name or ID" },
        motor_2: { type: "string", description: "Second motor model name or ID" }
      },
      required: ["motor_1", "motor_2"]
    }
  },
  {
    name: "send_motor_photos",
    description: "Send motor photos and details via text. Use when customers want to see specific motors.",
    inputSchema: {
      type: "object",
      properties: {
        customer_phone: { type: "string", description: "Customer's phone number" },
        customer_name: { type: "string", description: "Customer's name" },
        motor_model: { type: "string", description: "Motor model to send photos of" }
      },
      required: ["customer_phone", "motor_model"]
    }
  },
  {
    name: "check_current_deals",
    description: "Check current promotions and deals. Use when customers ask about discounts or special offers.",
    inputSchema: {
      type: "object",
      properties: {
        horsepower_range: { type: "string", description: "HP range like '75-150' (optional)" },
        motor_family: { 
          type: "string", 
          enum: ["FourStroke", "ProXS", "SeaPro", "Verado"],
          description: "Motor family (optional)" 
        }
      }
    }
  },
  {
    name: "get_quote_summary",
    description: "Get the current quote summary. Use when customer asks about their quote or wants a recap.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "set_boat_details",
    description: "Set or update customer's boat details in the quote. Use when collecting boat information.",
    inputSchema: {
      type: "object",
      properties: {
        boat_year: { type: "number", description: "Year of boat" },
        boat_make: { type: "string", description: "Boat manufacturer" },
        boat_model: { type: "string", description: "Boat model" },
        boat_length: { type: "number", description: "Boat length in feet" },
        current_motor: { type: "string", description: "Current motor details (optional)" }
      },
      required: ["boat_year", "boat_make", "boat_model"]
    }
  },
  {
    name: "go_to_quote_step",
    description: "Navigate to a specific step in the quote process. Use when customer wants to review or change a step.",
    inputSchema: {
      type: "object",
      properties: {
        step: { 
          type: "string", 
          enum: ["boat", "motor", "addons", "financing", "review"],
          description: "Quote step to navigate to" 
        }
      },
      required: ["step"]
    }
  },
  // ===== NEW TOOLS =====
  {
    name: "check_inventory",
    description: "Search motor inventory. Use when customers ask about what motors are in stock, available, or looking for specific configurations.",
    inputSchema: {
      type: "object",
      properties: {
        horsepower: { type: "number", description: "Specific HP to search for" },
        min_hp: { type: "number", description: "Minimum HP (for range search)" },
        max_hp: { type: "number", description: "Maximum HP (for range search)" },
        family: { 
          type: "string", 
          enum: ["FourStroke", "ProXS", "SeaPro", "Verado"],
          description: "Motor family" 
        },
        in_stock_only: { type: "boolean", description: "Only show motors in stock (default true)" }
      }
    }
  },
  {
    name: "get_motor_price",
    description: "Get the price for a specific motor model. Use when customers ask 'how much is...' or 'what's the price of...'",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", description: "Motor model name (e.g., 'Mercury 150 FourStroke', '200 Verado')" },
        horsepower: { type: "number", description: "Motor horsepower (helps narrow down)" }
      },
      required: ["model"]
    }
  },
  {
    name: "schedule_service_appointment",
    description: "Schedule a service appointment for boat motor service. Use when customers want to book winterization, tune-up, oil change, or other services.",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer's name" },
        customer_phone: { type: "string", description: "Customer's phone number" },
        service_type: { 
          type: "string", 
          enum: ["winterization", "spring-commissioning", "100-hour", "oil-change", "tune-up", "lower-unit", "diagnostic", "other"],
          description: "Type of service needed" 
        },
        motor_info: { type: "string", description: "Customer's motor details (brand, HP, year)" },
        preferred_date: { type: "string", description: "Preferred date or timeframe" },
        notes: { type: "string", description: "Additional details or notes" }
      },
      required: ["customer_name", "customer_phone", "service_type"]
    }
  },
  {
    name: "get_warranty_pricing",
    description: "Get extended warranty pricing for a motor. Use when customers ask about warranty costs, coverage, or extended protection.",
    inputSchema: {
      type: "object",
      properties: {
        horsepower: { type: "number", description: "Motor horsepower" },
        years: { 
          type: "number", 
          enum: [1, 2, 3, 4, 5],
          description: "Number of additional warranty years" 
        }
      },
      required: ["horsepower"]
    }
  },
  {
    name: "check_financing_options",
    description: "Explain financing availability and estimate monthly payments. Use when customers ask about financing, payment plans, or credit.",
    inputSchema: {
      type: "object",
      properties: {
        purchase_amount: { type: "number", description: "Approximate purchase amount (optional)" }
      }
    }
  },
  {
    name: "get_store_hours",
    description: "Get store hours and availability. Use when customers ask when you're open, business hours, or if you're open today.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_directions",
    description: "Provide store location and directions. Use when customers ask where you're located, your address, or how to get there.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

// Service estimate data
const SERVICE_ESTIMATES: Record<string, Record<string, { low: number; high: number; includes: string[] }>> = {
  "100-hour": {
    small: { low: 350, high: 500, includes: ["Oil change", "Gear lube", "Filter replacement", "Inspection"] },
    medium: { low: 450, high: 700, includes: ["Oil change", "Gear lube", "Fuel filter", "Spark plugs", "Inspection"] },
    large: { low: 600, high: 1000, includes: ["Oil change", "Gear lube", "All filters", "Spark plugs", "Anodes", "Inspection"] }
  },
  "winterization": {
    small: { low: 200, high: 350, includes: ["Fuel stabilizer", "Fog engine", "Drain cooling system"] },
    medium: { low: 300, high: 500, includes: ["Fuel stabilizer", "Fog engine", "Drain systems", "Battery service"] },
    large: { low: 400, high: 700, includes: ["Full winterization", "Battery storage", "Shrink wrap available"] }
  },
  "spring-commissioning": {
    small: { low: 250, high: 400, includes: ["Battery install", "Fluid check", "Test run"] },
    medium: { low: 350, high: 550, includes: ["Battery install", "All fluids", "Systems check", "Test run"] },
    large: { low: 450, high: 750, includes: ["Complete de-winterization", "Full systems test", "Sea trial"] }
  },
  "oil-change": {
    small: { low: 100, high: 175, includes: ["Oil", "Filter", "Disposal"] },
    medium: { low: 150, high: 250, includes: ["Synthetic oil", "Filter", "Disposal"] },
    large: { low: 200, high: 350, includes: ["Full synthetic", "Filter", "Inspection"] }
  },
  "lower-unit": {
    small: { low: 150, high: 250, includes: ["Gear lube change", "Seal inspection"] },
    medium: { low: 200, high: 350, includes: ["Gear lube", "Seal check", "Water pump inspection"] },
    large: { low: 300, high: 500, includes: ["Gear lube", "Full lower unit inspection"] }
  },
  "tune-up": {
    small: { low: 200, high: 350, includes: ["Spark plugs", "Timing check", "Carb adjustment"] },
    medium: { low: 300, high: 500, includes: ["Plugs", "Timing", "Fuel system service"] },
    large: { low: 400, high: 700, includes: ["Complete tune-up", "Computer diagnostics"] }
  }
};

function getHpCategory(hp: number): "small" | "medium" | "large" {
  if (hp <= 40) return "small";
  if (hp <= 150) return "medium";
  return "large";
}

// Initialize Supabase
function getSupabase() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

// Tool execution handlers
async function executeTool(toolName: string, args: Record<string, unknown>): Promise<{ content: { type: string; text: string }[] }> {
  const supabase = getSupabase();
  
  switch (toolName) {
    case "schedule_callback": {
      const response = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-schedule-callback`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify(args)
        }
      );
      const result = await response.json();
      return { content: [{ type: "text", text: result.message || result.error || "Callback scheduled" }] };
    }
    
    case "set_reminder": {
      const response = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-create-reminder`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify(args)
        }
      );
      const result = await response.json();
      return { content: [{ type: "text", text: result.message || result.error || "Reminder created" }] };
    }
    
    case "estimate_service_cost": {
      const serviceType = (args.service_type as string || "").toLowerCase().replace(/\s+/g, "-");
      const hp = args.horsepower as number || 100;
      const category = getHpCategory(hp);
      const estimate = SERVICE_ESTIMATES[serviceType]?.[category];
      
      if (!estimate) {
        return { content: [{ type: "text", text: `Service estimates for ${args.service_type} on a ${hp}HP motor: Please call us for a custom quote at (905) 342-9980.` }] };
      }
      
      const text = `${args.service_type} service for a ${hp}HP motor: $${estimate.low} - $${estimate.high} CAD. Includes: ${estimate.includes.join(", ")}. Final price depends on parts needed.`;
      return { content: [{ type: "text", text }] };
    }
    
    case "estimate_trade_value": {
      const year = args.year as number;
      const hp = args.horsepower as number;
      const condition = args.condition as string;
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;
      
      let baseValue = hp * 50;
      const ageDepreciation = Math.min(age * 0.10, 0.70);
      baseValue *= (1 - ageDepreciation);
      
      const conditionMultipliers: Record<string, number> = {
        excellent: 1.2,
        good: 1.0,
        fair: 0.75,
        poor: 0.5
      };
      baseValue *= conditionMultipliers[condition] || 1.0;
      
      if ((args.brand as string)?.toLowerCase().includes("mercury")) {
        baseValue *= 1.15;
      }
      
      const lowEstimate = Math.round(baseValue * 0.85 / 100) * 100;
      const highEstimate = Math.round(baseValue * 1.15 / 100) * 100;
      
      return { 
        content: [{ 
          type: "text", 
          text: `Estimated trade-in value for your ${year} ${args.brand} ${hp}HP (${condition} condition): $${lowEstimate} - $${highEstimate} CAD. This is a rough estimate - the final value depends on an in-person inspection. Mercury motors typically hold value better.` 
        }] 
      };
    }
    
    case "recommend_motor": {
      const boatLength = args.boat_length as number;
      const boatType = args.boat_type as string;
      
      let minHp = Math.round(boatLength * 3);
      let maxHp = Math.round(boatLength * 6);
      
      if (boatType === "pontoon") {
        minHp = Math.round(boatLength * 4);
        maxHp = Math.round(boatLength * 8);
      } else if (boatType === "bass" || boatType === "fishing") {
        minHp = Math.round(boatLength * 5);
        maxHp = Math.round(boatLength * 10);
      }
      
      const { data: motors } = await supabase
        .from("motor_models")
        .select("model_display, horsepower, msrp, family, in_stock")
        .gte("horsepower", minHp)
        .lte("horsepower", maxHp)
        .eq("in_stock", true)
        .order("horsepower")
        .limit(5);
      
      if (!motors?.length) {
        return { 
          content: [{ 
            type: "text", 
            text: `For a ${boatLength}ft ${boatType}, I'd recommend motors in the ${minHp}-${maxHp}HP range. Let me check our current inventory for options.` 
          }] 
        };
      }
      
      const motorList = motors.map(m => 
        `${m.model_display || m.family + ' ' + m.horsepower + 'HP'}: $${m.msrp?.toLocaleString() || 'Call for price'}`
      ).join("\n");
      
      return { 
        content: [{ 
          type: "text", 
          text: `For your ${boatLength}ft ${boatType}, I recommend ${minHp}-${maxHp}HP. Here are some in-stock options:\n\n${motorList}\n\nWould you like details on any of these?` 
        }] 
      };
    }
    
    case "compare_motors": {
      const { data: motor1 } = await supabase
        .from("motor_models")
        .select("*")
        .or(`model_display.ilike.%${args.motor_1}%,model.ilike.%${args.motor_1}%`)
        .limit(1)
        .single();
        
      const { data: motor2 } = await supabase
        .from("motor_models")
        .select("*")
        .or(`model_display.ilike.%${args.motor_2}%,model.ilike.%${args.motor_2}%`)
        .limit(1)
        .single();
      
      if (!motor1 || !motor2) {
        return { content: [{ type: "text", text: "I couldn't find one or both of those motors. Could you give me the specific model names?" }] };
      }
      
      const comparison = `
Comparing ${motor1.model_display || motor1.model} vs ${motor2.model_display || motor2.model}:

HP: ${motor1.horsepower}HP vs ${motor2.horsepower}HP
Price: $${motor1.msrp?.toLocaleString() || 'Call'} vs $${motor2.msrp?.toLocaleString() || 'Call'}
Family: ${motor1.family || 'N/A'} vs ${motor2.family || 'N/A'}
In Stock: ${motor1.in_stock ? 'Yes' : 'No'} vs ${motor2.in_stock ? 'Yes' : 'No'}

${motor1.horsepower > motor2.horsepower ? `The ${motor1.model_display} has more power` : motor2.horsepower > motor1.horsepower ? `The ${motor2.model_display} has more power` : 'Both have the same horsepower'}.
      `.trim();
      
      return { content: [{ type: "text", text: comparison }] };
    }
    
    case "send_motor_photos": {
      const response = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/voice-send-follow-up`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
          },
          body: JSON.stringify({
            customer_name: args.customer_name || "Customer",
            customer_phone: args.customer_phone,
            message_type: "inventory_alert",
            motor_model: args.motor_model
          })
        }
      );
      const result = await response.json();
      return { content: [{ type: "text", text: result.success ? `I've sent details about the ${args.motor_model} to your phone!` : result.error }] };
    }
    
    case "check_current_deals": {
      const { data: promos } = await supabase
        .from("promotions")
        .select("name, discount_percentage, discount_fixed_amount, bonus_title, end_date")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(5);
      
      if (!promos?.length) {
        return { content: [{ type: "text", text: "We don't have any special promotions running right now, but I can help you get the best price on any motor. What are you looking for?" }] };
      }
      
      const promoList = promos.map(p => {
        let deal = p.name;
        if (p.discount_percentage) deal += ` - ${p.discount_percentage}% off`;
        if (p.discount_fixed_amount) deal += ` - $${p.discount_fixed_amount} off`;
        if (p.bonus_title) deal += ` + ${p.bonus_title}`;
        if (p.end_date) deal += ` (ends ${new Date(p.end_date).toLocaleDateString()})`;
        return deal;
      }).join("\n");
      
      return { 
        content: [{ 
          type: "text", 
          text: `Here are our current promotions:\n\n${promoList}\n\nWant details on any of these?` 
        }] 
      };
    }
    
    case "get_quote_summary": {
      return { 
        content: [{ 
          type: "text", 
          text: "To get your personalized quote summary, please visit harrisboatworks.ca/quote or tell me what motor you're interested in and I can help build a quote for you." 
        }] 
      };
    }
    
    case "set_boat_details": {
      return { 
        content: [{ 
          type: "text", 
          text: `Got it! I've noted your boat details: ${args.boat_year} ${args.boat_make} ${args.boat_model}${args.boat_length ? `, ${args.boat_length} feet` : ''}. This will help me recommend the perfect motor for you.` 
        }] 
      };
    }
    
    case "go_to_quote_step": {
      const stepDescriptions: Record<string, string> = {
        boat: "boat information",
        motor: "motor selection", 
        addons: "accessories and add-ons",
        financing: "financing options",
        review: "quote review"
      };
      return { 
        content: [{ 
          type: "text", 
          text: `To update your ${stepDescriptions[args.step as string] || args.step}, please visit harrisboatworks.ca/quote or tell me what you'd like to change.` 
        }] 
      };
    }
    
    // ===== NEW TOOL HANDLERS =====
    
    case "check_inventory": {
      const inStockOnly = args.in_stock_only !== false; // Default to true
      let query = supabase
        .from("motor_models")
        .select("model_display, model, horsepower, msrp, family, in_stock, shaft, control_type")
        .order("horsepower");
      
      if (args.horsepower) {
        query = query.eq("horsepower", args.horsepower);
      } else {
        if (args.min_hp) query = query.gte("horsepower", args.min_hp);
        if (args.max_hp) query = query.lte("horsepower", args.max_hp);
      }
      
      if (args.family) query = query.eq("family", args.family);
      if (inStockOnly) query = query.eq("in_stock", true);
      
      const { data: motors, error } = await query.limit(10);
      
      if (error || !motors?.length) {
        return { 
          content: [{ 
            type: "text", 
            text: inStockOnly 
              ? "I don't see any motors matching those specs in stock right now. Would you like me to check what we can order, or look at different options?" 
              : "I couldn't find any motors matching those specifications. Let me know what you're looking for and I can help." 
          }] 
        };
      }
      
      const motorList = motors.map(m => {
        const name = m.model_display || `${m.family} ${m.horsepower}HP`;
        const price = m.msrp ? `$${m.msrp.toLocaleString()}` : "Call for price";
        const stock = m.in_stock ? "✓ In Stock" : "Available to order";
        return `• ${name}: ${price} (${stock})`;
      }).join("\n");
      
      const stockCount = motors.filter(m => m.in_stock).length;
      
      return { 
        content: [{ 
          type: "text", 
          text: `Found ${motors.length} motors${args.family ? ` in the ${args.family} family` : ''}${args.horsepower ? ` at ${args.horsepower}HP` : ''}:\n\n${motorList}\n\n${stockCount} are in stock and ready. Want details on any of these?` 
        }] 
      };
    }
    
    case "get_motor_price": {
      const searchModel = args.model as string;
      const hp = args.horsepower as number | undefined;
      
      let query = supabase
        .from("motor_models")
        .select("model_display, model, horsepower, msrp, dealer_price, sale_price, family, in_stock")
        .or(`model_display.ilike.%${searchModel}%,model.ilike.%${searchModel}%,family.ilike.%${searchModel}%`);
      
      if (hp) query = query.eq("horsepower", hp);
      
      const { data: motors } = await query.limit(5);
      
      if (!motors?.length) {
        return { 
          content: [{ 
            type: "text", 
            text: `I couldn't find a motor matching "${searchModel}". Could you give me the horsepower or be more specific? For example, "150 FourStroke" or "200 Verado".` 
          }] 
        };
      }
      
      if (motors.length === 1) {
        const m = motors[0];
        const name = m.model_display || `${m.family} ${m.horsepower}HP`;
        const hasDiscount = m.sale_price && m.sale_price < (m.msrp || 0);
        
        let priceText = m.msrp ? `$${m.msrp.toLocaleString()} CAD` : "Call for pricing";
        if (hasDiscount) {
          priceText = `$${m.sale_price!.toLocaleString()} CAD (was $${m.msrp!.toLocaleString()})`;
        }
        
        return { 
          content: [{ 
            type: "text", 
            text: `The ${name} is ${priceText}. ${m.in_stock ? "It's in stock and ready!" : "We can order this for you."} Would you like a full quote with financing options?` 
          }] 
        };
      }
      
      // Multiple matches
      const priceList = motors.map(m => {
        const name = m.model_display || `${m.family} ${m.horsepower}HP`;
        const price = m.msrp ? `$${m.msrp.toLocaleString()}` : "Call";
        return `• ${name}: ${price}`;
      }).join("\n");
      
      return { 
        content: [{ 
          type: "text", 
          text: `I found a few options:\n\n${priceList}\n\nWhich one are you interested in?` 
        }] 
      };
    }
    
    case "schedule_service_appointment": {
      // Insert into voice_callbacks table with service context
      const { error } = await supabase
        .from("voice_callbacks")
        .insert({
          customer_name: args.customer_name,
          customer_phone: args.customer_phone,
          motor_interest: `Service: ${args.service_type}`,
          motor_context: {
            type: "service_appointment",
            service_type: args.service_type,
            motor_info: args.motor_info || null,
            preferred_date: args.preferred_date || null
          },
          notes: args.notes || `Service request: ${args.service_type}${args.motor_info ? ` for ${args.motor_info}` : ''}${args.preferred_date ? `. Preferred: ${args.preferred_date}` : ''}`,
          callback_status: "pending"
        });
      
      if (error) {
        console.error("[MCP] Error scheduling service:", error);
        return { 
          content: [{ 
            type: "text", 
            text: "I had trouble scheduling that appointment. Please call us directly at (905) 342-9980 to book your service." 
          }] 
        };
      }
      
      const serviceNames: Record<string, string> = {
        "winterization": "winterization",
        "spring-commissioning": "spring commissioning",
        "100-hour": "100-hour service",
        "oil-change": "oil change",
        "tune-up": "tune-up",
        "lower-unit": "lower unit service",
        "diagnostic": "diagnostic check",
        "other": "service"
      };
      
      return { 
        content: [{ 
          type: "text", 
          text: `I've scheduled your ${serviceNames[args.service_type as string] || args.service_type} appointment request for ${args.customer_name}. Our service team will call you at ${args.customer_phone} to confirm the date and time${args.preferred_date ? ` (you mentioned ${args.preferred_date})` : ''}. Is there anything else I can help with?` 
        }] 
      };
    }
    
    case "get_warranty_pricing": {
      const hp = args.horsepower as number;
      const years = args.years as number || null;
      
      const { data: pricing } = await supabase
        .from("warranty_pricing")
        .select("*")
        .lte("hp_min", hp)
        .gte("hp_max", hp)
        .limit(1)
        .single();
      
      if (!pricing) {
        return { 
          content: [{ 
            type: "text", 
            text: `For extended warranty on a ${hp}HP motor, I'd recommend speaking with our team for accurate pricing. Call us at (905) 342-9980 or I can have someone call you back.` 
          }] 
        };
      }
      
      if (years) {
        const yearKey = `year_${years}_price` as keyof typeof pricing;
        const price = pricing[yearKey] as number;
        
        if (price) {
          return { 
            content: [{ 
              type: "text", 
              text: `A ${years}-year extended warranty for your ${hp}HP motor is $${price.toLocaleString()} CAD. This covers parts and labor beyond the factory warranty. Want me to include this in your quote?` 
            }] 
          };
        }
      }
      
      // Show all years pricing
      const allPricing = [1, 2, 3, 4, 5].map(y => {
        const key = `year_${y}_price` as keyof typeof pricing;
        const p = pricing[key] as number;
        return p ? `${y} year: $${p.toLocaleString()}` : null;
      }).filter(Boolean).join("\n");
      
      return { 
        content: [{ 
          type: "text", 
          text: `Extended warranty options for your ${hp}HP motor:\n\n${allPricing}\n\nWhich coverage period works best for you?` 
        }] 
      };
    }
    
    case "check_financing_options": {
      const amount = args.purchase_amount as number | undefined;
      
      // Get finance settings
      const { data: settings } = await supabase
        .from("finance_settings")
        .select("*")
        .limit(1)
        .single();
      
      const interestRate = settings?.interest_rate || 7.5;
      const depositPct = settings?.deposit_percentage || 20;
      const maxTerm = settings?.max_term_months || 60;
      
      if (!amount) {
        return { 
          content: [{ 
            type: "text", 
            text: `Yes, we offer financing! With as little as ${depositPct}% down, you can finance your motor purchase over up to ${maxTerm} months. Current rates start at ${interestRate}% APR. Tell me which motor you're looking at and I can calculate your monthly payment.` 
          }] 
        };
      }
      
      // Calculate estimated monthly payment
      const deposit = amount * (depositPct / 100);
      const financed = amount - deposit;
      const monthlyRate = interestRate / 100 / 12;
      const months = maxTerm;
      const monthly = financed * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
      
      return { 
        content: [{ 
          type: "text", 
          text: `For a $${amount.toLocaleString()} purchase:\n\n• Down payment (${depositPct}%): $${deposit.toLocaleString()}\n• Financed amount: $${financed.toLocaleString()}\n• Estimated monthly payment: $${Math.round(monthly)}/month over ${months} months\n• Rate: ${interestRate}% APR\n\nThis is an estimate - final terms depend on credit approval. Want me to help you start a quote?` 
          }] 
      };
    }
    
    case "get_store_hours": {
      // Harris Boat Works store hours
      const hours = {
        monday: "8:00 AM - 5:00 PM",
        tuesday: "8:00 AM - 5:00 PM",
        wednesday: "8:00 AM - 5:00 PM",
        thursday: "8:00 AM - 5:00 PM",
        friday: "8:00 AM - 5:00 PM",
        saturday: "9:00 AM - 3:00 PM",
        sunday: "Closed"
      };
      
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const today = days[new Date().getDay()];
      const todayHours = hours[today as keyof typeof hours];
      
      return { 
        content: [{ 
          type: "text", 
          text: `We're open ${todayHours === "Closed" ? "closed today" : `today until ${todayHours.split(" - ")[1]}`}.\n\nOur hours are:\nMonday-Friday: 8 AM - 5 PM\nSaturday: 9 AM - 3 PM\nSunday: Closed\n\nWant to schedule a visit or have someone call you?` 
        }] 
      };
    }
    
    case "get_directions": {
      return { 
        content: [{ 
          type: "text", 
          text: `Harris Boat Works is located at:\n\n📍 1230 County Road 2\nGrafton, Ontario K0K 2G0\n\nWe're right on Highway 2, about 15 minutes west of Cobourg. Look for the Mercury Marine sign!\n\n📞 Phone: (905) 342-9980\n\nWant me to text you the Google Maps link?` 
        }] 
      };
    }
    
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${toolName}` }] };
  }
}

// MCP Protocol Handlers
function handleInitialize() {
  return {
    protocolVersion: "2025-03-26",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "harris-boat-works-mcp",
      version: "1.0.0",
    },
  };
}

function handleToolsList() {
  return { tools: TOOLS };
}

async function handleToolCall(params: { name: string; arguments?: Record<string, unknown> }): Promise<{ content: { type: string; text: string }[] }> {
  console.log(`[MCP] Executing tool: ${params.name}`, params.arguments);
  return await executeTool(params.name, params.arguments || {});
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  console.log(`[MCP Streamable HTTP] ${req.method} ${url.pathname}`);

  try {
    // Streamable HTTP Transport (2025-03-26): POST for all JSON-RPC messages
    if (req.method === "POST") {
      const body = await req.json();
      console.log("[MCP] Request:", JSON.stringify(body));

      let result: unknown;

      switch (body.method) {
        case "initialize":
          result = handleInitialize();
          break;

        case "tools/list":
          result = handleToolsList();
          break;

        case "tools/call":
          result = await handleToolCall(body.params);
          break;

        case "ping":
          result = {};
          break;

        case "notifications/initialized":
          result = {};
          break;

        default:
          console.log(`[MCP] Unknown method: ${body.method}`);
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: body.id,
              error: {
                code: -32601,
                message: `Method not found: ${body.method}`,
              },
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
      }

      const jsonRpcResponse = {
        jsonrpc: "2.0",
        id: body.id,
        result,
      };

      console.log("[MCP] Response:", JSON.stringify(jsonRpcResponse));

      return new Response(JSON.stringify(jsonRpcResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET requests: Return 200 OK for probe/discovery
    // ElevenLabs may send a GET first even with Streamable HTTP transport
    if (req.method === "GET") {
      console.log("[MCP] GET request received - returning OK for probe");
      return new Response(
        JSON.stringify({ 
          status: "ok",
          message: "MCP Streamable HTTP server. Use POST for JSON-RPC requests.",
          protocolVersion: "2025-03-26"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[MCP] Error:", error);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error",
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

