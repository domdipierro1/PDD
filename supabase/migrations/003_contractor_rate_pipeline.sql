-- PDD Operator Portal v4: contractor rate discovery and fulfilment pipeline
-- Run after 001_initial_schema.sql and 002_documents_photos_finance.sql.

alter table public.contractors add column if not exists rate_tier text default 'Unrated';
alter table public.contractors add column if not exists fulfilment_priority text default 'Reserve';
alter table public.contractors add column if not exists rate_discovery_status text default 'Ask Rates';
alter table public.contractors add column if not exists reliability_score integer default 0;
alter table public.contractors add column if not exists quality_score integer default 0;
alter table public.contractors add column if not exists rate_notes text;
alter table public.contractors add column if not exists last_contacted_at date;

create index if not exists contractors_rate_tier_idx on public.contractors(rate_tier);
create index if not exists contractors_fulfilment_priority_idx on public.contractors(fulfilment_priority);
create index if not exists contractor_rates_contractor_id_idx on public.contractor_rates(contractor_id);

-- Optional launch checklist item to keep rate discovery visible.
insert into public.launch_checklist (id, category, task, details, status, required_before_live, blocker, owner)
values
('LC-018','Contractors','Contractor rate discovery complete','Collect quoted rates from at least 10-15 cleaners/teams and tag Core / Premium Backup / Reserve before relying on live ads.','In Progress',true,false,'Dom')
on conflict (id) do update set
  category = excluded.category,
  task = excluded.task,
  details = excluded.details,
  status = excluded.status,
  required_before_live = excluded.required_before_live,
  blocker = excluded.blocker,
  owner = excluded.owner;
