# PDD Operator Portal

Private Vercel/Supabase operator app for **PDD Services Limited / PDD Cleaning Services**.

This is intentionally simple. It is not a customer portal and not a contractor portal. Contractors still use Tally/Google Forms for onboarding and job completion.

## What this app includes

- Private operator login
- Dashboard / Command Centre
- Leads and quote tracking
- Convert accepted leads into jobs
- Jobs, contractor assignment, QA, payment clearance
- Contractor screening and compliance checklist
- QA review page
- Contractor payments page with safe-to-pay logic
- Complaints and payment holds
- Agent outreach tracker
- Launch checklist
- Internal pricing reference

## Tech stack

- Next.js App Router
- Vercel hosting
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Supabase setup

1. Create a Supabase project.
2. Go to **SQL Editor**.
3. Paste and run each migration in order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_documents_photos_finance.sql
supabase/migrations/003_contractor_rate_pipeline.sql
supabase/migrations/004_core_rls_security.sql
```

4. Go to **Authentication > Users** and create your operator user.
5. Copy the user's UUID.
6. Go back to **SQL Editor** and run:

```sql
insert into public.operator_profiles (user_id, email, full_name, active)
values ('PASTE-YOUR-AUTH-USER-UUID-HERE', 'your-email@example.com', 'Dom', true);
```

7. Use that email/password on `/login`.

## Vercel deployment

1. Push this folder to GitHub.
2. Import the GitHub repo into Vercel.
3. Add these environment variables in Vercel before the first build:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_NAME
SUPABASE_SERVICE_ROLE_KEY
FORM_WEBHOOK_SECRET
NEXT_PUBLIC_CONTRACTOR_ONBOARDING_FORM_URL
NEXT_PUBLIC_CONTRACTOR_COMPLETION_FORM_URL
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
NEXT_PUBLIC_PORTAL_URL
```

4. Deploy. The build expects the Supabase public URL and anon key to exist at build time.


## Telegram notifications

This version can send instant Telegram alerts when key public forms are submitted:

- New customer quote request
- New contractor onboarding/application
- Contractor job completion submission
- Urgent job completion review flags, such as missing photos, issue reported or property not confirmed secured

Add these in **Vercel → Project → Settings → Environment Variables**:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_telegram_chat_id
NEXT_PUBLIC_PORTAL_URL=https://your-vercel-app.vercel.app
```

Keep `TELEGRAM_BOT_TOKEN` private. Do not put it in GitHub or any public website file.

To test after deployment, open:

```text
https://YOUR-VERCEL-APP.vercel.app/api/test-telegram?secret=YOUR_FORM_WEBHOOK_SECRET
```

If it works, you will receive a Telegram message saying the PDD Telegram test was successful.

## Important operating rules built into the workflow

Contractor payment should only be treated as due when all are true:

- Customer payment cleared
- Completion form submitted
- Before photos link present
- After photos link present
- QA approved
- Property secured
- No payment hold
- No customer issue
- No contractor issue
- Contractor not already paid

The app calculates this in the UI and only enables the **Mark contractor paid** button when the job passes the rule.

## What not to add yet

Do not add contractor login, customer login, Xero, calendar automation or complex automations until the first few real/test jobs have been run through the system.

The goal of this version is simple:

**Stop leads, jobs, QA, complaints and contractor payments falling through the cracks.**

## Form/API integrations added

This build includes API routes for connecting public forms to the private operator app:

- `/api/website-enquiry` creates a Lead from the public website quote form.
- `/api/contractor-onboarding` creates a Contractor from Tally/Google Forms onboarding.
- `/api/job-completion` creates a Job Completion Submission and updates the linked Job to Awaiting QA.

Add these Vercel environment variables:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_or_service_role_key
FORM_WEBHOOK_SECRET=choose-a-long-random-string
NEXT_PUBLIC_CONTRACTOR_ONBOARDING_FORM_URL=https://tally.so/r/YOUR_ONBOARDING_FORM
NEXT_PUBLIC_CONTRACTOR_COMPLETION_FORM_URL=https://tally.so/r/YOUR_COMPLETION_FORM
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-side in Vercel. Do not add it to website files or expose it publicly.

See `docs/FORM_CONNECTIONS.md` for exact form setup instructions.

## v2: Forms, records and finance

If you are upgrading from the first portal version, run this additional Supabase migration after deployment:

```text
supabase/migrations/002_documents_photos_finance.sql
```

New public pages:

- `/quote-request` — creates Leads
- `/contractor-onboarding` — creates Contractors
- `/job-completion?job_id=...` — creates job completion submissions and moves jobs to Awaiting QA

New operator pages:

- `/finance` — revenue/cost/profit tracker
- `/records` — documents and photo links

Contractors still do not receive app access.

## Job completion checklist update

The built-in `/job-completion` contractor form now includes required room-by-room checklist checkboxes for kitchen, bathroom(s), bedrooms/living areas, general finish/security, optional add-ons, before/after photo links, issue notes and contractor notes. The submitted checklist is saved into the job completion notes and moves the job into Awaiting QA.

## v5.5 CRM/AppSheet Process Update

Run this migration after the earlier migrations:

```sql
supabase/migrations/005_business_payments_reviews.sql
```

v5.5 adds:

- Business Details / Company Settings table and page.
- Stripe/Tide/deposit/balance/full-payment tracking fields on leads and jobs.
- Review tracking fields and Reviews queue.
- Updated job status options for the new quote → payment → fulfilment → review → close process.
- Launch readiness checklist items for insurance, contractor proof-test, Stripe, QA, completion form, review link and complaint process.

Important: do not store the actual Companies House authentication code or Stripe secret keys inside CRM tables. Store only secure-status flags inside the CRM.

## v5.6 — Launch Setup Tracker & Operating Workflow

This version adds the launch setup tracker and operating controls requested for PDD Cleaning Services.

### New/updated CRM sections
- Company / Business Details: company number, website, GBP status, ICO status, solicitor review status, service-area business flags and review-link tracking.
- Launch Setup Checklist: full launch categories, priority, status, owner, due date, evidence link and launch-blocker flag.
- Insurance Checklist: tracks the actual PDD model where PDD arranges/manages work fulfilled mainly by bona fide self-employed subcontractors with their own public liability, while Dom may attend for access/QA/photos/key handling/minor touch-ups.
- Legal Docs Checklist: contractor agreement, rate card, onboarding declaration, customer terms, privacy policy, complaint/re-clean policy, key/access policy and payment/cancellation terms.
- Test Cleans: contractor test/live trial records, scores, photo/completion evidence and active approval decision.
- Contractor onboarding fields: services offered, EOT/deep/after-builders/add-on experience and public liability flags.
- QA/job close-out: checklist completed, access/key secured, issue reporting, customer completion message, 48-hour issue deadline and close-out status.
- Contractor payment eligibility: system-controlled rule requiring cleared payment, completion form, before/after photo links, QA approval, property secured and no unresolved issue/payment hold.

### Required Supabase migration
Run after previous migrations:

```sql
supabase/migrations/006_launch_ops_setup_tracker.sql
```

### Hard rule preserved
No contractor payment is eligible unless customer payment has cleared, job is completed, completion form/photos are submitted, QA is approved, property is secured, and no unresolved complaint, damage/access issue or payment hold exists.


## v5.7 confirmed company/compliance CRM update

Before uploading/running Supabase, this pack now includes the latest confirmed company, compliance, insurance, payment, form blueprint and editable message-template updates.

After deploying this version, run migrations in order through:

```text
supabase/migrations/007_confirmed_company_compliance_templates.sql
```

New pages added:

```text
/message-templates
/form-blueprints
```

Use these pages to edit customer/contractor messages and track the form setup blueprint before live operation.
