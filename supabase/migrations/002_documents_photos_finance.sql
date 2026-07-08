-- PDD Operator Portal v2: job records, photos, finance and audit log.
-- Run this in Supabase SQL Editor after 001_initial_schema.sql.

create extension if not exists pgcrypto;

create table if not exists public.job_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  job_id uuid references public.jobs(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  document_type text not null default 'Other',
  title text not null,
  file_link text,
  signed boolean default false,
  signed_by text,
  signed_at date,
  start_work_consent boolean default false,
  expiry_date date,
  notes text
);

create table if not exists public.job_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  job_id uuid references public.jobs(id) on delete cascade,
  contractor_id uuid references public.contractors(id) on delete set null,
  photo_stage text not null default 'After',
  title text,
  file_link text not null,
  submitted_by text,
  marketing_permission boolean default false,
  notes text
);

create table if not exists public.finance_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  job_id uuid references public.jobs(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  item_type text not null check (item_type in ('Revenue','Cost')),
  category text not null default 'Other',
  description text,
  amount numeric(12,2) not null default 0,
  due_date date,
  paid_date date,
  payment_status text default 'Pending',
  payment_method text,
  reference text,
  evidence_link text,
  notes text
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary text,
  metadata jsonb default '{}'::jsonb,
  actor text default 'system'
);

create index if not exists job_documents_job_id_idx on public.job_documents(job_id);
create index if not exists job_photos_job_id_idx on public.job_photos(job_id);
create index if not exists finance_items_job_id_idx on public.finance_items(job_id);
create index if not exists finance_items_status_idx on public.finance_items(item_type, payment_status);
create index if not exists audit_log_entity_idx on public.audit_log(entity_type, entity_id);

alter table public.job_documents enable row level security;
alter table public.job_photos enable row level security;
alter table public.finance_items enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists "operators manage job documents" on public.job_documents;
drop policy if exists "operators manage job photos" on public.job_photos;
drop policy if exists "operators manage finance items" on public.finance_items;
drop policy if exists "operators read audit log" on public.audit_log;
drop policy if exists "operators insert audit log" on public.audit_log;

create policy "operators manage job documents" on public.job_documents for all using (public.is_operator()) with check (public.is_operator());
create policy "operators manage job photos" on public.job_photos for all using (public.is_operator()) with check (public.is_operator());
create policy "operators manage finance items" on public.finance_items for all using (public.is_operator()) with check (public.is_operator());
create policy "operators read audit log" on public.audit_log for select using (public.is_operator());
create policy "operators insert audit log" on public.audit_log for insert with check (public.is_operator());

alter table public.jobs add column if not exists invoice_link text;
alter table public.jobs add column if not exists customer_agreement_link text;
alter table public.jobs add column if not exists contractor_job_sheet_link text;
alter table public.jobs add column if not exists job_folder_link text;
