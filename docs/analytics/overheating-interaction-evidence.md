# Overheating article interaction evidence (#489)

Scope: the September 9 aggregate (13 dead clicks / 2 sessions) did not identify a
broken control. This instrumentation gathers targets on exactly
`/blog/outboard-overheating-emergency-guide`; it does not resolve or close #489.

## Event contract

Uses the existing Clarity function only when `getStoredConsent()` is `granted`.
The banner, consent stores, Clarity loader and other analytics behavior are
unchanged. Missing, denied or malformed consent drops interactions. An absent
Clarity function also drops them; this observer neither loads it nor replays
pre-consent activity.

Each call is `clarity('event', 'overheat_<target>_<action>_<occurrence>')` with no
additional payload. Filter Clarity custom events by the exact names below and
use its existing consented session/device context to examine repeated targets.

| Target | Meaning |
| --- | --- |
| `table_r<R>_c<C>` | One-based rendered cell position, including header row; capped at 8 rows / 4 columns |
| `table` | Scroll-region background click or horizontal pan attempt |
| `quick_answer_1` | Quick Answer callout outside more-specific diagnostic targets |
| `diagnostic_flow_1` | Diagnostic callout container |
| `diagnostic_escalation_1` | Dark escalation callout within it |
| `image_<N>` | Article image in DOM order (max 8); currently the hero is `image_1` |
| `share_<inline\|full>_<control>` | `native`, `facebook`, `twitter`, `whatsapp`, `reddit`, `copy`, `email`, or `print` |
| `service_<N>` | Exact service-intake anchors in article DOM order (max 8); currently inline CTA, body link, closing body link, banner CTA |

Actions are `click` or `pan` (table only). Occurrences are `first`, `repeat`,
`repeat_3plus`; later observations of that target/action are suppressed. Counts
are local to a page mount, reset when denial is observed and on cleanup, and
never persisted. They identify repeated interaction, not a rage/dead-click
classification, successful share, service submission, or completed navigation.

Pan is a heuristic: a primary pointer moves at least 12 CSS pixels predominantly
horizontally, or a horizontal/shift-wheel burst occurs over the table. Wheel
bursts use a 500ms idle gap. Pointer pan suppresses its following compatibility
click for 500ms. Keyboard scroll remains functional but is not instrumented.
Some native touch pans may be missed if the browser cancels the pointer stream
before enough movement is available. No pointer capture or default prevention.

No text, selected text, form values, DOM IDs, URLs, query/hash, coordinates,
customer identifiers, or user-agent strings are sent. Noncollapsed selections,
form controls/forms, editable descendants and unknown controls are excluded.
Pointer positions exist only transiently for gesture detection. Static target
labels come from a bounded map, never from arbitrary DOM attribute values.

## Verification (September 10, 2026)

Started from current main `bc79d6dc9323df8cd97fc73340d75ba9329a1275`.
The initial Documents worktree was offloaded by iCloud during a later test run.
Only the six reviewed files were copied and byte-verified into a fresh worktree
outside iCloud at the same main commit; final checks ran there.

- `npm run verify:small`: frontend/config typechecks and full unit suite.
- Focused tests cover consent states and revocation, malformed cookies, absent
  provider, allowlisted payloads, repeat limits, selection/form exclusions,
  current-DOM share controls, route isolation, cleanup, pan/click separation,
  pointer cancellation, wheel bursts and unchanged default behavior.
- Codex in-app Browser at 1280x720 and 390x844: one H1, document width exactly
  viewport width. Desktop table region 846px; mobile table 640px inside a 332px
  labelled/focusable region. Mobile ArrowRight scrolled 40px; native horizontal
  scrolling reached 308px without widening the document.
- Local-only Clarity stub, with the real article and consent code: no event
  before consent; table `first`/`repeat` at both sizes; desktop diagnostic flow,
  escalation, hero, copy-share and service-link labels matched the contract.
  Mobile horizontal scrolling emitted `overheat_table_pan_first`. Revocation
  stopped subsequent tracked clicks at both sizes. The stub/config is not part
  of this PR and test events were not sent to Clarity.
- The unmodified hero component emits a development React `fetchPriority`
  warning. No new instrumentation exception was observed.

Article/pricing source and consent implementation are unchanged. This is local
validation, not deployment or evidence of reduced production dead clicks. After
an authorized release, collect a comparable consented Clarity window and relate
repeated target names to recordings before proposing an affordance change.
