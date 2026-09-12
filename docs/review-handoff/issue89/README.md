# Preserved #89 reproduction (not part of the four-PR combo)

Source SHA when reproduced: `397654fe566cb207d75be5b619371bc0c8e9531e`  
Local-only branch at the time: `cursor/115-pro-xs-cta-3e2c` (unpushed). No #89 PR.

These files are **copies** of uncommitted local tests plus the layout-limit report. They are not installed as live `src/` tests on this diagnostic branch.

## Explicit mocked-layout limitation

**Viewport geometry was mocked.** Destination tests set `window.innerWidth` / `window.innerHeight` and replaced `HTMLElement.prototype.getBoundingClientRect`.

**`scrollIntoView` was mocked.** The mock only set `data-scrolled-into-view="1"` (or recorded a dataset id); jsdom did not scroll the document.

A jsdom test or a generated HTML screenshot cannot establish real browser layout, paint, overflow, cookie-banner occlusion, or whether a highlighted card is actually visible. Playwright against local Vite showed CTA Enter → `/quote?model=115-pro-xs`. That is navigation proof, not destination-card layout proof.

See `LAYOUT-LIMITS.md` and `issue89-no-defect-report.md`.

## Verdict (do not reopen here)

No demonstrated CTA/destination defect. No patch. First-visit cookie banner can cover the hero CTA after the image loads; that is site-wide chrome, not patched. Do not repeat #89 work during integration review.

Screenshots from the original session remain only under `/opt/cursor/artifacts/issue89-preserved-2026-09-12/` on the review VM. They are not copied onto this branch.
