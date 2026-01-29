
# Implement SMS Sending for Text Chatbot with Production URLs

## Problem

The text chatbot can instruct users it will send SMS, but:
1. **No handler exists** - The `[SEND_SMS]` and `[PRICE_ALERT]` formats in the prompt are not processed
2. **Links must use production URL** - All SMS links must use `quote.harrisboatworks.ca`, not preview URLs

## Solution

Add frontend handlers in `EnhancedChatWidget.tsx` to detect `[SEND_SMS]` and `[PRICE_ALERT]` commands and invoke the existing `voice-send-follow-up` Edge Function (which already uses the correct production domain).

---

## Changes Overview

| File | Change |
|------|--------|
| `src/components/chat/EnhancedChatWidget.tsx` | Add handlers for `[SEND_SMS]` and `[PRICE_ALERT]` commands |
| `supabase/functions/voice-send-follow-up/index.ts` | Add new message types for `comparison` and `price_alert` |

---

## Technical Implementation

### 1. Add SMS Command Handler to EnhancedChatWidget

**File:** `src/components/chat/EnhancedChatWidget.tsx`

After the existing `[LEAD_CAPTURE]` handler (around line 591), add handlers for the new SMS formats:

```typescript
// Check for SMS send pattern
const smsMatch = finalResponse.match(/\[SEND_SMS:\s*(\{[^}]+\})\]/);
if (smsMatch) {
  try {
    const smsData = JSON.parse(smsMatch[1]);
    console.log('[Chat] SMS send detected:', smsData);
    
    // Remove the marker from displayed message
    displayResponse = displayResponse.replace(/\[SEND_SMS:\s*\{[^}]+\}\]/, '').trim();
    
    // Determine message type and motor context
    const activeMotor = state.previewMotor || state.motor;
    
    const { error: smsError } = await supabase.functions.invoke('voice-send-follow-up', {
      body: {
        customer_name: smsData.name || 'Friend',
        customer_phone: smsData.phone,
        message_type: smsData.content === 'comparison' ? 'comparison' : 
                      smsData.content === 'promo_reminder' ? 'promo_reminder' : 'quote_interest',
        motor_model: activeMotor?.model || smsData.motors?.join(' vs '),
        motor_id: activeMotor?.id,
        custom_note: smsData.content === 'comparison' 
          ? `Comparing: ${smsData.motors?.join(' vs ')}`
          : undefined
      }
    });
    
    if (smsError) {
      console.error('[Chat] Failed to send SMS:', smsError);
    } else {
      console.log('[Chat] SMS sent successfully');
      toast.success("Text sent! Check your phone.");
    }
  } catch (parseError) {
    console.error('[Chat] Failed to parse SMS command:', parseError);
  }
}

// Check for price alert pattern
const priceAlertMatch = finalResponse.match(/\[PRICE_ALERT:\s*(\{[^}]+\})\]/);
if (priceAlertMatch) {
  try {
    const alertData = JSON.parse(priceAlertMatch[1]);
    console.log('[Chat] Price alert detected:', alertData);
    
    // Remove the marker from displayed message
    displayResponse = displayResponse.replace(/\[PRICE_ALERT:\s*\{[^}]+\}\]/, '').trim();
    
    // Store price alert subscription in database
    const { error: alertError } = await supabase.from('price_alert_subscriptions').insert({
      phone: alertData.phone,
      motor_hp: alertData.motor_hp,
      customer_name: alertData.name,
      created_at: new Date().toISOString()
    });
    
    // Also capture as lead
    await supabase.functions.invoke('capture-chat-lead', {
      body: {
        name: alertData.name || 'Price Alert Subscriber',
        phone: alertData.phone,
        conversationContext: `Price drop alert for ${alertData.motor_hp}HP motor`,
        currentPage: location.pathname
      }
    });
    
    if (alertError) {
      console.error('[Chat] Failed to create price alert:', alertError);
    } else {
      console.log('[Chat] Price alert created');
      toast.success("Got it! We'll text you if pricing changes.");
    }
  } catch (parseError) {
    console.error('[Chat] Failed to parse price alert:', parseError);
  }
}
```

### 2. Update Streaming Display to Hide New Markers

**File:** `src/components/chat/EnhancedChatWidget.tsx`

Update the display text cleanup (around line 537):

```typescript
// Strip all command markers during streaming to hide them from user
const displayText = fullResponse
  .replace(/\[LEAD_CAPTURE:.*$/s, '')
  .replace(/\[SEND_SMS:.*$/s, '')
  .replace(/\[PRICE_ALERT:.*$/s, '')
  .trim();
```

### 3. Add New Message Templates to voice-send-follow-up

**File:** `supabase/functions/voice-send-follow-up/index.ts`

Add templates for the new message types:

```typescript
comparison: (name: string, note?: string) => 
  `Hi ${name}! Here's your motor comparison: quote.harrisboatworks.ca/compare${note ? ` (${note})` : ''}\n\n— Harris Boat Works 📞 ${COMPANY_PHONE}`,

promo_reminder: (name: string) => 
  `Hi ${name}! Quick reminder: the Mercury Get 7 promo ends March 31st. 7-year warranty + pick your bonus!\n\nDetails: quote.harrisboatworks.ca/promotions\n\n— Harris Boat Works 📞 ${COMPANY_PHONE}`,
```

### 4. Create Price Alert Subscriptions Table (Optional Enhancement)

If you want to actually track price alerts for future notifications:

```sql
CREATE TABLE price_alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  motor_hp INTEGER,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE price_alert_subscriptions ENABLE ROW LEVEL SECURITY;
```

---

## URL Verification

All SMS links will use the production domain because:
- The `voice-send-follow-up` function hardcodes `quote.harrisboatworks.ca` in all templates
- New templates (`comparison`, `promo_reminder`) will follow the same pattern
- No dynamic URL generation happens on the frontend

---

## Testing Checklist

1. Start a text chat conversation
2. Ask about a specific motor, then say "let me check with my wife"
3. When the bot offers to text you, provide your phone number
4. Verify SMS is received with `quote.harrisboatworks.ca` link (not preview URL)
5. Click the link to verify it opens the correct motor page
