alter table public.site_documents
  add column if not exists reviewed_on date,
  add column if not exists related_url text,
  add column if not exists related_label text;

comment on column public.site_documents.reviewed_on is
  'Date the resource content or official destination was last reviewed by HBW.';
comment on column public.site_documents.related_url is
  'Optional first-party companion page for this resource card.';
comment on column public.site_documents.related_label is
  'Optional concise label for the companion page link.';

update public.site_documents
set reviewed_on = date '2026-07-31',
    related_url = case title
      when 'Mercury Outboard Maintenance Planner' then '/blog/mercury-maintenance-intervals-20-100-300-rule'
      when 'Marine Fuel & Storage Quick Guide' then '/blog/ethanol-octane-mercury-outboard-fuel-guide-ontario'
      when 'Five-Minute Boat Trailer Check' then '/blog/boat-trailer-maintenance-guide-ontario'
      when 'Mercury Repower Planning Worksheet' then '/blog/winter-repower-planning-guide'
      when 'Fall Storage & Winterization Checklist' then '/blog/diy-mercury-outboard-winterization-guide'
      when 'Your New Mercury Owner Guide' then '/blog/breaking-in-new-mercury-motor-guide'
      when 'Mercury Serial Number & Service Request Prep Sheet' then '/blog/how-to-read-mercury-outboard-serial-number'
      when 'Spring Launch & First-Run Checklist' then '/blog/spring-outboard-commissioning-checklist'
      when 'Mercury Alarm & No-Start Action Card' then '/blog/mercury-outboard-wont-start-troubleshooting'
      else null
    end,
    related_label = case title
      when 'Mercury Outboard Maintenance Planner' then 'Read the maintenance intervals guide'
      when 'Marine Fuel & Storage Quick Guide' then 'Read the fuel guide'
      when 'Five-Minute Boat Trailer Check' then 'Read the trailer guide'
      when 'Mercury Repower Planning Worksheet' then 'Read the winter repower guide'
      when 'Fall Storage & Winterization Checklist' then 'Read the winterization guide'
      when 'Your New Mercury Owner Guide' then 'Read the new Mercury break-in guide'
      when 'Mercury Serial Number & Service Request Prep Sheet' then 'Read the serial number guide'
      when 'Spring Launch & First-Run Checklist' then 'Read the spring commissioning guide'
      when 'Mercury Alarm & No-Start Action Card' then 'Read the no-start troubleshooting guide'
      else null
    end
where is_published = true;

update public.site_documents
set file_url = 'https://www.mercuryrepower.ca/downloads/hbw-your-new-mercury-owner-guide.pdf'
where title = 'Your New Mercury Owner Guide';
