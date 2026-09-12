# #89 artifact limits (do not treat as browser layout proof)

Preserved for independent review under `/opt/cursor/artifacts/issue89-preserved-2026-09-12/`.

## What was mocked

- **Viewport geometry was mocked.** Destination tests set `window.innerWidth` / `window.innerHeight` and replaced `HTMLElement.prototype.getBoundingClientRect` so Pro XS cards started below the fold and moved into a fake viewport after scroll.
- **`scrollIntoView` was mocked.** The mock only set `data-scrolled-into-view="1"`; jsdom did not scroll the document.
- **Catalog and network were mocked.** Supabase `motor_models` returned five synthetic rows after 80ms. No production catalog call.
- **Heavy quote chrome was stubbed** (header, search, card preview internals, banners, modals) so the real `MotorSelectionPage` wrappers and deep-link effect could run.

## What that cannot prove

A jsdom test or a generated HTML screenshot cannot establish real browser layout, paint, overflow, cookie-banner occlusion, or whether a highlighted card is actually visible to a user. Playwright screenshots of the local Vite app showed CTA navigation; they did not measure destination-card layout after a delayed catalog in a real viewport.

Do not repeat #89 work in this integration review.
