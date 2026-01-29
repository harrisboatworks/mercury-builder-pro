

# Add Email Sending Capability to Voice Chat

## Problem Summary

The voice agent currently has an `email_quote_to_customer` tool but:
1. The system prompt discourages sending product info via SMS (correctly) but doesn't clearly promote email as the alternative
2. The agent needs a more general "send motor info via email" tool that's simpler than the full quote email
3. Instructions need updating so the agent offers email proactively when customers want motor details sent to them

## Solution

### 1. Add New Tool: `send_motor_info_email`

A simpler tool specifically for sending motor information (specs, photos, pricing) via email when requested. This is separate from the full quote email.

### 2. Update Voice Agent System Prompt

Add clear instructions for when to offer email:
- Customer asks to "send me the details" → Ask for email, use `send_motor_info_email`
- Customer wants a quote emailed → Use existing `email_quote_to_customer`
- Only use SMS for time-sensitive confirmations (appointment reminders, callback confirmations)

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-mcp-server/index.ts` | Add `send_motor_info_email` tool definition and handler |
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Update system prompt to guide email usage |

---

## Code Changes

### 1. Add Tool Definition (elevenlabs-mcp-server/index.ts, after line 127)

```typescript
{
  name: "send_motor_info_email",
  description: "Send motor details, specs, and pricing via email. Use when customer wants info emailed to them.",
  inputSchema: {
    type: "object",
    properties: {
      customer_email: { type: "string", description: "Customer's email address" },
      customer_name: { type: "string", description: "Customer's name" },
      motor_model: { type: "string", description: "Motor model to send info about" },
      include_pricing: { type: "boolean", description: "Include pricing in the email (default true)" }
    },
    required: ["customer_email", "motor_model"]
  }
}
```

### 2. Add Tool Handler (elevenlabs-mcp-server/index.ts, after send_motor_photos handler ~line 565)

```typescript
case "send_motor_info_email": {
  const customerEmail = args.customer_email as string;
  const customerName = (args.customer_name as string) || "Customer";
  const motorModel = args.motor_model as string;
  const includePricing = args.include_pricing !== false;
  
  // Look up motor details
  const { data: motor } = await supabase
    .from("motor_models")
    .select("*")
    .or(`model_display.ilike.%${motorModel}%,model.ilike.%${motorModel}%`)
    .limit(1)
    .single();
  
  if (!motor) {
    return { 
      content: [{ type: "text", text: `I couldn't find that motor in our system. Could you give me the exact model name?` }] 
    };
  }
  
  // Check for Resend API key
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return { 
      content: [{ type: "text", text: `I'm having trouble with our email system right now. You can find all the details at harrisboatworks.ca, or I can have someone from our team call you.` }] 
    };
  }
  
  // Build email HTML with motor details
  const priceSection = includePricing && motor.msrp 
    ? `<p><strong>Price:</strong> $${motor.msrp.toLocaleString()} CAD</p>` 
    : '';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .motor-card { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .cta { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Mercury ${motor.model_display || motor.model}</h1>
          <p>Harris Boat Works</p>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Here's the motor info you asked about!</p>
          
          <div class="motor-card">
            <h2>${motor.model_display || motor.model}</h2>
            <p><strong>Horsepower:</strong> ${motor.horsepower} HP</p>
            <p><strong>Family:</strong> ${motor.family || 'FourStroke'}</p>
            <p><strong>Shaft Length:</strong> ${motor.shaft || 'Standard'}</p>
            <p><strong>Availability:</strong> ${motor.in_stock ? 'In Stock' : 'Available to Order (7-14 days)'}</p>
            ${priceSection}
          </div>
          
          <p>Want a detailed quote with options and promotions?</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="https://harrisboatworks.ca/motor/${motor.slug || motor.id}" class="cta">View Full Details</a>
          </p>
          
          <p>Questions? Just reply to this email or call us at (905) 342-2153.</p>
          
          <p>Thanks,<br>Harris Boat Works</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  try {
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(RESEND_API_KEY);
    
    await resend.emails.send({
      from: "Harris Boat Works <quotes@hbwsales.ca>",
      to: [customerEmail],
      reply_to: "info@harrisboatworks.ca",
      subject: `Mercury ${motor.model_display || motor.model} - Motor Details`,
      html: emailHtml
    });
    
    return { 
      content: [{ 
        type: "text", 
        text: `Done! I've sent the ${motor.model_display || motor.model} details to ${customerEmail}. It'll be in your inbox in just a minute. Anything else you'd like to know?` 
      }] 
    };
  } catch (error) {
    console.error("[MCP] Email send error:", error);
    return { 
      content: [{ 
        type: "text", 
        text: `I had trouble sending that email. Could you double-check your email address, or I can have someone from our team follow up with you?` 
      }] 
    };
  }
}
```

### 3. Update System Prompt (elevenlabs-conversation-token/index.ts, lines 566-573)

**Replace:**
```typescript
## PHOTOS AND PRODUCT INFO:
- All motor photos, specs, and details are on harrisboatworks.ca
- Direct customers to the website for photos: "You can see all the details and photos on our website"
- Don't offer to "send photos via text" - the website has everything they need
- Only mention SMS for things NOT on the website (like confirming specific stock availability of a particular unit)
```

**With:**
```typescript
## SENDING MOTOR INFO:
**When customer asks you to "send details" or "email me the info":**
1. Ask for their email address: "Sure! What's your email?"
2. Use send_motor_info_email tool with their email and the motor model
3. Confirm it's sent: "Done! Check your inbox."

**EMAIL vs SMS - Use the right tool:**
- Motor specs, pricing, details → EMAIL (use send_motor_info_email)
- Full quote with options → EMAIL (use email_quote_to_customer)  
- Quick appointment/callback confirmation → SMS only if they specifically want a text

**NEVER offer to text product info or photos** - email is the right channel for that.
**ALWAYS ask for email/phone BEFORE saying you'll send something** - don't claim success without the contact info.
```

---

## Expected Behavior After Fix

| Customer Says | Before | After |
|---------------|--------|-------|
| "Can you send me the details?" | Claims to send SMS without phone number | "Sure! What's your email?" → sends motor info email |
| "Email me the specs on this one" | Uses quote email (overkill) | Uses simple motor info email |
| "Text me the info" | Tries SMS, fails silently | "I can email you all the details - what's your email?" |

---

## Technical Notes

1. The `send_motor_info_email` tool uses the verified `hbwsales.ca` domain with `quotes@hbwsales.ca` sender
2. Uses dynamic import for Resend to match existing patterns
3. Falls back gracefully if RESEND_API_KEY is missing
4. Includes motor lookup to get real specs/pricing from database

