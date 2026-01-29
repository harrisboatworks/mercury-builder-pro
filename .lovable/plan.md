

# Fix: Restore SMS Option (Email Should Be ADDITIONAL, Not Replacement)

## What I Broke

I incorrectly added instructions that discourage SMS for product info. The user wanted email **added** as an option, not to replace SMS.

**Wrong instruction I added:**
```
**NEVER offer to text product info or photos** - email is the right channel for that.
```

## The Fix

Update the system prompt to offer BOTH options - let the customer choose their preferred channel.

---

## File to Modify

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Fix lines 566-578 to support both email AND SMS |

---

## Code Change

**Replace lines 566-578:**
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

**With:**
```typescript
## SENDING MOTOR INFO:
**When customer asks you to "send details", "send me info", etc.:**
1. Ask HOW they want it: "Sure! Would you like that by email or text?"
2. Get their contact info (email or phone depending on preference)
3. Use the right tool:
   - Email → send_motor_info_email
   - Text/SMS → send_motor_photos (sends link via SMS)
4. Confirm AFTER the tool succeeds, not before

**CRITICAL: ALWAYS get contact info BEFORE saying you'll send something.**
Don't say "I've sent it" until you actually have their email/phone AND the tool confirms success.
```

---

## Expected Behavior

| Customer Says | Response |
|---------------|----------|
| "Send me the details" | "Sure! Would you like that by email or text?" |
| "Email me the specs" | "What's your email?" → sends via email |
| "Text me the info" | "What's your phone number?" → sends via SMS |
| "Can you send that to me?" | "Of course! Email or text?" |

Both channels work - customer chooses.

