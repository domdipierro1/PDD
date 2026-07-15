-- PDD Operator Portal v5.6: launch setup tracker and operational workflow controls.
-- Run after 001_initial_schema.sql through 005_business_payments_reviews.sql.

-- Company settings: service-area, website, GBP, ICO, insurance, solicitor and review-link controls.
alter table public.business_settings add column if not exists website text default 'https://pddcleaningservices.co.uk';
alter table public.business_settings add column if not exists google_business_profile_status text default 'Not Started';
alter table public.business_settings add column if not exists ico_registration_status text default 'Not Started';
alter table public.business_settings add column if not exists solicitor_review_status text default 'Not Started';
alter table public.business_settings add column if not exists google_review_link text;
alter table public.business_settings add column if not exists google_review_link_saved boolean default false;
alter table public.business_settings add column if not exists service_area_business boolean default true;
alter table public.business_settings add column if not exists storefront_required boolean default false;

update public.business_settings
set
  company_number = coalesce(company_number, '17329999'),
  website = coalesce(website, 'https://pddcleaningservices.co.uk'),
  service_area_business = true,
  storefront_required = false
where id = 'default';

-- Launch checklist improvements.
alter table public.launch_checklist add column if not exists priority text default 'High';
alter table public.launch_checklist add column if not exists blocks_launch boolean default false;
update public.launch_checklist set blocks_launch = coalesce(blocks_launch, required_before_live, false);

-- Insurance checklist for the exact PDD contractor-fulfilled model.
create table if not exists public.insurance_checklist (
  id text primary key default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  broker_insurer_contacted text,
  public_liability_quoted boolean default false,
  professional_indemnity_quoted boolean default false,
  employers_liability_needed text default 'Unknown',
  bona_fide_subcontractors_allowed text default 'Unknown',
  subcontractors_must_hold_own_pl boolean default true,
  minimum_subcontractor_pl_cover text,
  pdd_site_visits_access_qa_key_photos_touchups_covered text default 'Unknown',
  arranging_managing_vetting_admin_risk_covered text default 'Unknown',
  policy_responds_if_customer_claims_against_pdd text default 'Unknown',
  exclusion_external_windows boolean default false,
  exclusion_carpet_cleaning boolean default false,
  exclusion_waste boolean default false,
  exclusion_jet_washing boolean default false,
  exclusion_after_builders boolean default false,
  exclusion_oven_cleaning boolean default false,
  policy_purchased boolean default false,
  policy_start_date date,
  renewal_date date,
  policy_documents_uploaded boolean default false,
  evidence_link text,
  launch_blocker boolean default true,
  status text default 'Not Started',
  notes text,
  model_confirmed_by_broker boolean default false
);

alter table public.insurance_checklist enable row level security;
drop policy if exists "operators manage insurance checklist" on public.insurance_checklist;
create policy "operators manage insurance checklist" on public.insurance_checklist
for all using (public.is_operator()) with check (public.is_operator());

drop trigger if exists set_insurance_checklist_updated_at on public.insurance_checklist;
create trigger set_insurance_checklist_updated_at
before update on public.insurance_checklist
for each row execute function public.set_updated_at();

insert into public.insurance_checklist (id, minimum_subcontractor_pl_cover, status, launch_blocker, notes)
values (
  'default',
  'TBC, likely £1m minimum unless insurer requires more',
  'Not Started',
  true,
  'Do not mark complete unless insurer/broker confirms the actual PDD model is covered: PDD arranges/manages cleaning jobs; cleaning is mainly completed by bona fide self-employed subcontractors with their own public liability; Dom may attend sites for access, inspection, QA, key handling, photos or minor touch-ups.'
)
on conflict (id) do nothing;

-- Solicitor / legal documents checklist.
create table if not exists public.legal_documents_checklist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  document_name text not null,
  current_version text default 'Draft v1',
  status text default 'Draft',
  solicitor_review_needed boolean default true,
  last_updated date default current_date,
  notes text,
  file_link text,
  launch_blocker boolean default true
);

create unique index if not exists legal_documents_document_name_idx on public.legal_documents_checklist(document_name);
alter table public.legal_documents_checklist enable row level security;
drop policy if exists "operators manage legal documents checklist" on public.legal_documents_checklist;
create policy "operators manage legal documents checklist" on public.legal_documents_checklist
for all using (public.is_operator()) with check (public.is_operator());

drop trigger if exists set_legal_documents_checklist_updated_at on public.legal_documents_checklist;
create trigger set_legal_documents_checklist_updated_at
before update on public.legal_documents_checklist
for each row execute function public.set_updated_at();

insert into public.legal_documents_checklist (document_name, current_version, status, solicitor_review_needed, notes, launch_blocker)
values
('Contractor Agreement','Draft v1','Draft',true,'Do not mark solicitor-approved unless actually reviewed by a solicitor against the real operating model.',true),
('Contractor Rate Card','Draft v1','Draft',true,'Used to confirm per-job and add-on rates before assigning work.',true),
('Contractor Onboarding Declaration','Draft v1','Draft',true,'Should cover self-employed status, right to work, insurance, non-exclusivity and standards.',true),
('Customer Booking Terms','Draft v1','Draft',true,'Customer-facing terms before scaling paid ads.',true),
('Privacy Policy','Draft v1','Draft',true,'Must cover enquiry, booking, contractor sharing, photos and complaint records.',true),
('Complaint/Re-clean Policy','Draft v1','Draft',true,'Must align to the 48-hour issue/re-clean process.',true),
('Key/Access Policy','Draft v1','Draft',true,'Must cover keys, codes, access responsibility and secure return.',true),
('Payment/Cancellation Terms','Draft v1','Draft',true,'Must align to Stripe links, full payment before start, deposit/balance option and cancellation rules.',true)
on conflict (document_name) do update set
  solicitor_review_needed = excluded.solicitor_review_needed,
  launch_blocker = excluded.launch_blocker;

-- Contractor onboarding improvements.
alter table public.contractors add column if not exists services_offered text;
alter table public.contractors add column if not exists end_of_tenancy_experience boolean default false;
alter table public.contractors add column if not exists deep_clean_experience boolean default false;
alter table public.contractors add column if not exists after_builders_experience boolean default false;
alter table public.contractors add column if not exists oven_window_carpet_experience text;
alter table public.contractors add column if not exists self_employed_status text;
alter table public.contractors add column if not exists public_liability_received boolean default false;

update public.contractors
set
  public_liability_received = coalesce(public_liability_received, insurance_certificate_uploaded, false),
  self_employed_status = coalesce(self_employed_status, hmrc_status),
  end_of_tenancy_experience = coalesce(end_of_tenancy_experience, eot_deep_clean_experience, false),
  deep_clean_experience = coalesce(deep_clean_experience, eot_deep_clean_experience, false)
where true;

-- Test clean / paid trial process.
create table if not exists public.test_cleans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  contractor_id uuid references public.contractors(id) on delete set null,
  contractor_name text,
  test_clean_address text,
  test_clean_type text,
  scheduled_at timestamptz,
  agreed_test_fee numeric(10,2),
  checklist_sent boolean default false,
  before_photos_received boolean default false,
  after_photos_received boolean default false,
  completion_form_received boolean default false,
  quality_score integer,
  communication_score integer,
  punctuality_score integer,
  passed boolean default false,
  active_approval_decision text default 'Pending',
  notes text,
  evidence_link text
);

create index if not exists test_cleans_contractor_id_idx on public.test_cleans(contractor_id);
alter table public.test_cleans enable row level security;
drop policy if exists "operators manage test cleans" on public.test_cleans;
create policy "operators manage test cleans" on public.test_cleans
for all using (public.is_operator()) with check (public.is_operator());

drop trigger if exists set_test_cleans_updated_at on public.test_cleans;
create trigger set_test_cleans_updated_at
before update on public.test_cleans
for each row execute function public.set_updated_at();

-- QA / completion improvements.
alter table public.jobs add column if not exists checklist_completed boolean default false;
alter table public.jobs add column if not exists access_key_returned_secured boolean default false;
alter table public.jobs add column if not exists issues_reported boolean default false;
alter table public.jobs add column if not exists customer_completion_message_sent boolean default false;
alter table public.jobs add column if not exists issue_deadline timestamptz;
alter table public.jobs add column if not exists job_close_out_status text default 'Open';
alter table public.jobs add column if not exists payment_method text default 'Stripe';

-- Contractor payment eligibility should be system-controlled, not manually guessed.
create or replace function public.set_contractor_payment_eligibility()
returns trigger
language plpgsql
as $$
begin
  new.contractor_payment_eligible := (
    coalesce(new.payment_cleared, false) = true
    and coalesce(new.completion_form_submitted, false) = true
    and nullif(trim(coalesce(new.before_photos_link, '')), '') is not null
    and nullif(trim(coalesce(new.after_photos_link, '')), '') is not null
    and coalesce(new.qa_status, '') = 'QA Approved'
    and coalesce(new.property_secured, false) = true
    and coalesce(new.payment_hold, false) = false
    and coalesce(new.customer_issue, false) = false
    and coalesce(new.contractor_issue, false) = false
    and coalesce(new.issues_reported, false) = false
    and coalesce(new.contractor_paid, false) = false
  );
  return new;
end;
$$;

drop trigger if exists set_jobs_contractor_payment_eligibility on public.jobs;
create trigger set_jobs_contractor_payment_eligibility
before insert or update on public.jobs
for each row execute function public.set_contractor_payment_eligibility();

update public.jobs set updated_at = updated_at;

-- Seed the full launch setup checklist categories and tasks.
insert into public.launch_checklist (id, category, task, details, status, required_before_live, blocker, owner, priority, blocks_launch)
values
('LS-001','Company setup','Confirm Companies House details','Legal company PDD Services Limited, company number 17329999, trading name PDD Cleaning Services.','Done',true,false,'Dom','High',true),
('LS-002','Company setup','Store Companies House authentication code securely','Store outside normal CRM views. Do not expose the actual code in the app.','Done',true,false,'Dom','High',true),
('LS-003','Company setup','Record actual trading/admin address','Use real admin/trading location for banking/admin records. Registered office/correspondence address may be virtual.','In Progress',true,false,'Dom','High',true),
('LS-004','Banking','Tide business account open','Stripe payouts should go into Tide. Tide transfer/payment request remains backup.','Done',true,false,'Dom','High',true),
('LS-005','Stripe/payments','Stripe account ready for Payment Links','Manual Stripe Payment Links first. Later automate creation via secure server/Apps Script/Make/Zapier layer.','In Progress',true,false,'Dom','High',true),
('LS-006','Stripe/payments','Test full payment link flow','Create test/full payment link, send it, mark paid and check CRM status changes.','Not Started',true,false,'Dom','High',true),
('LS-007','Insurance','Confirm insurance for actual contractor model','Broker/insurer must confirm PDD arranges/manages jobs fulfilled mainly by bona fide subcontractors with their own PL and Dom may attend for access/QA/photos/minor touch-ups.','Blocked',true,true,'Dom','High',true),
('LS-008','ICO/data protection','Confirm ICO/data protection fee position','Track whether ICO registration/payment is required for PDD records, photos and customer/contractor data.','Not Started',true,false,'Dom','High',true),
('LS-009','Solicitor/contracts','Solicitor review of customer/contractor documents','Do not mark solicitor-approved unless actually reviewed. Drafts can be used for internal preparation only.','Not Started',true,false,'Dom','High',true),
('LS-010','Google Business Profile','GBP live and review link ready','Set up or verify GBP, save review link, do not incentivise reviews.','In Progress',true,false,'Dom','High',true),
('LS-011','Contractor onboarding','At least one vetted contractor test-passed','Agreement, rate card, ID/right-to-work, insurance, rates and test clean passed before active rota.','In Progress',true,false,'Dom','High',true),
('LS-012','Contractor onboarding','Backup contractor in progress','Avoid single point of fulfilment failure.','In Progress',true,false,'Dom','Medium',false),
('LS-013','Test clean','Test clean process ready','Checklist, before/after photos, completion form, quality score and active approval decision.','Not Started',true,false,'Dom','High',true),
('LS-014','CRM/app workflow','CRM lead-to-close test completed','Test enquiry, quote, payment link, job confirmation, contractor, completion, QA, review, margin and close.','Not Started',true,false,'Dom','High',true),
('LS-015','Customer templates','Customer quote/booking/payment/completion templates ready','Templates for quote, booking confirmation, payment link, completion, 48-hour issue window and review request.','Not Started',true,false,'Dom','Medium',false),
('LS-016','Contractor templates','Contractor offer/dispatch/day-before/completion templates ready','Templates for job offer, dispatch, completion reminder and issue reporting.','Not Started',true,false,'Dom','Medium',false),
('LS-017','Review process','Google review request process ready','Ask politely after QA and issue checks. No incentives, pressure or only-positive requests.','Not Started',true,false,'Dom','High',true),
('LS-018','Soft launch readiness','One proof-test job completed before scaling ads','One enquiry, quote, payment, contractor, clean, photos, QA, review request, margin and close before paid ads scale.','Not Started',true,false,'Dom','High',true)
on conflict (id) do update set
  category = excluded.category,
  task = excluded.task,
  details = excluded.details,
  required_before_live = excluded.required_before_live,
  priority = excluded.priority,
  blocks_launch = excluded.blocks_launch;
