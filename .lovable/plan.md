

# Enhance Spec Sheet with Competitive Insights & Buyer-Focused Content

## Current State

The PDF spec sheet now has:
- Technical specs (HP, weight, displacement, etc.)
- Model configuration breakdown
- Warranty & service info
- "Why Boaters Love This Motor" - 3 AI-generated insights
- Special offers
- Recommended accessories

This is solid! The "Why Boaters Love This Motor" section is appearing now and looks great.

## What Customers Really Want to Know

Based on research into what drives outboard motor purchases:

| Priority | What They Want | Why It Matters |
|----------|----------------|----------------|
| 1 | **How does it compare to competition?** | Buyers cross-shop Yamaha, Honda, Suzuki |
| 2 | **Best uses / ideal boat types** | "Will this work for MY boat?" |
| 3 | **Real fuel economy** | Total cost of ownership matters |
| 4 | **Common questions answered** | Reduces friction, builds confidence |
| 5 | **Weight vs competitors** | Portability is huge for smaller motors |

## Proposed Additions

### Option A: "Mercury Advantage" Section (Recommended)
Add a new section that highlights what makes Mercury stand out vs competitors **without naming them directly** (stays classy, avoids spec comparison rabbit holes):

```
Mercury Advantage
• Front-mounted gear shift for one-handed operation
• Industry's first EFI on portable outboards (15HP+)
• 7-year warranty coverage with Get 7 promotion
• CSI Award-winning local dealer support
```

### Option B: "Ideal For" / Best Use Cases
Add a section that tells buyers what boats/activities this motor is perfect for:

```
Ideal For
• Sailboat auxiliary power
• Dinghies and tenders
• Small aluminum fishing boats
• Inflatable boats (RIBs)
• Car-top boats and canoes
```

### Option C: "Quick Stats at a Glance" Comparison Box
A simple box showing how this motor stacks up in its class:

```
┌─────────────────────────────────────┐
│ How Mercury Compares (5HP Class)    │
│ ─────────────────────────────────── │
│ Weight: Competitive (57 lbs)        │
│ Warranty: Best-in-class (7 years*)  │
│ Fuel System: Modern FourStroke      │
│ Starting: Reliable pull-start       │
│                                     │
│ *With Get 7 promotion               │
└─────────────────────────────────────┘
```

### Option D: "Common Questions" FAQ
Address the top 3 questions buyers have for this HP range:

```
Common Questions
Q: Do I need a battery for this motor?
A: No - manual start models work independently

Q: Can I run this in saltwater?
A: Yes - flush after each use for longevity

Q: How often does it need service?
A: Every 100 hours or annually, whichever comes first
```

## Implementation Approach

### 1. Expand the Edge Function Prompt
Ask Perplexity to return additional content alongside insights:

```typescript
// New prompt structure
{
  insights: ["reason 1", "reason 2", "reason 3"],
  ideal_uses: ["sailboat aux", "dinghy", "aluminum boat"],
  mercury_advantages: ["front shifter", "EFI first", "dealer network"],
  common_qa: [
    { q: "Do I need a battery?", a: "No for manual start" }
  ]
}
```

### 2. Add New Sections to CleanSpecSheetPDF
- "Ideal For" section with bullet points
- "Mercury Advantage" callout box
- Optional: "Common Questions" if space permits

### 3. Keep It Single-Page
The PDF is currently a nice single page. We'd need to be strategic about what to add to avoid spilling onto page 2. Options:
- Replace "Recommended Accessories" (less valuable)
- Make sections more compact
- Use a slightly smaller font for new sections

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-spec-sheet-insights/index.ts` | Expand Perplexity prompt to fetch additional buyer-focused content |
| `src/components/motors/CleanSpecSheetPDF.tsx` | Add new sections for ideal uses, Mercury advantages, and/or FAQ |
| `src/components/motors/SpecSheetPDFDownload.tsx` | Pass new data fields to PDF component |

## Recommendation

Start with **Options A + B** (Mercury Advantage + Ideal For):
- These are the most impactful for a buyer deciding between brands
- They keep it positive (not attacking competitors)
- They're easy to generate per HP range
- They fit within the single-page constraint

The FAQ is nice-to-have but might push to a second page - could add later if there's demand.

## Example Final Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Harris Logo] [Mercury Logo]              Harris Boat Works    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  5MLHA Sail Power FourStroke                      MSRP         │
│  2025 Mercury Marine • 5 HP                       $2,245       │
│                                                                 │
│  LEFT COLUMN                    │  RIGHT COLUMN                │
│  ─────────────                  │  ─────────────               │
│  Model Configuration            │  Warranty & Service          │
│  Technical Specifications       │  What's Included             │
│                                 │  Special Offers              │
│  ★ Ideal For (NEW)              │  Why Boaters Love It         │
│  • Sailboat auxiliary power     │  • Reliability insight       │
│  • Dinghies and tenders         │  • Fuel economy insight      │
│  • Small aluminum fishing       │  • Ease of use insight       │
│  • Car-top boats                │                              │
│                                 │  ★ Mercury Advantage (NEW)   │
│                                 │  • Front-mounted shifter     │
│                                 │  • Best-in-class warranty    │
│                                 │  • Local certified service   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Harris Boat Works  •  Mercury CSI Award Winner  •  905-342-2153│
└─────────────────────────────────────────────────────────────────┘
```

