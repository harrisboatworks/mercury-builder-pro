# Year Field Tooltip — Explain HP/Stroke Confidence Boost

## Goal

Add a small help tooltip next to the "Year *" label in the trade-in form that explains how the year improves stroke detection and updates the "Based on" reasons live.

## Change

Single file: `src/components/quote-builder/TradeInValuation.tsx`.

### 1. Imports

- Add `HelpCircle` to the existing `lucide-react` import line.
- Add `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';`.

### 2. Label JSX (around line 445)

Replace the plain `Year *` label with a flex label that includes a `HelpCircle` button wrapped in a Radix Tooltip:

```tsx
<Label htmlFor="trade-year" className="... inline-flex items-center gap-1.5">
  Year *
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="Why year matters"
          className="text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-xs text-xs leading-relaxed">
        ...content...
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</Label>
```

### 3. Tooltip content

Mirrors the actual decoder rules so it stays accurate:

> **Why the year matters**
>
> When the model text is just an HP number (like "90"), the year decides whether it's likely a 2-Stroke or 4-Stroke:
> - **2007 or newer** → 4-Stroke (medium confidence)
> - **Before 2000** → 2-Stroke (medium confidence)
> - **2000–2006** → ambiguous, please add "4S" or "2S"
>
> Picking a year updates the "Based on" reasons under the model field automatically.

## No behavior changes

The decoder already reads `tradeInInfo.year` and re-runs on every render of the preview block, so no logic changes are needed — the tooltip is purely educational. The "Based on" reasons already update live when the user picks a year.

## Out of scope

- Inline (non-tooltip) help text below the year — kept as a hover-only tooltip to keep the form compact.
- Tooltip on the model field (covered by the existing reasons block + warnings).
