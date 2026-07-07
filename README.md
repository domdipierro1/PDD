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
3. Paste and run:

```text
supabase/migrations/001_initial_schema.sql
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
3. Add these environment variables in Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_NAME
```

4. Deploy.

## Important operating rules built into the workflow

Contractor payment should only be treated as due when all are true:

- Customer payment cleared
- Completion form/photos submitted
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
