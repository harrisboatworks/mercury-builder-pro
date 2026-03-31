

# Redesign Purchase Path Buttons

## Problem
The current "Loose Motor" and "Professional Install" options look like info cards with too much text, not clear clickable choices. They don't feel like buttons. The navigation already auto-advances (handled in `PurchasePathPage.tsx` via useEffect), so that part works — the issue is purely visual.

## Design approach
Replace the verbose card layout with two clean, bold selection tiles — minimal text, strong visual identity, obvious clickability. Think of it like the mounting option gallery but bigger.

### Mobile (< md)
Two stacked full-width tiles:
- Large icon (Package / Wrench) centered
- Bold title: "Loose Motor" / "Professional Install"  
- One-line subtitle: "Pick up & go" / "We handle everything"
- No bullet lists, no checkmarks
- Strong tap feedback (scale + border color change)
- Selected state: dark background, white text, checkmark overlay — then auto-navigates

### Desktop (≥ md)
Two side-by-side tiles in a 2-column grid:
- Same clean layout but larger — icon, title, one-line subtitle
- Hover: lift + border highlight
- Click: brief selected state flash → auto-navigate
- Badge stays ("Quick & Easy" / "Full Service") but smaller and integrated

### What gets removed
- All the CheckCircle bullet point lists (6-8 lines of feature text per card)
- The "Select Loose Motor →" / "Select Installation →" bottom buttons (the whole card is the button)
- CardHeader / CardContent / CardTitle structure — replaced with simpler div layout

### What stays
- The badges ("Quick & Easy" / "Full Service")
- The Package and Wrench icons
- The existing `onSelectPath` callback and auto-navigation logic in PurchasePathPage.tsx (unchanged)

## File changed

| File | Change |
|------|--------|
| `src/components/quote-builder/PurchasePath.tsx` | Complete redesign of both mobile and desktop layouts — clean selection tiles with minimal text |

