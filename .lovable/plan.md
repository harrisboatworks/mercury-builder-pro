

# Two Issues: Cinematic Reset on Saved Quotes + Agent Uses Custom Items Instead of Motor Options

## Issue 1: Cinematic Animation Still Resets on iPhone (Saved Quotes)

**Root Cause**: The main animation `useEffect` (line 205) has sound functions in its dependency array: `[isVisible, playReveal, playSwoosh, playComplete, playAmbientPad, playCelebration]`. While these are wrapped in `useCallback`, the `SoundProvider` value object is **not memoized** — it's recreated on every SoundProvider render. Any ancestor re-render can cause context consumers to receive new function references, restarting the animation.

Additionally, the cinematic trigger effect (line 100) has `showCinematic` in its dependency array, which is unnecessary and can cause edge-case re-triggers when state settles during saved quote restoration.

**Fix — `QuoteRevealCinematic.tsx`**:
- Remove ALL sound functions from the main animation `useEffect` dependency array (line 255)
- Store them in refs (same pattern already used for `onComplete`)
- The effect should only depend on `isVisible`

**Fix — `QuoteSummaryPage.tsx`**:
- Remove `showCinematic` from the cinematic trigger `useEffect` dependency array (line 115) — the `cinematicTriggeredRef` guard is sufficient

**Fix — `SoundContext.tsx`** (defensive):
- Memoize the Provider value object with `useMemo` to prevent unnecessary consumer re-renders

## Issue 2: Agent Adds SmartCraft Connect as Custom Item Instead of Motor Option

**Root Cause**: The agent API has no action to list or add motor options/accessories from the database. It only supports `custom_items` (free-text line items), so when asked to add SmartCraft Connect, the agent improvised — added it as a custom item with a guessed price of $399.

**Fix — Add `list_motor_options` action to `agent-quote-api/index.ts`**:
- New action that queries `motor_option_assignments` and `motor_option_rules` for a given motor ID (reusing the same logic as the frontend's `useMotorOptions` hook)
- Returns categorized options (required, recommended, available) with IDs, names, prices, and descriptions
- The agent can then reference these by ID

**Fix — Add `selected_options` field to `create_quote` and `update_quote`**:
- Accept an array of option IDs: `selected_options: ["option-uuid-1", "option-uuid-2"]`
- Look up each option from the database to get the correct price
- Store them in `quoteData.selectedOptions` using the same format the frontend expects: `{ optionId, name, price, category, assignmentType, isIncluded }`
- Include option prices in the total calculation

**Fix — Update `AGENT_API_INSTRUCTIONS.md`**:
- Document the new `list_motor_options` action
- Document the `selected_options` field in `create_quote`/`update_quote`
- Add guidance: "Use `list_motor_options` to find available accessories before adding them. Only use `custom_items` for items not in the options catalog."

### Changes Summary

| File | Change |
|------|--------|
| `src/components/quote-builder/QuoteRevealCinematic.tsx` | Store sound functions in refs, remove from useEffect deps |
| `src/pages/quote/QuoteSummaryPage.tsx` | Remove `showCinematic` from trigger effect deps |
| `src/contexts/SoundContext.tsx` | Memoize Provider value |
| `supabase/functions/agent-quote-api/index.ts` | Add `list_motor_options` action; add `selected_options` to create/update |
| `AGENT_API_INSTRUCTIONS.md` | Document new action and field |

