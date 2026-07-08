-- PDD Operator Portal v5.1: core table Row Level Security
-- Run after 001_initial_schema.sql, 002_documents_photos_finance.sql and 003_contractor_rate_pipeline.sql.
-- Public website/Tally/Google Form submissions use the server-side service role key, so these RLS policies do not block public form ingestion.

alter table public.operator_profiles enable row level security;
alter table public.contractors enable row level security;
alter table public.leads enable row level security;
alter table public.jobs enable row level security;
alter table public.contractor_rates enable row level security;
alter table public.job_completion_submissions enable row level security;
alter table public.complaints enable row level security;
alter table public.agent_outreach enable row level security;
alter table public.pricing_reference enable row level security;
alter table public.launch_checklist enable row level security;

drop policy if exists "operators read own profile" on public.operator_profiles;
drop policy if exists "operators manage contractors" on public.contractors;
drop policy if exists "operators manage leads" on public.leads;
drop policy if exists "operators manage jobs" on public.jobs;
drop policy if exists "operators manage contractor rates" on public.contractor_rates;
drop policy if exists "operators manage job completion submissions" on public.job_completion_submissions;
drop policy if exists "operators manage complaints" on public.complaints;
drop policy if exists "operators manage agent outreach" on public.agent_outreach;
drop policy if exists "operators read pricing reference" on public.pricing_reference;
drop policy if exists "operators manage pricing reference" on public.pricing_reference;
drop policy if exists "operators manage launch checklist" on public.launch_checklist;

create policy "operators read own profile" on public.operator_profiles
for select using (auth.uid() = user_id);

create policy "operators manage contractors" on public.contractors
for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage leads" on public.leads
for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage jobs" on public.jobs
for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage contractor rates" on public.contractor_rates
for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage job completion submissions" on public.job_completion_submissions
for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage complaints" on public.complaints
for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage agent outreach" on public.agent_outreach
for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage pricing reference" on public.pricing_reference
for all using (public.is_operator()) with check (public.is_operator());

create policy "operators manage launch checklist" on public.launch_checklist
for all using (public.is_operator()) with check (public.is_operator());
