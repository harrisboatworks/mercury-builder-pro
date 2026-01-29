

# Simplify Tiller Installation Page Heading

## Problem
The tiller installation page currently shows three headings:
1. "Configure Your Tiller Installation" (main h2)
2. "Select your mounting option for the 9.9MH FourStroke" (subtitle paragraph)
3. "Choose Your Mounting Option" (OptionGallery title)

The user wants to keep **only** "Choose Your Mounting Option" from the OptionGallery.

## Solution

Hide the main h2 and subtitle paragraph when displaying the tiller motor flow.

### File to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/InstallationConfig.tsx` | Wrap the h2 and subtitle in a conditional that hides them for tiller motors |

### Code Change

**Lines 103-112** - Wrap the heading block in `{!isTiller && (...)}`:

```typescript
{!isTiller && (
  <>
    <h2 className="text-3xl font-light tracking-wide text-foreground mb-2">
      Configure Your Installation
    </h2>
    <p className="text-gray-600 font-light mb-8">
      Select your rigging options for the {selectedMotor?.model}
    </p>
  </>
)}
```

This removes both the h2 ("Configure Your Tiller Installation") and the subtitle paragraph for tiller motors, leaving only the clean "Choose Your Mounting Option" title from the OptionGallery component.

### Result

For tiller motors, the page will show:
- "Choose Your Mounting Option" (from OptionGallery)
- The two mounting option cards

For non-tiller motors, the multi-step headings remain unchanged.

