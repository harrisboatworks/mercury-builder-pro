# Mercury Platinum Quote Option — Rollback Note

Date: 2026-07-18

Scope: the optional Mercury Platinum Product Protection selector on the quote summary, its promotion-aware pricing reconciliation, and quote-state propagation.

## Release boundary

This is one isolated commit/PR. It does not change the canonical Product Protection rate card, the public Product Protection page, motor pricing, promotion records, or the number of quote steps.

Customer default remains **No additional plan**.

## Rollback

Revert the release commit from the merged PR. The revert removes:

- the summary-page Platinum selector;
- promotion-aware paid-term reconciliation;
- the new Product Protection quote helpers and tests;
- warranty propagation added to the deposit snapshot;
- the dedicated selection analytics event.

Existing quote warranty fields and existing PDF/admin/financing support remain in the underlying application as they did before this change.

## Verification after rollback

1. Open a fresh 60 HP installed quote.
2. Confirm the summary no longer shows the Platinum selector.
3. Confirm the existing motor, installation, propeller, rebate, HST, total, and financing calculations are unchanged.
4. Do not submit a production PDF during verification because that creates a lead and administrator notification.
