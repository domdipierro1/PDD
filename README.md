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
```

4. Deploy. The build expects the Supabase public URL and anon key to exist at build time.

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
