-- PDD Operator Portal v5.5: company settings, Stripe/Tide payment workflow, review tracking and launch readiness.
-- Run after 001_initial_schema.sql, 002_documents_photos_finance.sql, 003_contractor_rate_pipeline.sql and 004_core_rls_security.sql.

create table if not exists public.business_settings (
  id text primary key default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  legal_company_name text default 'PDD Services Limited',
  trading_name text default 'PDD Cleaning Services',
  company_number text,
  registered_office_address text,
  actual_trading_admin_address text,
  business_email text default 'info@pddcleaningservices.co.uk',
  admin_backup_email text default 'pddserviceslimited@gmail.com',
  phone_number text,
  tide_account_status text default 'Open',
  stripe_account_status text default 'Not Started',
  insurance_status text default 'Not Confirmed',
  companies_house_auth_code_stored_securely boolean default false,
  hmrc_utr_received boolean default false,
  corporation_tax_setup_status text default 'Not Started',
  notes text
);

alter table public.business_settings enable row level security;

drop policy if exists "operators manage business settings" on public.business_settings;
create policy "operators manage business settings" on public.business_settings
for all using (public.is_operator()) with check (public.is_operator());

drop trigger if exists set_business_settings_updated_at on public.business_settings;
create trigger set_business_settings_updated_at
before update on public.business_settings
for each row execute function public.set_updated_at();

insert into public.business_settings (
  id,
  legal_company_name,
  trading_name,
  business_email,
  admin_backup_email,
  tide_account_status,
  stripe_account_status,
  insurance_status,
  companies_house_auth_code_stored_securely,
  hmrc_utr_received,
  corporation_tax_setup_status,
  notes
)
values (
  'default',
  'PDD Services Limited',
  'PDD Cleaning Services',
  'info@pddcleaningservices.co.uk',
  'pddserviceslimited@gmail.com',
  'Open',
  'Not Started',
  'Not Confirmed',
  true,
  false,
  'Not Started',
  'Do not store the actual Companies House authentication code in this CRM. Store only whether it has been stored securely.'
)
on conflict (id) do update set
  legal_company_name = excluded.legal_company_name,
  trading_name = excluded.trading_name,
  business_email = excluded.business_email,
  admin_backup_email = excluded.admin_backup_email,
  tide_account_status = excluded.tide_account_status;

-- Lead payment fields: used before job conversion.
alter table public.leads add column if not exists quote_amount numeric(10,2);
alter table public.leads add column if not exists deposit_required boolean default false;
alter table public.leads add column if not exists deposit_amount numeric(10,2);
alter table public.leads add column if not exists deposit_payment_method text;
alter table public.leads add column if not exists deposit_payment_link text;
alter table public.leads add column if not exists deposit_link_sent_date date;
alter table public.leads add column if not exists deposit_paid boolean default false;
alter table public.leads add column if not exists deposit_paid_date date;
alter table public.leads add column if not exists balance_amount numeric(10,2);
alter table public.leads add column if not exists balance_payment_link text;
alter table public.leads add column if not exists balance_link_sent_date date;
alter table public.leads add column if not exists balance_paid boolean default false;
alter table public.leads add column if not exists balance_paid_date date;
alter table public.leads add column if not exists full_payment_required boolean default true;
alter table public.leads add column if not exists full_payment_link text;
alter table public.leads add column if not exists full_payment_paid boolean default false;
alter table public.leads add column if not exists stripe_payment_id text;
alter table public.leads add column if not exists stripe_checkout_session_id text;
alter table public.leads add column if not exists payment_notes text;
alter table public.leads add column if not exists payment_hold boolean default false;
alter table public.leads add column if not exists payment_hold_reason text;
alter table public.leads add column if not exists contractor_payment_eligible boolean default false;

-- Job payment fields: used after job confirmation.
alter table public.jobs add column if not exists quote_amount numeric(10,2);
alter table public.jobs add column if not exists deposit_required boolean default false;
alter table public.jobs add column if not exists deposit_amount numeric(10,2);
alter table public.jobs add column if not exists deposit_payment_method text;
alter table public.jobs add column if not exists deposit_payment_link text;
alter table public.jobs add column if not exists deposit_link_sent_date date;
alter table public.jobs add column if not exists deposit_paid boolean default false;
alter table public.jobs add column if not exists deposit_paid_date date;
alter table public.jobs add column if not exists balance_amount numeric(10,2);
alter table public.jobs add column if not exists balance_payment_link text;
alter table public.jobs add column if not exists balance_link_sent_date date;
alter table public.jobs add column if not exists balance_paid boolean default false;
alter table public.jobs add column if not exists balance_paid_date date;
alter table public.jobs add column if not exists full_payment_required boolean default true;
alter table public.jobs add column if not exists full_payment_link text;
alter table public.jobs add column if not exists full_payment_paid boolean default false;
alter table public.jobs add column if not exists stripe_payment_id text;
alter table public.jobs add column if not exists stripe_checkout_session_id text;
alter table public.jobs add column if not exists payment_notes text;
alter table public.jobs add column if not exists contractor_payment_eligible boolean default false;

-- Review tracking fields.
alter table public.jobs add column if not exists review_request_sent boolean default false;
alter table public.jobs add column if not exists review_request_sent_date date;
alter table public.jobs add column if not exists review_follow_up_sent boolean default false;
alter table public.jobs add column if not exists review_follow_up_date date;
alter table public.jobs add column if not exists review_received boolean default false;
alter table public.jobs add column if not exists review_platform text default 'Google';
alter table public.jobs add column if not exists review_name text;
alter table public.jobs add column if not exists review_rating numeric(3,1);
alter table public.jobs add column if not exists review_notes text;
alter table public.jobs add column if not exists issue_resolved_before_review_request boolean default false;

-- Helpful indexes for payment and review views.
create index if not exists leads_quote_status_idx on public.leads(quote_status);
create index if not exists jobs_job_status_idx on public.jobs(job_status);
create index if not exists jobs_payment_readiness_idx on public.jobs(payment_cleared, completion_form_submitted, qa_status, property_secured, payment_hold, contractor_paid);
create index if not exists jobs_review_request_idx on public.jobs(review_request_sent, review_received, qa_status);

-- Launch proof-test and readiness checks.
insert into public.launch_checklist (id, category, task, details, status, required_before_live, blocker, owner)
values
('LC-019','Legal / Insurance','Insurance confirmed','Confirm public liability / contractor fulfilment insurance position before taking live customer work.','Pending',true,false,'Dom'),
('LC-020','Contractors','At least 1 contractor test-passed','Have at least one vetted/test-passed contractor ready before live paid jobs.','Pending',true,false,'Dom'),
('LC-021','Contractors','Backup contractor in progress','Have at least one backup contractor in screening/onboarding so fulfilment is not single-point-of-failure.','Pending',true,false,'Dom'),
('LC-022','Payments','Stripe payment flow working','Create and test Stripe Payment Links for deposit, balance and full payment. Stripe payouts should go to Tide.','Pending',true,false,'Dom'),
('LC-023','CRM','CRM lead/job/payment flow tested','Test one full dummy flow: enquiry, quote, payment link, job, completion, QA, review request and margin.','Pending',true,false,'Dom'),
('LC-024','Operations','Completion form ready','Contractor completion form must collect checklist confirmation, before/after photos, issue flag and property secured confirmation.','Pending',true,false,'Dom'),
('LC-025','Operations','QA process ready','Operator QA process must review photos/checklist before customer close-out or contractor payment.','Pending',true,false,'Dom'),
('LC-026','Reviews','Google review link ready','Set up Google review link and use compliant review request process after job completion.','Pending',true,false,'Dom'),
('LC-027','Complaints','Complaint/re-clean process ready','Have complaint/re-clean handling ready before scaling paid ads.','Pending',true,false,'Dom'),
('LC-028','Launch','Proof-test first customer before scaling ads','First target: one enquiry, quote, payment, contractor, completed clean, QA, review request, margin recorded and closed job.','Pending',true,false,'Dom')
on conflict (id) do update set
  category = excluded.category,
  task = excluded.task,
  details = excluded.details,
  required_before_live = excluded.required_before_live,
  owner = excluded.owner;
