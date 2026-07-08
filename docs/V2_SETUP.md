# PDD Operator Portal v2 setup

This version adds the first five operating-system upgrades:

1. More stable core app/navigation
2. Built-in public contractor onboarding form
3. Built-in public job completion/sign-off form
4. Website quote enquiry form/API connection
5. Job documents, photo records and finance tracking

## 1. Redeploy the code

Upload/commit this version to GitHub and let Vercel redeploy.

Keep these Vercel variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
NEXT_PUBLIC_APP_NAME=PDD Operator Portal
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_service_role_key
FORM_WEBHOOK_SECRET=your_private_form_secret
```

## 2. Run the new database migration

In Supabase SQL Editor, run:

```text
supabase/migrations/002_documents_photos_finance.sql
```

This creates:

- `job_documents`
- `job_photos`
- `finance_items`
- `audit_log`

It also adds simple link fields to `jobs`.

## 3. Built-in public form links

After deployment, open the app and go to:

```text
Forms
```

You will see links for:

```text
/quote-request
/contractor-onboarding
/job-completion
```

Contractors do not get portal login access. They only use public/unlisted form links.

## 4. Website enquiry connection

Use either:

- link the website quote button to `/quote-request`, or
- change the static website form action to `/api/website-enquiry` on the deployed app.

Example:

```html
<form action="https://YOUR-VERCEL-APP.vercel.app/api/website-enquiry" method="POST">
```

## 5. Job records and finance

Each job page now has sections to add:

- Customer agreement links
- Contractor agreement/job sheet links
- Signable/Drive/PDF links
- Before/after photo links
- Extra revenue or cost items

The `Finance` page totals revenue, contractor cost, extra costs, gross profit, unpaid customer value and contractor payment exposure.

This is an operational finance tracker, not a formal accounting replacement. Use Xero/accountant later for statutory accounts and tax.
