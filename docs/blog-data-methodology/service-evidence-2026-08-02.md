# HBW service-evidence review — August 2, 2026

This note records how the service figures retained in the August 2026 blog-audit tranche should be interpreted. All checks used aggregate-only queries against the public Lightspeed-derived views. No customer rows, names, contact details, unit identifiers, or repair-order details were retrieved.

## Grain rules

- `public.service_history` has one row per service job. A repair order can have more than one job row.
- `public.service_parts` has one row per repair-order part line. A repair order can have more than one matching part line.
- A text match identifies a service record containing the search language. It is not automatically a confirmed diagnosis, failure, unique boat, or unique customer.
- Frozen publication snapshots remain fixed when they are part of an article's original analysis. A current recheck is reported separately instead of silently replacing the historical number.

## Spring commissioning

The dedicated methodology note is `spring-commissioning-2026-08-02.md`. The 9,540 figure is a frozen count of individual spring-labelled service-job rows. The August 2 recheck found 9,841 matching job rows across 5,195 distinct repair orders.

## Impeller and water-pump parts

The original article's 766-record snapshot is a count of impeller and water-pump part lines on completed repair orders from March 2014 through the first week of June 2026. It is not 766 unique boats or 766 confirmed failures.

The published frozen monthly counts are:

| Month | Part lines |
|---|---:|
| March | 1 |
| April | 84 |
| May | 123 |
| June | 144 |
| July | 143 |
| August | 117 |
| September | 73 |
| October | 36 |
| November | 45 |

The August 2 recheck used part-number and part-description matches for `impeller`, `pump kit-water`, `water pump`, and `repair kit w/p`. It found 817 matching part lines across 792 distinct repair orders from March 17, 2014 through July 28, 2026. The recheck corroborates the historical scale and seasonal shape. It does not convert scheduled replacements into failures.

## Gearcase work

The original article analysis reported frozen snapshots of 7,417 gearcase-related service records and 364 pressure-test records from 2013 through publication. The historical extraction did not retain enough metadata to safely relabel either number as unique boats or unique repair orders, so the copy now calls them service records.

The August 2 recheck matched `gearcase`, `gear case`, `gear-case`, `lower unit`, and equivalent hyphenation across service-job text. It found 8,130 job rows across 7,474 distinct repair orders from December 4, 2013 through July 29, 2026. Of those, 497 rows across 447 repair orders also contained pressure or vacuum language. This broad check corroborates scale; it is not a count of water-intrusion diagnoses.

## Dedicated water-pump jobs

The article retains a frozen review of 112 dedicated water-pump jobs completed from 2023 through July 2026. The historical medians were about $210 in labour and $76 in pump parts, before HST.

These are historical medians, not a package price or a quote. The exact classifier used in the original analysis was not retained in the article source, so the figures must not be silently recalculated from a broader job-name search. Any future update should rebuild and document the dedicated-job classifier before changing the 112-job snapshot.

## No-start and rough-running work

The original article analysis counted 537 Lightspeed job rows labelled for no-start or rough-running work from 2013 through publication. The figure is retained as a frozen job-row snapshot, not as unique boats or unique repair orders.

The old cause buckets overlapped and were not a mutually exclusive diagnostic classification. The August audit therefore removed the fuel-versus-electrical percentages and the cause chart while preserving the correctly labelled 537-job scale.

## Claims intentionally removed

- 507 customer-paid jobs in 2025: the original business filter was not recoverable and the claim added little customer value.
- 526 winterize-and-service jobs in the 75–115 HP band: the original horsepower classifier was not recoverable during this tranche.
- 232 spring-startup jobs averaging about $511: the number could confuse full repair-order spend with HBW's confirmed spring-commissioning policy of free labour for winter-storage customers or $99 labour for others.

These removals do not imply the original numbers were fabricated. They mean the article could not communicate the grain clearly enough to earn the claim.
