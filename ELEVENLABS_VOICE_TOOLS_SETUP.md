# ElevenLabs Voice Agent - Tool Configuration Guide

This guide explains how to configure the new client tools in your ElevenLabs Conversational AI agent dashboard.

## Agent Dashboard URL
https://elevenlabs.io/app/conversational-ai/agents/agent_0501kdexvsfkfx8a240g7ts27dy1

---

## Client Tools to Add

Go to **Agent Settings** → **Tools** → **Add Tool** → **Client Tool**

### 1. Schedule Callback
**Name:** `schedule_callback`  
**Description:** Schedule a callback request from the customer. Use when customer asks for someone to call them back.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "customer_name": {
      "type": "string",
      "description": "Customer's name"
    },
    "customer_phone": {
      "type": "string",
      "description": "Customer's phone number"
    },
    "preferred_time": {
      "type": "string",
      "description": "When they want to be called back (e.g., 'tomorrow afternoon', 'this week')"
    },
    "notes": {
      "type": "string",
      "description": "Any additional notes about the callback request"
    }
  },
  "required": ["customer_phone"]
}
```

---

### 2. Set Reminder
**Name:** `set_reminder`  
**Description:** Set a reminder for the customer about a motor, promotion, or custom note. Sends SMS at the specified time.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "customer_phone": {
      "type": "string",
      "description": "Customer's phone number for SMS reminder"
    },
    "reminder_about": {
      "type": "string",
      "enum": ["current_motor", "promotion", "custom"],
      "description": "What the reminder is about"
    },
    "when": {
      "type": "string",
      "description": "When to send reminder (e.g., 'next week', 'in 3 days', 'Friday')"
    },
    "custom_note": {
      "type": "string",
      "description": "Custom message for the reminder"
    }
  },
  "required": ["customer_phone", "when"]
}
```

---

### 3. Estimate Service Cost
**Name:** `estimate_service_cost`  
**Description:** Provide service cost estimates for motor maintenance. Use when customer asks about service pricing.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "service_type": {
      "type": "string",
      "enum": ["100_hour", "annual", "winterization", "spring_commissioning", "lower_unit", "impeller", "tune_up", "oil_change"],
      "description": "Type of service requested"
    },
    "motor_hp": {
      "type": "number",
      "description": "Horsepower of the motor"
    },
    "motor_model": {
      "type": "string",
      "description": "Model name of the motor"
    }
  },
  "required": ["service_type"]
}
```

---

### 4. Estimate Trade Value
**Name:** `estimate_trade_value`  
**Description:** Estimate trade-in value for a customer's current motor. Use when customer asks about trade-in.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "brand": {
      "type": "string",
      "description": "Brand of the motor (Mercury, Yamaha, Honda, etc.)"
    },
    "year": {
      "type": "number",
      "description": "Year of the motor"
    },
    "horsepower": {
      "type": "number",
      "description": "Horsepower of the motor"
    },
    "model": {
      "type": "string",
      "description": "Model name if known"
    },
    "condition": {
      "type": "string",
      "enum": ["excellent", "good", "fair", "rough"],
      "description": "Condition of the motor"
    }
  },
  "required": ["brand", "year", "horsepower"]
}
```

---

### 5. Recommend Motor
**Name:** `recommend_motor`  
**Description:** Recommend motors based on customer's boat and usage. Use when customer asks what motor they should get.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "boat_length": {
      "type": "number",
      "description": "Length of the boat in feet"
    },
    "boat_type": {
      "type": "string",
      "enum": ["aluminum", "fiberglass", "pontoon", "inflatable"],
      "description": "Type of boat"
    },
    "usage": {
      "type": "string",
      "enum": ["fishing", "cruising", "watersports", "commercial"],
      "description": "Primary use of the boat"
    },
    "priority": {
      "type": "string",
      "enum": ["speed", "fuel_economy", "price", "reliability"],
      "description": "Customer's top priority"
    },
    "max_budget": {
      "type": "number",
      "description": "Maximum budget in CAD"
    }
  },
  "required": []
}
```

---

### 6. Compare Motors
**Name:** `compare_motors`  
**Description:** Compare two motors side by side. Use when customer wants to compare options.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "motor1": {
      "type": "string",
      "description": "First motor to compare (model name or HP)"
    },
    "motor2": {
      "type": "string",
      "description": "Second motor to compare (model name or HP)"
    }
  },
  "required": ["motor1", "motor2"]
}
```

---

### 7. Send Motor Photos
**Name:** `send_motor_photos`  
**Description:** Send motor photos/details via SMS to customer. Use when customer asks to see pictures.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "customer_phone": {
      "type": "string",
      "description": "Customer's phone number"
    },
    "motor_model": {
      "type": "string",
      "description": "Motor model to send photos of"
    },
    "use_current_motor": {
      "type": "boolean",
      "description": "Whether to use the motor currently being viewed"
    }
  },
  "required": ["customer_phone"]
}
```

---

### 8. Check Current Deals
**Name:** `check_current_deals`  
**Description:** Check current promotions and deals. Use when customer asks about deals or specials.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "motor_model": {
      "type": "string",
      "description": "Specific motor to check deals for"
    },
    "hp_range": {
      "type": "string",
      "description": "HP range to check deals for (e.g., '100-150')"
    }
  },
  "required": []
}
```

---

### 9. Get Quote Summary
**Name:** `get_quote_summary`  
**Description:** Get the current state of the customer's quote. Use when customer asks about their quote progress.

**Parameters:**
```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

---

### 10. Set Boat Details
**Name:** `set_boat_details`  
**Description:** Update the customer's boat information in their quote.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "length": {
      "type": "number",
      "description": "Boat length in feet"
    },
    "type": {
      "type": "string",
      "description": "Type of boat (aluminum, fiberglass, pontoon)"
    },
    "make": {
      "type": "string",
      "description": "Boat manufacturer"
    },
    "currentHp": {
      "type": "number",
      "description": "Current motor horsepower"
    }
  },
  "required": []
}
```

---

### 11. Go To Quote Step
**Name:** `go_to_quote_step`  
**Description:** Navigate to a specific step in the quote builder.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "step": {
      "type": "string",
      "enum": ["motor", "path", "boat", "trade-in", "summary"],
      "description": "Which step to navigate to"
    }
  },
  "required": ["step"]
}
```

---

### 12. Navigate to Motors (CRITICAL - Screen Control)
**Name:** `navigate_to_motors`  
**Description:** Navigate to the motor selection page and apply filters based on customer preferences. Use this to SHOW the customer motors on their screen. ALWAYS call this first when discussing motors, then call get_visible_motors to see what's displayed.

**Parameters:**
```json
{
  "type": "object",
  "properties": {
    "horsepower": {
      "type": "number",
      "description": "Filter by specific horsepower (e.g., 20, 60, 115)"
    },
    "model_search": {
      "type": "string",
      "description": "Search by model name or family (FourStroke, Verado, Pro XS, SeaPro)"
    },
    "in_stock_only": {
      "type": "boolean",
      "description": "Only show motors currently in stock"
    },
    "start_type": {
      "type": "string",
      "enum": ["electric", "manual"],
      "description": "Filter by start type - electric start or manual pull-start"
    },
    "control_type": {
      "type": "string",
      "enum": ["tiller", "remote"],
      "description": "Filter by steering/control type - tiller handle or remote console"
    },
    "shaft_length": {
      "type": "string",
      "enum": ["short", "long", "xl", "xxl"],
      "description": "Filter by shaft length - short (15\"), long (20\"), xl (25\"), xxl (30\")"
    }
  },
  "required": []
}
```

---

### 13. Get Visible Motors (CRITICAL - Read Screen State)
**Name:** `get_visible_motors`  
**Description:** Read the motors currently visible on the customer's screen. Call this AFTER navigate_to_motors to know exactly what to describe. This is INSTANT (no API call) - reads directly from their browser state. Returns count, price range, and motor details.

**Wait for response:** ✅ ENABLED (Critical - you need the response!)

**Parameters:**
```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

---

## Existing Server Tools (Already Configured)

These tools call the edge functions we've already set up:

### check_inventory (Server Tool)
**Endpoint:** `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/voice-inventory-lookup`
**Method:** POST
**Body:**
```json
{
  "action": "check_inventory",
  "params": {
    "horsepower": "<number>",
    "family": "<string>",
    "in_stock": true,
    "min_hp": "<number>",
    "max_hp": "<number>"
  }
}
```

### get_motor_price (Server Tool)
**Endpoint:** `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/voice-inventory-lookup`
**Method:** POST
**Body:**
```json
{
  "action": "get_motor_price",
  "params": {
    "model": "<string>"
  }
}
```

### get_motor_for_quote (Server Tool)
**Endpoint:** `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/voice-inventory-lookup`
**Method:** POST
**Body:**
```json
{
  "action": "get_motor_for_quote",
  "params": {
    "model": "<string>"
  }
}
```

---

## System Prompt Enhancements

Add these sections to your agent's system prompt for the new capabilities:

```
## ENHANCED CAPABILITIES:

### Service Cost Estimates
When customers ask about service costs, use estimate_service_cost. Always mention estimates are approximate and booking confirms final price.

### Trade-In Valuations
When customers ask about trade-in value, use estimate_trade_value. Always caveat that final value requires inspection.

### Motor Recommendations
When customers ask "what motor should I get?", use recommend_motor. Ask about their boat if you don't know.

### Motor Comparisons
When customers want to compare two motors, use compare_motors to give them a detailed side-by-side.

### Callbacks & Reminders
- Use schedule_callback when customer wants someone to call them
- Use set_reminder when customer wants to be reminded about something later

### Quote Control
- Use get_quote_summary to check what's in their quote
- Use set_boat_details to update their boat info
- Use go_to_quote_step to help them navigate

### Deals & Promotions
Be proactive about mentioning current deals. Use check_current_deals when relevant.
```

---

## Testing Phrases

Test your agent with these phrases:

1. **Callback:** "Can someone call me tomorrow afternoon?"
2. **Reminder:** "Remind me about this motor next week"
3. **Service:** "How much is a 100-hour service on a 150 FourStroke?"
4. **Trade-in:** "What's my 2019 Mercury 115 worth?"
5. **Recommendation:** "I have a 16-foot aluminum fishing boat - what motor do you recommend?"
6. **Comparison:** "Compare the 115 Pro XS with the 150 FourStroke"
7. **Photos:** "Can you text me pictures of that motor?"
8. **Deals:** "Any specials going on right now?"
9. **Quote:** "What's in my quote so far?"
