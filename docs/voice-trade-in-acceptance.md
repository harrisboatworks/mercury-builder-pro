# Voice trade-in release acceptance

This is an unreleased verification specification. It does not authorize changing the hosted agent, publishing, making calls, or sending customer messages.

## Read-only hosted findings, 2026-09-06 UTC

The ElevenLabs dashboard for Harris Boat Works Mercury Assistant, agent `agent_0501kdexvsfkfx8a240g7ts27dy1`, Main branch, was inspected through the in-app browser. No credentials or conversations were read. No fields were saved; Publish remained disabled at closeout.

- The trade-in tool is supplied by the attached **HBW Tools MCP server**, not an attached client tool. Do not add a duplicate client tool just because it is absent from the client list.
- The MCP parameter panel shows Brand, Year, Horsepower, Condition and optional Hours. Engine type and model are absent. The locally repaired MCP schema adds `engine_type` and `model`; its deployment and hosted schema refresh remain outstanding.
- The connection points to the existing `elevenlabs-mcp-server` Supabase function. Opening the server panel automatically showed a connection-test state; the controller did not invoke a business tool or initiate a voice session.
- The dashboard warns that the agent uses a deprecated LLM and has no attached tests. Exact replacement model selection and actual runtime behavior were not verified.
- HBW Tools is configured with No Approval. Side-effect tools are visible alongside valuation. A test session must isolate or mock those tools so a test cannot send SMS/email, schedule appointments, or create customer records.

## Intended configuration

Use the `estimate_trade_value` input schema in `ELEVENLABS_VOICE_TOOLS_SETUP.md` and the actual `inputSchema` in `supabase/functions/elevenlabs-mcp-server/index.ts`. Preserve numeric 9.9 horsepower and explicit 0 hours. Omit unknown hours. Ask for missing condition and architecture. Do not infer four-stroke from ELPT/EFI alone.

Preserve the existing MCP transport. After a separately authorized coordinated release, refresh/reinspect the hosted MCP schema and prove the two new fields are available before a voice canary. Do not assume a repository change updates the provider's cached tools.

## Isolated conversational canaries

Use a non-production test agent/session with all non-valuation business tools mocked. No real phone number, email address or customer information is needed. These are test utterances, not customer messages.

| Case | Utterance or injected tool result | Required outcome |
|---|---|---|
| Complete | My 2020 Mercury 90 FourStroke is in good condition with 100 hours. What is the trade-in estimate? | Pass all fields; speak the returned canonical estimate and inspection caveat. A fixed 2026 test clock yields wholesale 6525 and range 5545–7502 with the preserved engine. |
| Missing architecture | My 2020 Mercury 90 ELPT is in good condition. | Ask architecture; no guessed amount. |
| Missing condition | What is my 2020 Mercury 90 FourStroke worth? | Ask condition before estimating. |
| Decimal and zero | My 2020 Mercury 9.9 FourStroke is good and has zero hours. | Tool input contains horsepower 9.9 and hours 0, not 9 or omitted hours. |
| Unknown hours | I do not know the hours. | Omit hours; do not invent zero. |
| Explicit subtype | It is an OptiMax / E-TEC. | Preserve the supplied architecture; do not replace it with four-stroke. |
| Failure | Inject unavailable, rate-limited, and rejected-input results separately. | Explain the specific result and continue gathering details; no fallback number. |
| Motor correction | Change from 90 to 115 HP while an estimate is pending. | Do not speak/apply the superseded result as the current motor. |
| Apply | Ask to carry the completed estimate into the on-screen quote. | Browser bridge uses the validated current card; verify actual quote state and applied credit. MCP-only numeric output is not proof of this bridge. |
| No trade | Remove trade after an estimate exists. | Summary, PDF and financing contain no stale credit. |

Record tool input, response, spoken text, target app state, engine/reference versions and pass/fail for each case. Existing local handler/module receipts cover arithmetic and adapter contracts, not the speech model's field collection or hosted browser bridge. Require zero business-tool side effects throughout the canary.
