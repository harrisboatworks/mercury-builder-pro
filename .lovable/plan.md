

# Add Motor Detail Links to SMS and Email

## Problem

The SMS and email tools are sending messages without useful links:

| Tool | Current State | Issue |
|------|--------------|-------|
| **SMS** | "The 9.9MRC FourStroke you asked about is in stock. Ready when you are!" | No link - customer can't click to see details |
| **Email** | Links to `harrisboatworks.ca/motor/${motor.id}` | Broken link - that route doesn't exist |

Customer has no way to view the motor they asked about!

---

## Solution

Link to the quote tool with the specific motor pre-selected so customers can:
1. See full specs and photos
2. Start building a quote immediately

**Link format:** `https://quote.harrisboatworks.ca/quote?motor={motorId}`

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/voice-send-follow-up/index.ts` | Add motor link to SMS templates |
| `supabase/functions/elevenlabs-mcp-server/index.ts` | 1) Pass motor ID to SMS function, 2) Fix email link |

---

## Technical Changes

### 1. Update SMS Function to Accept Motor ID and Include Link

**File:** `supabase/functions/voice-send-follow-up/index.ts`

- Add `motor_id` parameter to the request body
- Update `inventory_alert` template to include a clickable link:

```typescript
// New template with link
inventory_alert: (name: string, motor?: string, motorId?: string) => {
  const link = motorId 
    ? `\n\nView details: quote.harrisboatworks.ca/quote?motor=${motorId}` 
    : '';
  return `Hi ${name}! ${motor ? `The ${motor} you asked about is in stock.` : 'We have motors in stock!'} Ready when you are!${link} — Harris Boat Works 📞 ${COMPANY_PHONE}`;
}
```

**Example SMS output:**
```
Hi Jay! The 9.9MRC FourStroke you asked about is in stock. Ready when you are!

View details: quote.harrisboatworks.ca/quote?motor=abc123

— Harris Boat Works 📞 (905) 342-2153
```

### 2. Update MCP Server to Pass Motor ID

**File:** `supabase/functions/elevenlabs-mcp-server/index.ts`

In `send_motor_photos` case (~line 545-579):
- Look up motor in database to get ID (like email tool does)
- Pass `motor_id` to the follow-up function

### 3. Fix Email Link

**File:** `supabase/functions/elevenlabs-mcp-server/index.ts`

Change line 649 from:
```typescript
<a href="https://harrisboatworks.ca/motor/${motor.id}" class="cta">View Full Details</a>
```

To:
```typescript
<a href="https://quote.harrisboatworks.ca/quote?motor=${motor.id}" class="cta">View Full Details</a>
```

### 4. Handle Query Parameter on Quote Page

**File:** `src/pages/quote/MotorSelectionPage.tsx`

Add logic to read `?motor=` query parameter and auto-open that motor's detail modal when the page loads.

---

## Expected Results

| Channel | Message | Link |
|---------|---------|------|
| **SMS** | "The 9.9MRC FourStroke you asked about is in stock..." | `quote.harrisboatworks.ca/quote?motor=abc123` |
| **Email** | Full specs card with CTA button | Same link in "View Full Details" button |

Customer clicks → Opens quote tool → Motor detail modal appears → Can start quote immediately.

