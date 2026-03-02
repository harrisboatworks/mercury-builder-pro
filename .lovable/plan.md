

## Plan: Add AI-Generated Plain-English Summary to Weekly Report

The weekly report currently delivers raw data — tables, funnels, percentages — but no interpretation. We'll add an AI summary section at the top of both the email and SMS that reads like a blunt employee briefing.

### How it works

After all the data is computed (quotes, funnel, drop-offs, traffic, etc.), we'll call the **Lovable AI Gateway** with a structured prompt that feeds it the key metrics and asks it to respond as a straight-talking employee giving a weekly debrief. The AI will return:

1. **A 3-4 sentence plain-English summary** of what happened this week ("We had 12 visitors but only 2 saved quotes — that's rough.")
2. **2-3 blunt observations** about what's working and what isn't ("People are bailing at the Promo Selection step. 68% gone. That page is killing us.")
3. **2-3 specific improvement suggestions** ("Simplify the promo page — too many choices. Consider auto-selecting the most popular option.")

### Implementation

**Single file**: `supabase/functions/weekly-quote-report/index.ts`

1. After all metrics are computed (~line 210), build a concise data summary object with the key numbers: visitors, quotes, conversion rate, biggest drop-off, top viewed vs abandoned motors, week-over-week trends, device split, avg quote value
2. Call `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`, passing a system prompt that says: *"You're a blunt, experienced marine dealership employee giving your boss the weekly website report. Be direct, conversational, no corporate speak. Point out problems honestly. Give actionable suggestions."*
3. Parse the response and inject it as:
   - **Email**: A styled "🧠 AI Summary" section at the very top of the report body (before the summary cards)
   - **SMS**: A condensed 2-3 line version prepended to the SMS
4. If the AI call fails, skip the summary gracefully — the rest of the report sends as normal

### Prompt data fed to the AI
- Total visitors, quotes saved, conversion rate, week-over-week change
- Biggest funnel drop-off point and percentage
- Top 3 viewed motors vs top 3 abandoned motors  
- Device breakdown (mobile vs desktop)
- Average quote value, hot leads count
- Top exit pages

The AI doesn't need the raw events — just the computed metrics, kept under ~500 tokens of input.

