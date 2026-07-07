-- PDD Operator Portal initial Supabase schema
-- Paste this into Supabase SQL Editor, run it, then create your auth user and add it to operator_profiles.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.operator_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.operator_profiles
    where user_id = auth.uid()
      and active = true
  );
$$;

create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  name text not null,
  phone text,
  email text,
  areas_covered text,
  own_transport boolean default false,
  years_experience integer,
  eot_deep_clean_experience boolean default false,
  hmrc_status text default 'Not Sure',
  insurance_certificate_uploaded boolean default false,
  insurance_file_link text,
  insurance_expiry_date date,
  insurance_cover_amount numeric(12,2),
  id_right_to_work_uploaded boolean default false,
  id_file_link text,
  contractor_agreement_signed boolean default false,
  agreement_file_link text,
  rate_card_signed boolean default false,
  rate_card_file_link text,
  test_job_status text default 'Needed',
  test_job_date date,
  test_job_result text default 'Pending',
  active_rota_approved boolean default false,
  contractor_status text default 'Interested',
  pause_reason text,
  dbs_status text default 'Not Required',
  notes text
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  customer_name text not null,
  phone text,
  email text,
  address text,
  postcode text,
  property_size text,
  service_needed text,
  preferred_date date,
  addons text[] default '{}',
  condition_notes text,
  access_notes text,
  parking_notes text,
  lead_source text default 'Website',
  quote_status text default 'Quote Needed',
  suggested_customer_quote numeric(10,2),
  customer_quote numeric(10,2),
  selected_contractor_id uuid references public.contractors(id) on delete set null,
  contractor_cost_estimate numeric(10,2),
  quote_sent_at timestamptz,
  follow_up_date date,
  lost_reason text,
  notes text
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  job_address text,
  postcode text,
  property_size text,
  service_needed text,
  addons text[] default '{}',
  job_date date,
  arrival_window text,
  access_notes text,
  parking_notes text,
  selected_contractor_id uuid references public.contractors(id) on delete set null,
  contractor_confirmed boolean default false,
  contractor_confirmation_time timestamptz,
  job_status text default 'Contractor Needed',
  completion_form_submitted boolean default false,
  before_photos_link text,
  after_photos_link text,
  completion_notes text,
  property_secured boolean default false,
  qa_status text default 'Not Started',
  qa_checked_at timestamptz,
  qa_notes text,
  customer_issue boolean default false,
  contractor_issue boolean default false,
  payment_hold boolean default false,
  payment_hold_reason text,
  customer_invoice_sent boolean default false,
  customer_paid boolean default false,
  payment_cleared boolean default false,
  customer_payment_date date,
  contractor_paid boolean default false,
  contractor_payment_date date,
  customer_price numeric(10,2),
  contractor_cost numeric(10,2),
  review_requested boolean default false,
  review_link_sent_at timestamptz,
  notes text
);

create table if not exists public.contractor_rates (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  rate_card_signed boolean default false,
  effective_from date default current_date,
  studio_rate numeric(10,2),
  one_bed_rate numeric(10,2),
  two_bed_rate numeric(10,2),
  three_bed_rate numeric(10,2),
  four_bed_rate numeric(10,2),
  five_bed_plus_rate numeric(10,2),
  deep_clean_hourly_rate numeric(10,2),
  single_oven_rate numeric(10,2),
  double_oven_rate numeric(10,2),
  range_cooker_rate numeric(10,2),
  carpet_per_room_rate numeric(10,2),
  windows_flat_rate numeric(10,2),
  windows_house_rate numeric(10,2),
  waste_small_load_rate numeric(10,2),
  waste_quarter_van_rate numeric(10,2),
  waste_half_van_rate numeric(10,2),
  waste_full_van_rate numeric(10,2),
  notes text
);

create table if not exists public.job_completion_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  job_id uuid references public.jobs(id) on delete set null,
  contractor_name text,
  job_address text,
  date_completed date,
  time_completed text,
  kitchen_completed boolean default false,
  bathroom_completed boolean default false,
  bedrooms_completed boolean default false,
  general_completed boolean default false,
  addons_completed text[] default '{}',
  before_photos text,
  after_photos text,
  any_issues boolean default false,
  issue_description text,
  property_secured boolean default false,
  additional_notes text,
  linked_job_id uuid references public.jobs(id) on delete set null
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete set null,
  date_opened date not null default current_date,
  customer_name text,
  contractor_id uuid references public.contractors(id) on delete set null,
  complaint_source text default 'Customer',
  issue_type text default 'Quality',
  severity text default 'Medium',
  description text,
  photos_link text,
  complaint_status text default 'Open',
  re_clean_needed boolean default false,
  re_clean_date date,
  refund_discount_offered numeric(10,2),
  insurance_claim boolean default false,
  final_outcome text,
  closed_date date,
  review_risk boolean default true
);

create table if not exists public.agent_outreach (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  agency text not null,
  contact_name text,
  phone text,
  email text,
  area text,
  status text default 'Not Contacted',
  last_contact_date date,
  next_follow_up_date date,
  pitch_sent boolean default false,
  pricing_sent boolean default false,
  notes text,
  outcome text
);

create table if not exists public.pricing_reference (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  item text not null,
  customer_sell_min numeric(10,2),
  customer_sell_max numeric(10,2),
  contractor_cost_min numeric(10,2),
  contractor_cost_max numeric(10,2),
  notes text
);

create unique index if not exists pricing_reference_category_item_idx on public.pricing_reference(category, item);

create table if not exists public.launch_checklist (
  id text primary key,
  category text,
  task text not null,
  details text,
  status text default 'Pending',
  required_before_live boolean default false,
  blocker boolean default false,
  owner text default 'Dom',
  due_date date,
  evidence_link text,
  notes text
);

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at before update on public.leads for each row execute function public.set_updated_at();
drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists set_contractors_updated_at on public.contractors;
create trigger set_contractors_updated_at before update on public.contractors for each row execute function public.set_updated_at();

create index if not exists leads_quote_status_idx on public.leads(quote_status);
create index if not exists jobs_job_date_idx on public.jobs(job_date);
create index if not exists jobs_status_idx on public.jobs(job_status, qa_status);
create index if not exists contractors_status_idx on public.contractors(contractor_status);
create index if not exists complaints_status_idx on public.complaints(complaint_status);

alter table public.operator_profiles enable row level security;
alter table public.leads enable row level security;
alter table public.jobs enable row level security;
alter table public.contractors enable row level security;
alter table public.contractor_rates enable row level security;
alter table public.job_completion_submissions enable row level security;
alter table public.complaints enable row level security;
alter table public.agent_outreach enable row level security;
alter table public.pricing_reference enable row level security;
alter table public.launch_checklist enable row level security;

drop policy if exists "operators can view own operator profile" on public.operator_profiles;
drop policy if exists "operators manage leads" on public.leads;
drop policy if exists "operators manage jobs" on public.jobs;
drop policy if exists "operators manage contractors" on public.contractors;
drop policy if exists "operators manage contractor rates" on public.contractor_rates;
drop policy if exists "operators manage completion submissions" on public.job_completion_submissions;
drop policy if exists "operators manage complaints" on public.complaints;
drop policy if exists "operators manage agents" on public.agent_outreach;
drop policy if exists "operators read pricing" on public.pricing_reference;
drop policy if exists "operators manage launch checklist" on public.launch_checklist;

create policy "operators can view own operator profile" on public.operator_profiles for select using (auth.uid() = user_id);

create policy "operators manage leads" on public.leads for all using (public.is_operator()) with check (public.is_operator());
create policy "operators manage jobs" on public.jobs for all using (public.is_operator()) with check (public.is_operator());
create policy "operators manage contractors" on public.contractors for all using (public.is_operator()) with check (public.is_operator());
create policy "operators manage contractor rates" on public.contractor_rates for all using (public.is_operator()) with check (public.is_operator());
create policy "operators manage completion submissions" on public.job_completion_submissions for all using (public.is_operator()) with check (public.is_operator());
create policy "operators manage complaints" on public.complaints for all using (public.is_operator()) with check (public.is_operator());
create policy "operators manage agents" on public.agent_outreach for all using (public.is_operator()) with check (public.is_operator());
create policy "operators read pricing" on public.pricing_reference for select using (public.is_operator());
create policy "operators manage launch checklist" on public.launch_checklist for all using (public.is_operator()) with check (public.is_operator());

insert into public.pricing_reference (category, item, customer_sell_min, customer_sell_max, contractor_cost_min, contractor_cost_max, notes) values
('End of Tenancy','Studio',150,200,40,60,'Price by property size; quote against condition/access.'),
('End of Tenancy','1 Bed',200,280,80,100,'Core service.'),
('End of Tenancy','2 Bed',250,350,120,160,'Core service.'),
('End of Tenancy','3 Bed',400,550,160,200,'Core service.'),
('End of Tenancy','4 Bed',500,700,240,320,'Usually team job.'),
('End of Tenancy','5 Bed+',700,1000,null,null,'Survey; target 35-50% margin.'),
('Deep Clean','Labour Hour',30,40,15,20,'Sell and cost by labour hour.'),
('Oven','Single Oven',60,80,25,35,'Ask on every EOT enquiry.'),
('Oven','Double Oven',90,120,40,60,'Ask on every EOT enquiry.'),
('Oven','Range Cooker',120,180,60,90,'Ask on every EOT enquiry.'),
('Windows','Internal Flat',20,30,10,15,'Add-on.'),
('Windows','Internal House',30,40,15,20,'Add-on.'),
('Windows','External Small House',25,40,15,20,'Add-on.'),
('Windows','External Medium House',30,50,15,20,'Add-on.'),
('Waste','Small Load',120,180,60,90,'High-value upsell.'),
('Waste','Quarter Van',180,250,90,130,'High-value upsell.'),
('Waste','Half Van',250,400,120,220,'High-value upsell.'),
('Waste','Full Van',450,700,250,400,'High-value upsell.')
on conflict (category, item) do update set
  customer_sell_min = excluded.customer_sell_min,
  customer_sell_max = excluded.customer_sell_max,
  contractor_cost_min = excluded.contractor_cost_min,
  contractor_cost_max = excluded.contractor_cost_max,
  notes = excluded.notes;

insert into public.launch_checklist (id, category, task, details, status, required_before_live, blocker, owner) values
('LC-001','Legal','Company registration complete','PDD Services Limited registration completed / company number added','Pending',true,true,'Dom'),
('LC-002','Legal','Registered office/address verified','London virtual address verified','Pending',true,true,'Dom'),
('LC-003','Finance','Tide business bank account active','Business current account open and usable','Pending',true,true,'Dom'),
('LC-004','Compliance','ICO/data protection registration','Register/check via ICO; store customer/contact data safely','Pending',true,true,'Dom'),
('LC-005','Insurance','PDD public liability insurance purchased','Public liability policy held by PDD Services Limited','Pending',true,true,'Dom'),
('LC-006','Insurance','Subcontractor coverage confirmed in writing','Insurer confirms whether contractors/subcontractors working for PDD are covered','Pending',true,true,'Dom'),
('LC-007','Contractors','First 2-3 contractors screened','At least 2-3 possible cleaners sourced and spoken to','In Progress',true,true,'Dom'),
('LC-008','Contractors','Contractor agreement solicitor-reviewed','Review agreement against actual working practices','Pending',true,true,'Dom'),
('LC-009','Contractors','Contractor docs collected','Agreement, rate card, insurance certificate, ID/right-to-work','Pending',true,true,'Dom'),
('LC-010','Contractors','First test job completed','Test job completed and quality checked before live customer work','Pending',true,true,'Dom'),
('LC-011','Website','Website live','Core pages live: Home, Services, About, Contact/Quote','Pending',true,false,'Dom'),
('LC-012','Google','Google Business Profile verified','GBP verified and service area/profile completed','Pending',true,false,'Dom'),
('LC-013','Google','Google Local Services Ads submitted','Requires insurance proof and setup','Pending',false,false,'Dom'),
('LC-014','Operations','Contractor completion form ready','Tally/Google Form link created for photos/completion','Pending',true,false,'Dom'),
('LC-015','Operations','Customer quote/booking message ready','Quote message and booking confirmation available for fast replies','Pending',true,false,'Dom'),
('LC-016','Operations','Review request process ready','Link/message ready after QA/customer satisfaction','Pending',false,false,'Dom'),
('LC-017','Sales','Letting agent outreach list started','Create target list once first proof/reviews exist','Not Started',false,false,'Dom')
on conflict (id) do update set
  category = excluded.category,
  task = excluded.task,
  details = excluded.details,
  status = excluded.status,
  required_before_live = excluded.required_before_live,
  blocker = excluded.blocker,
  owner = excluded.owner;

-- Optional: seed the single imported contractor from the previous spreadsheet, but keep inactive.
insert into public.contractors (name, areas_covered, hmrc_status, insurance_certificate_uploaded, test_job_status, test_job_result, contractor_status, dbs_status, notes)
select 'Olga', 'E16; Fulham; Green Park; Finsbury Park; Zone 1-2', 'Yes', true, 'Not Needed Yet', 'Pending', 'Interested', 'Not Required', 'Imported from existing Contractor Pipeline: location mismatch with core N14 area; possible fit for occasional central jobs or regular work if willing to travel to Wood Green/Bounds Green.'
where not exists (
  select 1 from public.contractors where name = 'Olga' and areas_covered = 'E16; Fulham; Green Park; Finsbury Park; Zone 1-2'
);
