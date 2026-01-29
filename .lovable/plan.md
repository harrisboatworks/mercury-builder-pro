

# Fix: Voice Chat SMS Not Sending (Secret Name Mismatch)

## Root Cause Analysis

The voice chat SMS feature is completely broken due to a **secret environment variable name mismatch**:

| What Edge Function Expects | What's Actually Configured |
|---------------------------|---------------------------|
| `TWILIO_PHONE_NUMBER` | `TWILIO_FROM_NUMBER` |

This causes `voice-send-follow-up`, `send-get7-campaign`, and parts of `elevenlabs-mcp-server` to fail immediately with "SMS service not configured."

### Evidence
- **No edge function logs**: Function returns at line 88-96 before any logging happens
- **Empty `sms_logs` table**: No SMS attempts ever reach Twilio
- **Agent behavior**: Says "I've sent it" before having a phone number (ElevenLabs hallucination)

---

## Solution

Update the affected edge functions to use `TWILIO_FROM_NUMBER` (the actual secret name) instead of `TWILIO_PHONE_NUMBER`.

---

## Files to Modify

| File | Current | Change To |
|------|---------|-----------|
| `supabase/functions/voice-send-follow-up/index.ts` | `TWILIO_PHONE_NUMBER` | `TWILIO_FROM_NUMBER` |
| `supabase/functions/send-get7-campaign/index.ts` | `TWILIO_PHONE_NUMBER` | `TWILIO_FROM_NUMBER` |
| `supabase/functions/elevenlabs-mcp-server/index.ts` | `TWILIO_PHONE_NUMBER` | `TWILIO_FROM_NUMBER` |

---

## Code Changes

### 1. voice-send-follow-up/index.ts (Line 11)

**Current:**
```typescript
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
```

**Replace with:**
```typescript
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");
```

### 2. send-get7-campaign/index.ts (Line 12)

**Current:**
```typescript
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
```

**Replace with:**
```typescript
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");
```

### 3. elevenlabs-mcp-server/index.ts (Line 535)

**Current:**
```typescript
const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
```

**Replace with:**
```typescript
const twilioPhone = Deno.env.get("TWILIO_FROM_NUMBER");
```

---

## Why Phone Number Formatting Works

For the number "9053766208", the existing logic is correct:
```typescript
function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');  // → "9053766208" (10 digits)
  if (digits.length === 10) {
    return `+1${digits}`;  // → "+19053766208" ✓
  }
  ...
}
```

Users don't need to add "1" - the code handles it automatically.

---

## Expected Results After Fix

| Scenario | Before | After |
|----------|--------|-------|
| Voice agent sends SMS | "SMS service not configured" (silent fail) | SMS delivered via Twilio |
| Edge function logs | Empty | Shows request details and Twilio response |
| `sms_logs` table | Empty | Records each SMS attempt |

---

## Additional Recommendation

The voice agent's premature "I've sent it" claim is an ElevenLabs configuration issue. The agent should be instructed to:
1. ALWAYS ask for phone number before claiming to send anything
2. Wait for tool result before confirming success

This requires updating the ElevenLabs agent system prompt, which is in `supabase/functions/elevenlabs-conversation-token/index.ts`.

