

## Plan: Quote Activity Card Styling + Error Handling

### 1. Branded `quote_created` card style in VoiceActivityCard

Add `quote_created` entries to the three style maps and the icon map in `VoiceActivityCard.tsx`:

- **typeBgMap**: Mercury blue gradient — `bg-[#007DC5]/10 border-[#007DC5]/30`
- **typeIconBgMap**: `bg-[#007DC5]/20 text-[#007DC5]`
- **typeIconMap**: `FileText` icon from lucide
- **iconMap**: Add `📋` mapped to `FileText`

Override the CTA button for `quote_created` type to render as `luxuryModern` variant (full-width, larger) instead of the default small button. Add a price line below the description showing `$XX,XXX.XX` in bold Mercury blue when `activity.data?.final_price` exists.

### 2. Error handling in `deliver_quote_link`

Wrap the tool handler in `useElevenLabsVoice.ts` (lines 2232-2268) with validation:

- Check `params.share_url` is present and non-empty; if missing, return `{ success: false, error: "Quote creation failed — no share link was returned. Please try again." }` and show an error toast
- Check `params.final_price` is a valid number; default to `0` if missing to avoid `toLocaleString` crash
- Wrap the entire body in try/catch; on error, return failure JSON and show error toast
- Log errors with `[ClientTool] deliver_quote_link error:`

### Files changed
- `src/components/chat/VoiceActivityCard.tsx` — branded quote_created style + prominent CTA
- `src/hooks/useElevenLabsVoice.ts` — error handling in deliver_quote_link

