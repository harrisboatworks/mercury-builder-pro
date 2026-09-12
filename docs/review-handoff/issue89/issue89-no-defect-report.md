# Issue #89 — no demonstrated CTA defect

Source SHA: `397654fe566cb207d75be5b619371bc0c8e9531e` (`origin/main`)
Isolated worktree: `/tmp/hbw-worktrees/89`
Branch `cursor/115-pro-xs-cta-3e2c` exists locally only. No draft PR.

## Verdict

No demonstrated broken behavior on the 115 Pro XS money-page CTA. No patch. No PR.

Issue #89 is 3 dead clicks / 2 sessions on `/mercury/115-pro-xs` with no recordings and no click target. The landing CTA is a real `<a href="/quote?model=115-pro-xs">` (hero + footer, `Button asChild` + `Link`). It is keyboard-focusable and Enter activates it.

## Keyboard

- Hero and footer CTAs are `<a>`, `tabindex` is not `-1`, and they include `focus-visible:ring-2`.
- Vitest (jsdom, local only): 2/2 passed. jsdom does not synthesize click from Enter on `<a>`; click on the focused link navigates to `/quote?model=115-pro-xs`.
- Playwright against local Vite `http://127.0.0.1:8089` on `397654fe5`:
  - Tab lands on `Build My 115 Pro XS Quote`.
  - Enter navigates to `http://127.0.0.1:8089/quote?model=115-pro-xs` at 1280×800 and 390×844.
- Quote deep-link `115-pro-xs` → `{ hp: 115, family: 'pro xs' }`. Synthetic catalog highlight hits only Pro XS cards, not 115 FourStroke.

## Errors

No site-origin page errors. Console 404s are only local-dev ` /version.json` (Vite does not emit that file). Ignored jsdom `Not implemented: navigation`. No credentials, analytics grant, or production writes. Cookie banner was dismissed with Decline only.

## Observed, not patched

First-visit cookie banner (`ConsentBanner`, `z-[80]`) can cover the hero CTA after the hero image loads:

- Desktop 1280×800: ~98.8% of the CTA box overlaps the banner.
- Mobile 390×844: ~96% overlap; the CTA is not visible until the banner is dismissed.

That is site-wide first-visit chrome, not a broken 115 Pro XS control. The CTA still activates with Tab+Enter while covered. No Clarity recording identifies the banner (or the hover-only pricing table) as the #89 target. Same class as other evidence-blocked dead-click issues: do not invent a page-local patch.

Pricing table rows use `hover:bg-muted/30` and are not links. Deep-link highlight/scroll does not preselect a SKU. Not patched.

## Holds

No production submissions, analytics, credentials, customer data, merge, deploy, or spending. #528 / #371 / #332 / #542 were not modified for this check.
