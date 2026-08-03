# Spring commissioning article data check — 2026-08-02

This note preserves the aggregate evidence behind the article
`spring-commissioning-cost-ontario`. It contains no customer rows or customer
identifiers.

## Source and grain

- Canonical source: `public.service_history` in HBW's Lightspeed Supabase mirror.
- View grain: one row per service job, not one row per repair order.
- Article snapshot: 9,540 spring-labelled job records at publication time.
- Interpretation: call these jobs or job records. Do not call them 9,540 unique
  work orders, boats, or customers.

The exact historical query text used for the original 9,540 snapshot was not
saved in the repository. The August 2 recheck below establishes that the figure
is consistent with the real Lightspeed job-row count and documents a repeatable
query for future audits.

## Aggregate recheck

```sql
select
  count(*) as spring_job_rows,
  count(distinct coalesce(ro_header_id::text, ro_number)) as distinct_ros,
  min((coalesce(date_completed, close_date, date_sent, date_in)
    at time zone 'America/Toronto')::date) as first_matching_date,
  max((coalesce(date_completed, close_date, date_sent, date_in)
    at time zone 'America/Toronto')::date) as latest_matching_date
from public.service_history
where job_name ilike '%spring%';
```

Result on 2026-08-02:

| spring job rows | distinct repair orders | first match | latest match |
|---:|---:|---|---|
| 9,841 | 5,195 | 2014-03-26 | 2026-07-31 |

The live total is higher than the article's frozen 9,540 snapshot because new
spring jobs continued to close after the original data pull.

## Why jobs are not repair orders

```sql
with per_ro as (
  select
    coalesce(ro_header_id::text, ro_number) as ro_key,
    count(*) as spring_job_rows
  from public.service_history
  where job_name ilike '%spring%'
  group by 1
)
select spring_job_rows, count(*) as repair_orders
from per_ro
group by spring_job_rows
order by spring_job_rows;
```

The largest bucket was 3,607 repair orders with exactly two matching spring job
rows. Common job names include `Spring Check Boat` and `Spring Check Motor`.
That is why the public copy must preserve the job-row grain.

## Seasonal workload check

Across the full public service-history view, May had 3,712 distinct completed
repair orders and October had 3,773. Those are the two highest months in the
aggregate history and support describing May as one of HBW's two heaviest
service months.

## Publishing rules

1. Preserve 9,540 as the article's publication snapshot unless the title is
   intentionally re-baselined.
2. Describe the count as individual spring-labelled service jobs.
3. Never imply the count represents unique boats, customers, or repair orders.
4. Do not infer that fall service caused a cheaper spring invoice from this
   count alone; that claim needs a separate linked-cohort analysis.
5. Use aggregate queries only. Do not publish customer-level evidence.
