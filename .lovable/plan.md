
# Comprehensive Motor Options Integration Verification & Enhancement Plan

## Executive Summary
This plan verifies that motor options (SmartCraft Connect, maintenance kits, fuel tanks) are properly integrated across all touchpoints, and adds recommended accessories to the spec sheet PDF.

---

## Part 1: Current Integration Status (Verification Results)

### 1.1 Pricing Calculations ✅ VERIFIED WORKING
The `selectedOptions` from the Options page are correctly calculated across:

| Component | Status | How It Works |
|-----------|--------|--------------|
| **GlobalStickyQuoteBar** | ✅ | Reduces `state.selectedOptions` and adds to running total (line 53-56) |
| **UnifiedMobileBar** | ✅ | Same reduction logic for mobile pricing consistency |
| **MobileQuoteDrawer** | ✅ | Iterates `selectedOptions` as individual line items (line 55-63) |
| **QuoteSummaryPage** | ✅ | Calculates `selectedOptionsTotal` and passes to `accessoryBreakdown` (line 253, 296-327) |
| **QuoteRevealCinematic** | ✅ | Receives `finalPrice` including options from `packageSpecificTotals.subtotal` |
| **ProfessionalQuotePDF** | ✅ | Renders `accessoryBreakdown` as individual rows under "Accessories & Setup" (line 653-676) |

### 1.2 AI Text Chat ⚠️ PARTIAL
The text chatbot (`ai-chatbot-stream/index.ts`) has:
- ✅ Knowledge about included accessories by HP range (fuel tanks, props) at lines 999-1036
- ✅ Parts lookup guidance and accessories category routing (lines 1066-1077)
- ❌ **Missing**: Specific knowledge about SmartCraft Connect Mobile, 100-Hour Service Kits, motor covers, and other purchasable accessories from `motor_options` table

### 1.3 Voice AI (ElevenLabs) ⚠️ PARTIAL
The voice agent has:
- ✅ SmartCraft Connect FAQ via `_shared/smartcraft-connect-knowledge.ts`
- ✅ Model suffix decoder for motor features
- ❌ **Missing**: Knowledge about maintenance kits, fuel tank options, and other `motor_options` products

### 1.4 Spec Sheet PDF ❌ MISSING
The `CleanSpecSheetPDF.tsx` currently:
- ✅ Shows technical specs and "Why Boaters Love It" insights
- ✅ Lists "What's Included" (standard propeller, fuel tank, manual)
- ❌ **Missing**: "Recommended Accessories" section with HP-compatible options from `motor_option_rules`

---

## Part 2: Implementation Plan

### Task 1: Add Accessories Knowledge to AI Chat System Prompt
**File:** `supabase/functions/ai-chatbot-stream/index.ts`

Add a new section after "ACCESSORIES & UPGRADES" (~line 1077):

```text
## RECOMMENDED ACCESSORIES FROM QUOTE BUILDER

When customers ask about accessories for a specific motor, recommend these based on HP:

### SmartCraft Connect Mobile ($325, P/N 8M0173128)
- Compatible with EFI motors 8HP and above (2004+ for 40HP+, 2022+ for 25-30HP)
- Streams live engine data to smartphone via Bluetooth
- Shows fuel burn, battery voltage, GPS range, maintenance reminders
- "Great add-on for peace of mind and trip planning"

### Service & Maintenance Kits (HP-specific)
Point customers to the Options page in the quote builder - we show the correct kit for their motor:
- 100-Hour Service Kits: Oil change, spark plugs, gear oil, filter
- 300-Hour Service Kits: Same plus water pump impeller
- Oil Change Kits: Quick DIY oil service between full services

### Motor Covers
Available for all HP ranges - protect the motor from UV, rain, and debris when stored.

### Fuel Tank Options
- 12L ($99-149): Standard portable for smaller motors
- 25L ($149-249): Extended range for bigger trips
- Some motors include fuel tanks - check the quote builder for what's included
```

### Task 2: Add Accessories Knowledge to Voice AI Knowledge Base
**File:** `supabase/functions/_shared/format-kb-documents.ts`

Add a new export function `formatAccessoriesGuide()`:

```typescript
export function formatAccessoriesGuide(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Mercury Accessories & Maintenance Guide
Updated: ${now}

## SmartCraft Connect Mobile
The SmartCraft Connect Mobile ($325) is a plug-and-play Bluetooth module that streams 
live engine data to your smartphone. Compatible with Mercury outboards 40HP+ (2004 
and newer) and 25-30HP (2022 and newer).

### What It Shows
- Real-time fuel consumption and range
- Battery voltage monitoring
- Maintenance reminders
- GPS-based trip logging
- Engine temperature and RPM

### Who It's For
Anyone who wants peace of mind on the water. Great for tracking fuel usage, 
planning trips, and catching problems early.

## Service & Maintenance Kits
We stock genuine Mercury service kits matched to specific HP ranges:

### 100-Hour Service Kits ($85-175)
Contains everything for the 100-hour service interval:
- Engine oil and filter
- Gearcase oil
- Spark plugs
- Fuel filter

Available for: Under 25HP, 40-60HP, 75-115HP, 150HP, 175-300HP

### 300-Hour Service Kits ($150-350)
Same as 100-hour PLUS water pump impeller and gaskets.
Recommended every 300 hours or 3 years.

### Oil Change Kits ($45-95)
Quick DIY oil changes between full services.

## Motor Covers
Custom-fit covers protect your investment from UV, rain, and debris.
Available for all HP ranges from portable motors to V8 engines.

## Fuel Tank Options
- 12L External Tank: $99-149 - Standard portable for smaller motors
- 25L External Tank: $149-249 - Extended range for longer trips

Note: Many motors 8-30HP already include a fuel tank. Check the quote builder.

## How to Recommend
When a customer asks about accessories, suggest:
1. SmartCraft Connect Mobile for any EFI motor 8HP+ 
2. The correct 100-Hour Service Kit for their HP range
3. A motor cover for storage protection
4. The Options page in the quote builder shows all compatible accessories
`;
}
```

Then update `KB_DOCUMENTS` constant and `sync-elevenlabs-static-kb` to include this new document.

### Task 3: Add "Recommended Accessories" to Spec Sheet PDF
**File:** `src/components/motors/CleanSpecSheetPDF.tsx`

Add a new section in the right column after "Special Offers":

```tsx
{/* Recommended Accessories */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Recommended Accessories</Text>
  <View style={styles.includedList}>
    {hpNumber >= 8 && (
      <Text style={styles.includedItem}>
        ★ SmartCraft Connect Mobile - Live engine data to your phone
      </Text>
    )}
    <Text style={styles.includedItem}>
      ★ 100-Hour Service Kit - Complete maintenance in one box
    </Text>
    {hpNumber >= 25 && (
      <Text style={styles.includedItem}>
        ★ Motor Cover - UV and weather protection
      </Text>
    )}
  </View>
</View>
```

**File:** `src/components/motors/SpecSheetPDFDownload.tsx`

Optionally fetch HP-compatible accessories from `motor_option_rules` to include in the PDF:

```typescript
// Fetch recommended accessories for this HP
const { data: recommendedOptions } = await supabase
  .from('motor_option_rules')
  .select('motor_options(name, base_price, short_description)')
  .eq('min_hp', hp)
  .eq('is_recommended', true)
  .limit(4);
```

### Task 4: Update Voice Agent Knowledge Sync
**File:** `supabase/functions/sync-elevenlabs-static-kb/index.ts`

Add the new accessories document to the sync list:

```typescript
import { formatAccessoriesGuide } from '../_shared/format-kb-documents.ts';

const KB_DOCUMENTS = {
  // ... existing documents
  ACCESSORIES_GUIDE: {
    name: 'Accessories & Maintenance Guide',
    content: formatAccessoriesGuide,
  },
};
```

---

## Part 3: Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/functions/ai-chatbot-stream/index.ts` | Modify | Add accessories knowledge section to system prompt |
| `supabase/functions/_shared/format-kb-documents.ts` | Modify | Add `formatAccessoriesGuide()` function |
| `supabase/functions/sync-elevenlabs-static-kb/index.ts` | Modify | Register accessories guide in sync list |
| `src/components/motors/CleanSpecSheetPDF.tsx` | Modify | Add "Recommended Accessories" section |
| `src/components/motors/SpecSheetPDFDownload.tsx` | Modify (optional) | Fetch HP-specific recommendations from DB |

---

## Part 4: Testing Checklist

After implementation:

1. **Pricing Flow**
   - [ ] Select a motor and add SmartCraft Connect + 100-Hour Kit on Options page
   - [ ] Verify mobile drawer shows correct running total
   - [ ] Verify sticky bar shows correct running total
   - [ ] Complete to Summary - verify accessory line items appear
   - [ ] Download PDF - verify "Accessories & Setup" section lists items

2. **AI Chat**
   - [ ] Ask "What accessories do you recommend for a 20HP motor?"
   - [ ] Ask "Tell me about SmartCraft Connect"
   - [ ] Ask "What service kit do I need for a 60HP?"

3. **Voice Agent**
   - [ ] Ask "What's SmartCraft Connect?"
   - [ ] Ask "Do you sell service kits?"

4. **Spec Sheet PDF**
   - [ ] Download spec sheet for 9.9HP motor
   - [ ] Verify "Recommended Accessories" section appears
   - [ ] Confirm SmartCraft is recommended for 8HP+

---

## Summary

The pricing integration is already working correctly across all components. The main gaps are:
1. AI chat needs specific accessory product knowledge
2. Voice AI needs an Accessories Guide document
3. Spec Sheet PDF needs a "Recommended Accessories" section

These additions will ensure customers can get accessory recommendations from any channel (chat, voice, or PDF) while maintaining consistent pricing throughout the quote builder flow.
