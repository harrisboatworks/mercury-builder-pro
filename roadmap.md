# Consent and promotion safeguards
- [x] Gate GA4 loading and events on accepted consent.
- [x] Disable expired GET7 campaign sends.
- [x] Date-check agent special financing and use standard-tier fallback.
- [x] Run regression tests, scoped checks and browser verification. No deployment.

Focused tests: 39 passed. Full suite: 1,980 passed; one pre-existing optional-phone accessibility contract failure, outside this task. Automatic frontend validation and all three scoped Edge checks passed. Browser confirms no Google requests before choice/after Decline, one GA4 loader after Accept, and stored choices on reload. Production checks deferred because no deployment is authorized.