-- 1) brochure/in-stock flags + pricing/source fields
alter table motor_models
  add column if not exists is_brochure boolean default false,
  add column if not exists in_stock boolean default false,
  add column if not exists price_source text,                    -- 'xml','pricelist','manual'
  add column if not exists dealer_price numeric,                 -- our price
  add column if not exists msrp numeric,                         -- computed (e.g., +10%)
  add column if not exists model_key text,                       -- normalized family key (no year)
  add column if not exists hero_image_url text,                  -- stable hero (brochure)
  add column if not exists source_doc_urls text[] default '{}';  -- brochure PDF, spec links, etc.

-- index for dedupe/lookup
create index if not exists idx_motor_models_model_key on motor_models (model_key);