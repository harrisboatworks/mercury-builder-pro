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
      
      // Base value estimation
      let baseValue = hp * 50; // $50 per HP as starting point
      
      // Age depreciation (10% per year, max 70%)
      const ageDepreciation = Math.min(age * 0.10, 0.70);
      baseValue *= (1 - ageDepreciation);
      
      // Condition adjustments
      const conditionMultipliers: Record<string, number> = {
        excellent: 1.2,
        good: 1.0,
        fair: 0.75,
        poor: 0.5
      };
      baseValue *= conditionMultipliers[condition] || 1.0;
      
      // Brand premium for Mercury
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
      
      // HP recommendations based on boat length
      let minHp = Math.round(boatLength * 3);
      let maxHp = Math.round(boatLength * 6);
      
      // Adjust for boat type
      if (boatType === "pontoon") {
        minHp = Math.round(boatLength * 4);
        maxHp = Math.round(boatLength * 8);
      } else if (boatType === "bass" || boatType === "fishing") {
        minHp = Math.round(boatLength * 5);
        maxHp = Math.round(boatLength * 10);
      }
      
      // Query database for motors in range
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
      
      return { content: [{ type: "text", text: `Current deals:\n\n${promoList}\n\nWant me to apply any of these to a quote?` }] };
    }
    
    case "get_quote_summary": {
      return { 
        content: [{ 
          type: "text", 
          text: "I can see your quote in progress. To get the full details, just ask me what you'd like to know - the motor, price, financing options, or the complete summary." 
        }] 
      };
    }
    
    case "set_boat_details": {
      return { 
        content: [{ 
          type: "text", 
          text: `Got it! I've noted your boat: ${args.boat_year} ${args.boat_make} ${args.boat_model}${args.boat_length ? `, ${args.boat_length}ft` : ''}. This helps us recommend the right motor and rigging.` 
        }] 
      };
    }
    
    case "go_to_quote_step": {
      const stepNames: Record<string, string> = {
        boat: "boat information",
        motor: "motor selection",
        addons: "add-ons and accessories",
        financing: "financing options",
        review: "quote review"
      };
      return { 
        content: [{ 
          type: "text", 
          text: `I'll take you to the ${stepNames[args.step as string] || args.step} section. You should see it on your screen now.` 
        }] 
      };
    }
    
    default:
      return { content: [{ type: "text", text: `Unknown tool: ${toolName}` }] };
  }
}

// MCP Protocol handlers
function handleInitialize(): Record<string, unknown> {
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {}
    },
    serverInfo: {
      name: "harris-boat-works-mcp",
      version: "1.0.0"
    }
  };
}

function handleToolsList(): { tools: typeof TOOLS } {
  return { tools: TOOLS };
}

async function handleToolCall(params: { name: string; arguments?: Record<string, unknown> }): Promise<{ content: { type: string; text: string }[] }> {
  console.log(`[MCP] Executing tool: ${params.name}`, params.arguments);
  return await executeTool(params.name, params.arguments || {});
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  console.log(`[MCP] ${req.method} ${url.pathname}`);

  try {
    // SSE endpoint for MCP
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/sse")) {
      // Return SSE stream for tool discovery
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // Send capabilities
          const initMessage = {
            jsonrpc: "2.0",
            method: "notifications/initialized",
            params: handleInitialize()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(initMessage)}\n\n`));
          
          // Send tools list
          const toolsMessage = {
            jsonrpc: "2.0",
            method: "notifications/tools/list_changed",
            params: handleToolsList()
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(toolsMessage)}\n\n`));
        }
      });
      
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

    // Handle JSON-RPC messages
    if (req.method === "POST") {
      const body = await req.json();
      console.log("[MCP] Request:", JSON.stringify(body));
      
      let response: unknown;
      
      switch (body.method) {
        case "initialize":
          response = { result: handleInitialize() };
          break;
          
        case "tools/list":
          response = { result: handleToolsList() };
          break;
          
        case "tools/call":
          response = { result: await handleToolCall(body.params) };
          break;
          
        case "ping":
          response = { result: {} };
          break;
          
        default:
          response = { 
            error: { 
              code: -32601, 
              message: `Method not found: ${body.method}` 
            } 
          };
      }
      
      const jsonRpcResponse = {
        jsonrpc: "2.0",
        id: body.id,
        ...response
      };
      
      console.log("[MCP] Response:", JSON.stringify(jsonRpcResponse));
      
      return new Response(JSON.stringify(jsonRpcResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[MCP] Error:", error);
    return new Response(JSON.stringify({ 
      jsonrpc: "2.0",
      error: { 
        code: -32603, 
        message: error instanceof Error ? error.message : "Internal error" 
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
