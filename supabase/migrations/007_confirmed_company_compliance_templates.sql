-- PDD Operator Portal v5.7: confirmed company/compliance details, CRM form blueprints, editable message templates and stronger admin-only flags.
-- Run after 001 through 006. This migration includes the latest confirmed PDD company, insurance, ICO, payment and operating-process decisions.

-- Business settings: add confirmed company/compliance/payment fields.
alter table public.business_settings add column if not exists company_type text default 'Private company limited by shares';
alter table public.business_settings add column if not exists incorporation_date date default '2026-07-09';
alter table public.business_settings add column if not exists registered_in text default 'England & Wales';
alter table public.business_settings add column if not exists public_customer_email text default 'info@pddcleaningservices.co.uk';
alter table public.business_settings add column if not exists stripe_payout_bank text default 'Tide';
alter table public.business_settings add column if not exists ico_application_reference text default 'C1984389';
alter table public.business_settings add column if not exists public_liability_provider text default 'Admiral Business via Tide';
alter table public.business_settings add column if not exists public_liability_policy_number text default '2BII252DPV';
alter table public.business_settings add column if not exists public_liability_cover_amount numeric(12,2) default 1000000;
alter table public.business_settings add column if not exists public_liability_start_date date default '2026-07-15';
alter table public.business_settings add column if not exists public_liability_end_date date default '2027-07-14';
alter table public.business_settings add column if not exists professional_indemnity_status text default 'Included - separate certificate';
alter table public.business_settings add column if not exists professional_indemnity_provider text;
alter table public.business_settings add column if not exists professional_indemnity_cover_amount numeric(12,2);
alter table public.business_settings add column if not exists professional_indemnity_certificate_upload text;
alter table public.business_settings add column if not exists professional_indemnity_expiry_date date;
alter table public.business_settings add column if not exists vat_registered boolean default false;
alter table public.business_settings add column if not exists actual_trading_admin_address_restricted boolean default true;
alter table public.business_settings add column if not exists auth_code_restricted boolean default true;
alter table public.business_settings add column if not exists service_area_notes text default 'Customers are served at their properties. PDD is a service-area business, not a storefront.';

update public.business_settings
set
  legal_company_name = 'PDD Services Limited',
  trading_name = 'PDD Cleaning Services',
  company_number = '17329999',
  company_type = 'Private company limited by shares',
  incorporation_date = '2026-07-09',
  registered_in = 'England & Wales',
  business_email = 'info@pddcleaningservices.co.uk',
  public_customer_email = 'info@pddcleaningservices.co.uk',
  admin_backup_email = 'pddserviceslimited@gmail.com',
  phone_number = '07568 273696',
  website = 'https://pddcleaningservices.co.uk',
  tide_account_status = 'Open',
  stripe_account_status = 'Open',
  stripe_payout_bank = 'Tide',
  ico_registration_status = 'Done',
  ico_application_reference = 'C1984389',
  insurance_status = 'Active',
  public_liability_provider = 'Admiral Business via Tide',
  public_liability_policy_number = '2BII252DPV',
  public_liability_cover_amount = 1000000,
  public_liability_start_date = '2026-07-15',
  public_liability_end_date = '2027-07-14',
  professional_indemnity_status = 'Included - separate certificate',
  companies_house_auth_code_stored_securely = true,
  vat_registered = false,
  service_area_business = true,
  storefront_required = false,
  actual_trading_admin_address_restricted = true,
  auth_code_restricted = true,
  service_area_notes = 'Customers are served at their properties. PDD is a service-area business, not a storefront.',
  notes = coalesce(notes, '') || E'\n\nV5.7 update: confirmed company details, ICO paid, Tide open, Stripe payment links set up, public liability active, PI certificate tracked separately. Actual auth code should not be stored in visible CRM fields.'
where id = 'default';

-- Insurance checklist: confirmed active policy and separate PI tracking.
alter table public.insurance_checklist add column if not exists public_liability_provider text;
alter table public.insurance_checklist add column if not exists public_liability_policy_number text;
alter table public.insurance_checklist add column if not exists public_liability_cover_amount numeric(12,2);
alter table public.insurance_checklist add column if not exists occupation_class text default 'Household Cleaning Services';
alter table public.insurance_checklist add column if not exists cover_start_date date;
alter table public.insurance_checklist add column if not exists cover_end_date date;
alter table public.insurance_checklist add column if not exists professional_indemnity_status text;
alter table public.insurance_checklist add column if not exists professional_indemnity_provider text;
alter table public.insurance_checklist add column if not exists professional_indemnity_cover_amount numeric(12,2);
alter table public.insurance_checklist add column if not exists professional_indemnity_certificate_upload text;
alter table public.insurance_checklist add column if not exists professional_indemnity_expiry_date date;
alter table public.insurance_checklist add column if not exists policy_wording_link text;
alter table public.insurance_checklist add column if not exists admin_only_documents boolean default true;

insert into public.insurance_checklist (
  id,
  broker_insurer_contacted,
  public_liability_quoted,
  professional_indemnity_quoted,
  employers_liability_needed,
  bona_fide_subcontractors_allowed,
  subcontractors_must_hold_own_pl,
  minimum_subcontractor_pl_cover,
  pdd_site_visits_access_qa_key_photos_touchups_covered,
  arranging_managing_vetting_admin_risk_covered,
  policy_responds_if_customer_claims_against_pdd,
  public_liability_provider,
  public_liability_policy_number,
  public_liability_cover_amount,
  occupation_class,
  policy_purchased,
  policy_start_date,
  renewal_date,
  cover_start_date,
  cover_end_date,
  professional_indemnity_status,
  policy_documents_uploaded,
  launch_blocker,
  status,
  notes,
  admin_only_documents
)
values (
  'default',
  'Admiral Business via Tide',
  true,
  true,
  'Unknown',
  'Unknown',
  true,
  'Minimum contractor public liability cover to be confirmed by insurer/broker; default target £1m.',
  'Unknown',
  'Unknown',
  'Unknown',
  'Admiral Business via Tide',
  '2BII252DPV',
  1000000,
  'Household Cleaning Services',
  true,
  '2026-07-15',
  '2027-07-14',
  '2026-07-15',
  '2027-07-14',
  'Included on separate certificate - upload/store certificate and cover amount',
  false,
  true,
  'In Progress',
  'Public liability is active. Do not mark full insurance launch complete until the policy wording/certificate and broker/insurer confirmation cover the actual PDD model, including bona fide subcontractors with own PL and Dom attending sites for access, inspection, QA, key handling, photos or minor touch-ups.',
  true
)
on conflict (id) do update set
  public_liability_provider = excluded.public_liability_provider,
  public_liability_policy_number = excluded.public_liability_policy_number,
  public_liability_cover_amount = excluded.public_liability_cover_amount,
  occupation_class = excluded.occupation_class,
  policy_purchased = excluded.policy_purchased,
  policy_start_date = excluded.policy_start_date,
  renewal_date = excluded.renewal_date,
  cover_start_date = excluded.cover_start_date,
  cover_end_date = excluded.cover_end_date,
  professional_indemnity_status = excluded.professional_indemnity_status,
  admin_only_documents = true;

-- Lead/customer enquiry fields.
alter table public.leads add column if not exists property_condition text;
alter table public.leads add column if not exists photos_link text;
alter table public.leads add column if not exists access_parking_key_notes text;

-- Jobs: payment/profit, Tide reference, damage/access issue, exact payment type.
alter table public.jobs add column if not exists payment_type text default 'Full';
alter table public.jobs add column if not exists expected_gross_profit numeric(10,2);
alter table public.jobs add column if not exists expected_margin_percent numeric(6,2);
alter table public.jobs add column if not exists tide_transfer_reference text;
alter table public.jobs add column if not exists damage_access_issue boolean default false;
alter table public.jobs add column if not exists damage_access_issue_notes text;
alter table public.jobs add column if not exists contractor_payment_requested boolean default false;
alter table public.jobs add column if not exists manual_start_approved_by_dom boolean default false;
alter table public.jobs add column if not exists customer_terms_accepted boolean default false;
alter table public.jobs add column if not exists cancellation_start_work_consent_accepted boolean default false;

-- Keep customer_price and contractor_cost aligned to newer fields where possible.
update public.jobs
set
  quote_amount = coalesce(quote_amount, customer_price),
  expected_gross_profit = case when customer_price is not null and contractor_cost is not null then customer_price - contractor_cost else expected_gross_profit end,
  expected_margin_percent = case when customer_price is not null and customer_price > 0 and contractor_cost is not null then round(((customer_price - contractor_cost) / customer_price) * 100, 2) else expected_margin_percent end
where true;

-- Stronger contractor payment eligibility function now includes damage/access issue and payment-hold checks.
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
    and coalesce(new.qa_status, '') in ('QA Approved', 'Approved')
    and coalesce(new.property_secured, false) = true
    and coalesce(new.payment_hold, false) = false
    and coalesce(new.customer_issue, false) = false
    and coalesce(new.contractor_issue, false) = false
    and coalesce(new.issues_reported, false) = false
    and coalesce(new.damage_access_issue, false) = false
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

-- Contractor fields and admin-only document flags.
alter table public.contractors add column if not exists services_offered text;
alter table public.contractors add column if not exists end_of_tenancy_experience boolean default false;
alter table public.contractors add column if not exists deep_clean_experience boolean default false;
alter table public.contractors add column if not exists after_builders_experience boolean default false;
alter table public.contractors add column if not exists oven_experience boolean default false;
alter table public.contractors add column if not exists window_experience boolean default false;
alter table public.contractors add column if not exists carpet_experience boolean default false;
alter table public.contractors add column if not exists self_employed_status text;
alter table public.contractors add column if not exists public_liability_received boolean default false;
alter table public.contractors add column if not exists documents_admin_only boolean default true;
alter table public.contractors add column if not exists bank_details_admin_only boolean default true;

-- Job completion submissions: exact QA/completion fields.
alter table public.job_completion_submissions add column if not exists arrival_time text;
alter table public.job_completion_submissions add column if not exists checklist_completed boolean default false;
alter table public.job_completion_submissions add column if not exists keys_returned_secured text default 'Not applicable';
alter table public.job_completion_submissions add column if not exists extra_work_requested boolean default false;
alter table public.job_completion_submissions add column if not exists scope_issue boolean default false;
alter table public.job_completion_submissions add column if not exists contractor_payment_requested boolean default false;

-- Issue/re-clean fields.
alter table public.complaints add column if not exists issue_reported_date date;
alter table public.complaints add column if not exists within_48_hours boolean;
alter table public.complaints add column if not exists covered_by_agreed_checklist text default 'Review';
alter table public.complaints add column if not exists contractor_responsible text default 'Review';
alter table public.complaints add column if not exists payment_hold boolean default true;
alter table public.complaints add column if not exists resolution text;

-- Editable message template system. Messages are not hard-coded only; operators can edit them here.
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  template_id text not null,
  template_name text not null,
  category text not null default 'Customer',
  stage_status text,
  channel text default 'WhatsApp',
  subject_line text,
  message_body text not null,
  variables_used text,
  active boolean default true,
  notes text
);

create unique index if not exists message_templates_template_id_idx on public.message_templates(template_id);
alter table public.message_templates enable row level security;
drop policy if exists "operators manage message templates" on public.message_templates;
create policy "operators manage message templates" on public.message_templates
for all using (public.is_operator()) with check (public.is_operator());
drop trigger if exists set_message_templates_updated_at on public.message_templates;
create trigger set_message_templates_updated_at
before update on public.message_templates
for each row execute function public.set_updated_at();

-- CRM form blueprint system: tracks all forms, fields and operational notes inside CRM.
create table if not exists public.crm_form_blueprints (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  form_key text not null,
  form_name text not null,
  form_type text default 'Internal',
  linked_table text,
  purpose text,
  required_fields text,
  optional_fields text,
  status text default 'Draft',
  owner text default 'Dom',
  notes text,
  active boolean default true
);

create unique index if not exists crm_form_blueprints_form_key_idx on public.crm_form_blueprints(form_key);
alter table public.crm_form_blueprints enable row level security;
drop policy if exists "operators manage crm form blueprints" on public.crm_form_blueprints;
create policy "operators manage crm form blueprints" on public.crm_form_blueprints
for all using (public.is_operator()) with check (public.is_operator());
drop trigger if exists set_crm_form_blueprints_updated_at on public.crm_form_blueprints;
create trigger set_crm_form_blueprints_updated_at
before update on public.crm_form_blueprints
for each row execute function public.set_updated_at();

-- Customer templates.
insert into public.message_templates (template_id, template_name, category, stage_status, channel, subject_line, message_body, variables_used, active, notes)
values
('CUST-001','New enquiry reply','Customer','New Lead','WhatsApp',null,$$Hi [Name], thanks for getting in touch with PDD Cleaning Services.

To give you an accurate quote, could you confirm the property size, full address/postcode, service needed, preferred date and whether you need any add-ons like oven, windows, carpets or waste clearance?

Kind regards,
PDD Cleaning Services$$,'[Name], [Property Size], [Postcode], [Service], [Preferred Date]',true,'Editable CRM template.'),
('CUST-002','More information needed','Customer','Quote Needed','WhatsApp',null,$$Hi [Name], thanks for the details.

Before I quote properly, could you confirm:
- Full address/postcode
- Property size
- Current condition
- Access/parking/key details
- Any add-ons needed
- Preferred date/time

Kind regards,
PDD Cleaning Services$$,'[Name]',true,'Editable CRM template.'),
('CUST-003','Quote sent','Customer','Quote Sent','WhatsApp',null,$$Hi [Name], based on the details provided, the quote for [Service] at [Property] is £[Amount].

This includes the agreed scope/checklist and our 48-hour issue-support process if anything covered by the agreed checklist is missed.

If you’re happy to go ahead, I can send the secure payment link to confirm the booking.

Kind regards,
PDD Cleaning Services$$,'[Name], [Service], [Property], [Amount]',true,'Editable CRM template.'),
('CUST-004','Quote follow-up','Customer','Customer Follow-Up','WhatsApp',null,$$Hi [Name], just following up on the cleaning quote we sent for [Service].

Would you like us to hold/check availability for [Preferred Date]?

Kind regards,
PDD Cleaning Services$$,'[Name], [Service], [Preferred Date]',true,'Editable CRM template.'),
('CUST-005','Full payment request','Customer','Payment Link Needed','WhatsApp',null,$$Hi [Name], thanks for confirming.

To confirm your cleaning booking, please pay the full amount of £[Amount] using the secure card payment link below:

[Stripe Payment Link]

Once payment is received, we’ll confirm your slot and send the booking details.

Kind regards,
PDD Cleaning Services$$,'[Name], [Amount], [Stripe Payment Link]',true,'Stripe Payment Links preferred.'),
('CUST-006','Deposit request','Customer','Payment Link Needed','WhatsApp',null,$$Hi [Name], thanks for confirming.

To secure your cleaning booking, please pay the £[Deposit Amount] deposit using the secure card payment link below:

[Stripe Payment Link]

The remaining balance of £[Balance Amount] is due before the clean starts.

Kind regards,
PDD Cleaning Services$$,'[Name], [Deposit Amount], [Balance Amount], [Stripe Payment Link]',true,'Early trust-building option.'),
('CUST-007','Balance payment request','Customer','Awaiting Balance','WhatsApp',null,$$Hi [Name], your remaining balance for booking [Job ID] is £[Balance Amount].

Please pay using the secure card payment link below before the clean starts:

[Stripe Payment Link]

Kind regards,
PDD Cleaning Services$$,'[Name], [Job ID], [Balance Amount], [Stripe Payment Link]',true,'Balance must clear before contractor starts unless Dom manually approves.'),
('CUST-008','Booking confirmation','Customer','Job Confirmed','WhatsApp',null,$$Hi [Name], your cleaning booking is confirmed.

Service: [Service]
Date/time: [Date/Time]
Address: [Address]
Scope/add-ons: [Scope]

After the clean, if you’re happy with the service, we’d really appreciate a quick Google review as it helps a new local business build trust.

Kind regards,
PDD Cleaning Services$$,'[Name], [Service], [Date/Time], [Address], [Scope]',true,'Sets review expectation without pressure.'),
('CUST-009','Day-before reminder','Customer','Job Scheduled','WhatsApp',null,$$Hi [Name], just confirming your PDD Cleaning Services booking for tomorrow.

Service: [Service]
Time: [Time]
Address: [Address]

Please make sure access, parking, keys/codes and utilities are available as agreed.

Kind regards,
PDD Cleaning Services$$,'[Name], [Service], [Time], [Address]',true,'Editable CRM template.'),
('CUST-010','Job completed message','Customer','Completed - Awaiting Review Request','WhatsApp',null,$$Hi [Name], the clean has now been completed.

Please check the property when you can. If anything from the agreed checklist has been missed, let us know within 48 hours and we’ll review it under our issue-support process.

Kind regards,
PDD Cleaning Services$$,'[Name]',true,'Send before or with review request depending on QA/issue status.'),
('CUST-011','Google review request','Customer','Completed - Awaiting Review Request','WhatsApp',null,$$Hi [Name], the clean has now been completed.

Please check the property when you can. If anything from the agreed checklist has been missed, let us know within 48 hours and we’ll review it under our issue-support process.

If you’re happy with the clean, we’d really appreciate a quick Google review. It really helps a new local business like ours build trust:

[Google Review Link]

Thanks again,
PDD Cleaning Services$$,'[Name], [Google Review Link]',true,'No incentives, pressure or only-positive review wording.'),
('CUST-012','Review follow-up','Customer','Completed - Awaiting Review Request','WhatsApp',null,$$Hi [Name], hope everything was okay with the clean.

If you’re happy with the service, we’d really appreciate a quick Google review when you have a moment:

[Google Review Link]

Thanks again,
PDD Cleaning Services$$,'[Name], [Google Review Link]',true,'Only one polite follow-up, 24–48 hours later.'),
('CUST-013','Issue/re-clean response','Customer','Issue / Re-clean','WhatsApp',null,$$Hi [Name], sorry to hear there’s an issue.

Please send photos of the areas in question and we’ll review them against the agreed checklist and 48-hour issue-support process.

Once reviewed, we’ll confirm whether a re-clean or another resolution is appropriate.

Kind regards,
PDD Cleaning Services$$,'[Name]',true,'Handle complaint before review request.')
on conflict (template_id) do update set
  template_name = excluded.template_name,
  category = excluded.category,
  stage_status = excluded.stage_status,
  channel = excluded.channel,
  subject_line = excluded.subject_line,
  message_body = excluded.message_body,
  variables_used = excluded.variables_used,
  active = excluded.active,
  notes = excluded.notes;

-- Contractor templates.
insert into public.message_templates (template_id, template_name, category, stage_status, channel, subject_line, message_body, variables_used, active, notes)
values
('CONT-001','Initial contractor interest reply','Contractor','Interested','WhatsApp',null,$$Hi [Name], thanks for your interest.

PDD Cleaning Services is building a small pool of reliable self-employed cleaners for end of tenancy, deep cleaning and after builders cleaning jobs across North London.

Jobs are offered per job, you can accept or decline, and there is no guaranteed work or exclusivity.

Could you confirm your areas, experience, transport and whether you have public liability insurance?$$,'[Name]',true,'Editable CRM template.'),
('CONT-002','Insurance explanation','Contractor','Docs Requested','WhatsApp',null,$$No worries, it’s mainly because the work would be on a self-employed contractor basis.

As you’d be working independently in customer properties, public liability insurance is something we’d need in place before any live jobs. It helps protect you, the customer and the business if there was accidental damage or an issue.

No pressure at this stage — it’s just one of the things we’d need before offering customer jobs.$$,'',true,'Use when contractor asks why insurance is needed.'),
('CONT-003','Screening questions','Contractor','Screened','WhatsApp',null,$$Great, thanks. A few quick questions:

1. What areas do you cover?
2. Do you have your own transport?
3. Do you do end of tenancy cleans?
4. Do you do deep cleans/after builders cleans?
5. Are you self-employed?
6. Do you have public liability insurance?
7. What are your usual rates by property size?$$,'',true,'Editable CRM template.'),
('CONT-004','Docs request','Contractor','Docs Requested','WhatsApp',null,$$Thanks [Name]. Before any live customer jobs, we’ll need:

- ID/right-to-work proof
- Public liability insurance certificate
- Signed contractor agreement
- Signed rate card
- Paid test clean completed/passed

Please send secure links/photos of the documents when ready.$$,'[Name]',true,'Admin-only docs in CRM.'),
('CONT-005','Rate discussion','Contractor','Rate Card Signed','WhatsApp',null,$$Hi [Name], for PDD jobs we agree the exact rate before each job is accepted.

Could you confirm your rates for studio, 1 bed, 2 bed, 3 bed, 4 bed+ end of tenancy cleans, and your hourly/day rate for deep cleans or after builders cleans?$$,'[Name]',true,'Editable CRM template.'),
('CONT-006','Test clean invite','Contractor','Test Job Needed','WhatsApp',null,$$Hi [Name], we’d like to book a paid test clean so we can check quality, communication, photos and completion process before offering live customer jobs.

Proposed details:
Date/time: [Date/Time]
Location/type: [Test Clean Details]
Agreed fee: £[Fee]

Please confirm if this works for you.$$,'[Name], [Date/Time], [Test Clean Details], [Fee]',true,'Paid test before Active.'),
('CONT-007','Job offer','Contractor','Contractor Offered','WhatsApp',null,$$Hi [Name], we have a possible job for you:

Service: [Service]
Property: [Property Size]
Area/address: [Address]
Date/time: [Date/Time]
Add-ons: [Add-ons]
Offered rate: £[Contractor Rate]

Please confirm if you can accept this job.$$,'[Name], [Service], [Property Size], [Address], [Date/Time], [Add-ons], [Contractor Rate]',true,'Contractor can accept or decline.'),
('CONT-008','Job dispatch','Contractor','Job Scheduled','WhatsApp',null,$$Hi [Name], confirmed job details:

Customer first name: [Customer First Name]
Address: [Address]
Date/time: [Date/Time]
Service: [Service]
Scope/add-ons: [Scope]
Access/parking/key notes: [Access Notes]

Please take before and after photos, complete the checklist, and submit the completion form once finished.$$,'[Name], [Customer First Name], [Address], [Date/Time], [Service], [Scope], [Access Notes]',true,'Only customer first name where possible.'),
('CONT-009','Scope issue instruction','Contractor','Scope Issue','WhatsApp',null,$$If you arrive and the property is clearly worse than described or outside the agreed scope, please stop before doing extra work, take photos/videos, and message PDD straight away.

PDD will speak to the customer and agree either an increased price or reduced scope before you continue.

You are not expected to do unexpected extra work for the same fixed price.$$,'',true,'Hard process for materially different property condition.'),
('CONT-010','Completion/photos reminder','Contractor','Awaiting Completion Photos','WhatsApp',null,$$Hi [Name], reminder for today’s job:

Please submit the completion form once finished, including before/after photos, checklist confirmation, issue notes if any, and property secured confirmation.

Contractor payment can only be reviewed after completion/photos, QA and payment checks are complete.$$,'[Name]',true,'Protects payment rule.'),
('CONT-011','Payment confirmation','Contractor','Contractor Paid','WhatsApp',null,$$Hi [Name], payment for job [Job ID] has been approved/processed.

Thanks for completing the job and submitting the required completion details.$$,'[Name], [Job ID]',true,'Only after hard payment rule passed.')
on conflict (template_id) do update set
  template_name = excluded.template_name,
  category = excluded.category,
  stage_status = excluded.stage_status,
  channel = excluded.channel,
  subject_line = excluded.subject_line,
  message_body = excluded.message_body,
  variables_used = excluded.variables_used,
  active = excluded.active,
  notes = excluded.notes;

-- CRM form blueprints.
insert into public.crm_form_blueprints (form_key, form_name, form_type, linked_table, purpose, required_fields, optional_fields, status, owner, notes, active)
values
('customer-lead-enquiry','Customer Lead / Enquiry Form','Public','leads','Capture customer enquiries from website or manual entry.','Customer name; Phone; Email; Service needed; Property size; Preferred date; Postcode; Full address; Lead source','Add-ons; Property condition; Access/parking/key notes; Anything else; Photos upload optional','Ready','Dom','Address must submit as address/full address so it appears in lead details.',true),
('quote-form','Quote Form','Internal','leads/jobs','Prepare quote and margin before sending to customer.','Lead ID; Service; Property size; Contractor cost estimate; Customer quote amount; Payment decision; Margin %; Quote status','Add-ons; Condition notes; Quote sent date; Notes','Ready','Dom','Manual Stripe links first.',true),
('booking-confirmation','Booking Confirmation Form','Internal','jobs','Confirm job once customer accepts and required payment is received.','Job ID; Customer; Service; Date/time; Address; Agreed scope; Payment status; Contractor assigned; Customer terms accepted; Cancellation/start-work consent accepted','Add-ons; Access notes','Ready','Dom','Required payment should clear before contractor starts unless Dom manually approves.',true),
('contractor-onboarding','Contractor Onboarding Form','Public','contractors','Collect contractor screening, docs and rate info before test clean.','Name; Phone; Email; Areas covered; Transport; Services offered; Experience; Self-employed status; Public liability insurance; ID/right-to-work; Status','Insurance certificate upload/link; Insurance expiry; Insurance cover amount; Agreement signed; Rate card signed; Test clean score','Ready','Dom','Contractors must not be Active until agreement, rate card, PL, ID/right-to-work and test clean are complete.',true),
('job-dispatch','Job Dispatch Form','Internal','jobs','Send controlled job sheet/checklist to contractor.','Job ID; Contractor; Customer first name only; Job address; Date/time; Service type; Checklist; Access instructions; Completion photo requirements','Parking/key notes; Add-ons; Agreed scope; Scope issue instruction','Ready','Dom','Do not expose unnecessary customer details.',true),
('contractor-completion-qa','Contractor Completion / QA Form','Public','job_completion_submissions/jobs','Capture completion, photos, checklist and issue information from contractor.','Job ID; Contractor name; Arrival time; Completion time; Checklist completed; Before photos; After photos; Property secured; Keys returned/secured','Issues found; Customer/property notes; Extra work requested; Scope issue; Contractor payment requested','Ready','Dom','Moves job to QA Review. Does not release payment by itself.',true),
('issue-reclean','Issue / Re-clean Form','Internal','complaints','Log customer issue and 48-hour re-clean decision.','Job ID; Customer; Issue reported date; Within 48 hours?; Issue description; Covered by agreed checklist?; Re-clean needed?; Payment hold?; Resolution','Photos from customer; Contractor responsible?; Closed date','Ready','Dom','Handle complaint before asking for review.',true),
('review-tracking','Review Tracking Form','Internal','jobs','Track compliant Google review request and follow-up.','Job ID; Review request sent?; Review request sent date; Review received?; Review platform','Review follow-up sent; Review follow-up date; Review rating; Review notes','Ready','Dom','No incentives, pressure or only-positive wording.',true)
on conflict (form_key) do update set
  form_name = excluded.form_name,
  form_type = excluded.form_type,
  linked_table = excluded.linked_table,
  purpose = excluded.purpose,
  required_fields = excluded.required_fields,
  optional_fields = excluded.optional_fields,
  status = excluded.status,
  owner = excluded.owner,
  notes = excluded.notes,
  active = excluded.active;

-- Launch checklist: update latest confirmed readiness state.
insert into public.launch_checklist (id, category, task, details, status, required_before_live, blocker, owner, priority, blocks_launch, evidence_link, notes)
values
('LS-019','Company setup','ICO registration completed','ICO registration/payment completed. Application/reference C1984389 stored in Company Settings.','Done',true,false,'Dom','High',true,null,'Latest confirmed update.'),
('LS-020','Insurance','Public liability active','Admiral Business via Tide, policy 2BII252DPV, £1m cover, Household Cleaning Services, 15/07/2026 to 14/07/2027. Still confirm wording/model before scaling.','In Progress',true,false,'Dom','High',true,null,'Active cover exists, but model confirmation remains important.'),
('LS-021','Insurance','Professional indemnity certificate saved','PI included on separate certificate. Upload/store certificate and cover/expiry details.','In Progress',true,false,'Dom','High',true,null,'Do not mark done until certificate is saved.'),
('LS-022','Payments','Manual Stripe Payment Links ready','Stripe account set up for payment links. Use full payment before clean by default, deposit + balance before start only for trust-building.','In Progress',true,false,'Dom','High',true,null,'Later automate payment-link creation and Stripe webhook updates.'),
('LS-023','Messages','Editable message templates seeded','Customer and contractor message templates are editable in CRM/app.','Done',true,false,'Dom','Medium',false,null,'Do not hard-code final copy only.'),
('LS-024','CRM/app workflow','CRM form blueprint seeded','Lead, quote, booking, contractor, dispatch, completion, issue and review form specs are stored in CRM/app.','Done',true,false,'Dom','Medium',false,null,'Use Form Specs page.')
on conflict (id) do update set
  category = excluded.category,
  task = excluded.task,
  details = excluded.details,
  status = excluded.status,
  priority = excluded.priority,
  blocks_launch = excluded.blocks_launch,
  notes = excluded.notes;
