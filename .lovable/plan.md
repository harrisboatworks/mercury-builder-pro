

# Change "Build Your Quote" Floating CTA Color to Mercury Red

The floating mobile CTA banner at the bottom of the motor selection page currently uses a deep navy (`--cta-navy: 10 26 47` / `#0A1A2F`). You'd prefer a Mercury red to match the promotional imagery.

## Change

**File: `src/components/motors/MobileQuoteCTA.tsx`** (lines 81-84)

Replace the navy background classes with a Mercury red scheme:
- `bg-[hsl(var(--cta-navy))]` → `bg-[#C8102E]` (Mercury's brand red)
- `active:bg-[hsl(var(--cta-navy-active))]` → `active:bg-[#A00D24]` (darker red on press)

That's a single line change — the dismiss button, text, arrow, and behavior all stay the same.

