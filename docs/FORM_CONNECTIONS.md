# PDD Operator Portal — Form Connections

This version includes three API endpoints so public forms can feed the private operator app.

## Required Vercel environment variable

Add this in Vercel under **Project → Settings → Environment Variables**:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_or_service_role_key
```

Use the Supabase **secret/service role** key only in Vercel. Do not put it in GitHub or website code.

For contractor/Tally webhooks, also add:

```env
FORM_WEBHOOK_SECRET=choose-a-long-random-password
```

After adding environment variables, redeploy the Vercel project.

---

## 1. Website quote form → Leads

Endpoint:

```text
https://YOUR-OPERATOR-APP.vercel.app/api/website-enquiry
```

Set your website contact form action to that endpoint:

```html
<form action="https://YOUR-OPERATOR-APP.vercel.app/api/website-enquiry" method="POST">
  <input type="hidden" name="return_url" value="https://pddcleaningservices.co.uk/thank-you.html" />
  <input type="text" name="company" style="display:none" tabindex="-1" autocomplete="off" />

  <input name="name" required />
  <input name="phone" required />
  <input name="email" />
  <input name="postcode_area" required />
  <select name="service_needed" required>...</select>
  <select name="property_size">...</select>
  <textarea name="message"></textarea>
  <input type="checkbox" name="contact_consent" value="Agreed" required />
  <button type="submit">Send Quote Request</button>
</form>
```

The endpoint creates a row in `leads` with `quote_status = Quote Needed`.

---

## 2. Contractor onboarding form → Contractors

Webhook endpoint:

```text
https://YOUR-OPERATOR-APP.vercel.app/api/contractor-onboarding?secret=YOUR_FORM_WEBHOOK_SECRET
```

Use this as your Tally/Google Forms webhook target.

Recommended field names/labels:

- Full name
- Phone number
- Email address
- Area(s) you cover
- Own transport?
- Years of experience
- EOT/deep clean experience?
- Describe experience
- Self-employed with HMRC?
- Own public liability insurance?
- Upload insurance certificate
- Insurance expiry date
- Upload right to work proof
- Willing to do a paid test job?
- Anything else?

The endpoint creates a Contractor with:

- `contractor_status = Docs Received`
- `test_job_status = Needed`
- `active_rota_approved = false`

So no contractor becomes active automatically.

---

## 3. Contractor job completion form → Job Completion Submissions + Jobs

Webhook endpoint:

```text
https://YOUR-OPERATOR-APP.vercel.app/api/job-completion?secret=YOUR_FORM_WEBHOOK_SECRET
```

The form must include `job_id` as a hidden field or URL parameter. The job detail page can generate a prefilled contractor completion form link when `NEXT_PUBLIC_CONTRACTOR_COMPLETION_FORM_URL` is configured.

Recommended field names/labels:

- job_id
- Contractor name
- Job address
- Date completed
- Time completed
- Kitchen completed
- Bathroom completed
- Bedrooms completed
- General completed
- Add-ons completed
- Upload BEFORE photos
- Upload AFTER photos
- Any issues?
- Describe issue
- Property secured?
- Additional notes

The endpoint creates a row in `job_completion_submissions` and updates the linked job:

- `completion_form_submitted = true`
- `qa_status = Awaiting QA`
- `job_status = Completed - Awaiting QA`
- `property_secured` based on form answer
- if issue reported: `payment_hold = true`

Contractor payment still only becomes due after customer payment has cleared, QA is approved, property is secured and no unresolved issue remains.
