# 150 HP review interaction evidence (#559)

Scope: the September 15 aggregate (10 dead clicks / 1 session) did not identify a
broken control. This instrumentation gathers targets on exactly
`/blog/mercury-150-hp-fourstroke-pro-xs-review-ontario`; it does not resolve or
close #559.

## Mobile and source audit (September 16, 2026)

Local Vite `http://localhost:8080` and production were measured at 390x844.

- One H1. Document width equals the 390px viewport (no page overflow).
- Two labelled, keyboard-focusable `.blog-table-scroll` regions: each table is
  640px inside a 332px overflow region. Comparison table cells are static
  (`cursor: auto`, no interactive descendants). The freshwater-results table
  keeps its three published-test links. Horizontal scroll moved 120px without
  widening the document.
- Table of contents is collapsed on a phone. Opening it exposes heading links
  whose fragment IDs all exist. Clicking the comparison heading set the hash,
  collapsed the panel, and left the heading below the sticky header. Several
  nested H3 links render at 28px tall; that is below a 44px target, but the
  links navigate. It is not treated as the cluster cause.
- The comparison image is a named `Expand image` button. The hero is a static
  `<picture>`. FAQ cards are static (no accordion controls). No
  `cursor-pointer` / `cursor-zoom` class sits outside a semantic control. No
  nested interactive elements.
- Local development still emits the existing hero `fetchPriority` warning and
  two unrelated 404s. Production console had no captured page error.

No deterministic broken affordance was reproduced. Empty Clarity recordings
still do not identify the repeated target, so this observer distinguishes the
issue's four categories: static table clicks, horizontal pan, image expansion,
and contents navigation.

## Event contract

Uses the existing Clarity function only when `getStoredConsent()` is `granted`.
The banner, consent stores, Clarity loader and other analytics behavior are
unchanged. Missing, denied or malformed consent drops interactions. An absent
Clarity function also drops them; this observer neither loads it nor replays
pre-consent activity.

Each call is `clarity('event', 'review150_<target>_<action>_<occurrence>')`
with no additional payload. Filter Clarity custom events by the exact names
below and use its existing consented session/device context to examine
repeated targets.

| Target | Meaning |
| --- | --- |
| `table_1_r<R>_c<C>` | Comparison-table cell, one-based, including header row; capped at 8 rows / 4 columns |
| `table_2_r<R>_c<C>` | Freshwater-results table cell, same cap |
| `table_1` / `table_2` | Scroll-region background click or horizontal pan attempt on that table |
| `quick_answer_1` | Opening Quick Answer blockquote |
| `toc_toggle` | Mobile table-of-contents disclosure button |
| `toc_<N>` | Contents heading link in DOM order (max 32) |
| `image_<N>` | Article image in DOM order (max 8); currently the hero is `image_1` and the expandable comparison image is `image_2` |
| `share_<inline\|full>_<control>` | `native`, `facebook`, `twitter`, `whatsapp`, `reddit`, `copy`, `email`, or `print` |

Actions are `click` or `pan` (tables only). Occurrences are `first`, `repeat`,
`repeat_3plus`; later observations of that target/action are suppressed. Counts
are local to a page mount, reset when denial is observed and on cleanup, and
never persisted. They identify repeated interaction, not a rage/dead-click
classification, successful share, completed navigation, or image-dialog state.

Pan is a heuristic: a primary pointer moves at least 12 CSS pixels predominantly
horizontally, or a horizontal/shift-wheel burst occurs over that table. Wheel
bursts use a 500ms idle gap. Pointer pan suppresses its following compatibility
click for 500ms. Keyboard scroll remains functional but is not instrumented.
Some native touch pans may be missed if the browser cancels the pointer stream
before enough movement is available. No pointer capture or default prevention.

Published-test links inside the results table, other unrecognised controls,
noncollapsed selections, form controls/forms and editable descendants are
excluded so a real navigation is not labelled as a static cell click.

No text, selected text, form values, DOM IDs, URLs, query/hash, coordinates,
customer identifiers, or user-agent strings are sent. Pointer positions exist
only transiently for gesture detection. Static target labels come from a
bounded map, never from arbitrary DOM attribute values.

## Verification (September 16, 2026)

Started from current main `8399db04c`. Local Vite on `:8080` with a temporary
Clarity stub; the real `clarity.ms` host was blocked so no test events left
this machine.

- Focused tests cover consent states and revocation, malformed cookies, absent
  provider, allowlisted payloads, repeat limits, selection/form exclusions,
  current-DOM share controls, route isolation, cleanup, per-table pan/click
  separation, pointer cancellation, wheel bursts and unchanged default
  behavior.
- `npm run typecheck` passed. `npm run test:unit` ran 1,822 tests: 1,821
  passed. The only failure is the pre-existing Dropbox OAuth state check in
  `src/lib/__tests__/edge-hardening-packet-a.test.ts`; it is outside this
  change.
- Playwright at 1280x720 and 390x844: one H1, document width exactly the
  viewport. Desktop tables 846px; mobile tables 640px inside a 332px
  labelled/focusable region. Comparison image opened a named dialog and
  Escape closed it. Contents comparison link set the heading hash at both
  sizes; the mobile panel collapsed afterward.
- Stub events on the real article: mobile emitted `review150_table_1_r2_c1_click_first`,
  `review150_table_1_pan_first`, `review150_image_2_click_first`,
  `review150_toc_toggle_click_first`, and `review150_toc_2_click_first`.
  Desktop emitted the table, pan, image and `toc_2` events (no mobile
  toggle). The stub/config is not part of this PR.

Article/pricing source and consent implementation are unchanged. This is local
validation, not deployment or evidence of reduced production dead clicks. After
an authorized release, collect a comparable consented Clarity window and relate
repeated target names to recordings before proposing an affordance change.

## Reconciliation with #577 (September 21, 2026)

`#577` merged to `main` (`9512d69aa`). It changed rendered affordances on this
same route: overflow-only table hints, a visible mobile “Expand image” label,
explicit Show/Hide contents labels, and contents links at least 44px on mobile.
Those UI changes do **not** supersede this draft.

- The September 16 28px nested-contents measurement is historical. It is not
  current `main` after `#577`.
- `#577` did not add analytics, did not close #559, and did not claim fewer
  production dead clicks.
- This observer is still the collection path for the four categories (static
  table click, horizontal pan, image expansion, contents navigation).
- Labels stay positional (`toc_<N>`, `image_<N>`, `table_<N>_r<R>_c<C>`). The
  `#577` visible labels do not become event names.
- GitHub still reports this branch MERGEABLE / CLEAN against current `main`.
  `BlogArticle.tsx` still only wires `useOverheatInteractions` on `main`; this
  PR still swaps in `useReview150Interactions` for the 150 slug only.

Keep this PR draft. Keep #559 open. Retain the telemetry. Do not treat `#577`
as proof the cluster is gone.
