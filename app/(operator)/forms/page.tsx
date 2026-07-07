"use client";

import { useEffect, useState } from "react";

function endpoint(origin: string, path: string) {
  return origin ? `${origin}${path}` : path;
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="code-card">
      <div className="list-top"><strong>{label}</strong><button className="button ghost" type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>
      <code>{value}</code>
    </div>
  );
}

export default function FormsPage() {
  const [origin, setOrigin] = useState("");
  const contractorOnboardingUrl = process.env.NEXT_PUBLIC_CONTRACTOR_ONBOARDING_FORM_URL || "";
  const contractorCompletionUrl = process.env.NEXT_PUBLIC_CONTRACTOR_COMPLETION_FORM_URL || "";

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const websiteEndpoint = endpoint(origin, "/api/website-enquiry");
  const onboardingEndpoint = endpoint(origin, "/api/contractor-onboarding?secret=YOUR_FORM_WEBHOOK_SECRET");
  const completionEndpoint = endpoint(origin, "/api/job-completion?secret=YOUR_FORM_WEBHOOK_SECRET");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Forms & integrations</h1>
          <p>Connect website enquiries, contractor onboarding and contractor job completion forms into the operator portal.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Website enquiries</h2>
          <p className="muted">Use this as the action URL for the public website quote form. Every submission creates a new Lead with status Quote Needed.</p>
          <CopyBlock label="Website form endpoint" value={websiteEndpoint} />
          <div className="notice warn" style={{ marginTop: 14 }}>
            Add a hidden field called <strong>return_url</strong> with your website thank-you page, for example https://pddcleaningservices.co.uk/thank-you.html.
          </div>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Contractor onboarding</h2>
          <p className="muted">Use this as the Tally/Google Forms webhook target. It creates a Contractor record but does not activate the contractor.</p>
          <CopyBlock label="Contractor onboarding webhook" value={onboardingEndpoint} />
          {contractorOnboardingUrl ? <CopyBlock label="Current onboarding form link" value={contractorOnboardingUrl} /> : <div className="notice" style={{ marginTop: 14 }}>Optional: add NEXT_PUBLIC_CONTRACTOR_ONBOARDING_FORM_URL in Vercel to store your Tally/Google Form link here.</div>}
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Job completion</h2>
          <p className="muted">Use this as the Tally/Google Forms webhook target. Include a hidden/job field called job_id so the correct job moves to Awaiting QA.</p>
          <CopyBlock label="Job completion webhook" value={completionEndpoint} />
          {contractorCompletionUrl ? <CopyBlock label="Current completion form base link" value={contractorCompletionUrl} /> : <div className="notice" style={{ marginTop: 14 }}>Optional: add NEXT_PUBLIC_CONTRACTOR_COMPLETION_FORM_URL in Vercel to generate copyable job-specific form links on each job page.</div>}
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Required Vercel variables</h2>
          <p className="muted">These are server-side form settings. Do not put the service-role key into website code or public GitHub files.</p>
          <CopyBlock label="Required" value={"SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_or_service_role_key\nFORM_WEBHOOK_SECRET=choose-a-long-random-password"} />
          <CopyBlock label="Optional public form links" value={"NEXT_PUBLIC_CONTRACTOR_ONBOARDING_FORM_URL=https://tally.so/r/YOUR_FORM\nNEXT_PUBLIC_CONTRACTOR_COMPLETION_FORM_URL=https://tally.so/r/YOUR_FORM"} />
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Field names to use</h2>
        <div className="grid grid-3">
          <div>
            <h3>Website lead</h3>
            <p className="muted">name, phone, email, postcode_area, service_needed, property_size, message, contact_consent, return_url</p>
          </div>
          <div>
            <h3>Contractor onboarding</h3>
            <p className="muted">full name, phone number, email address, areas covered, own transport, years of experience, self-employed with HMRC, insurance expiry date, right to work proof</p>
          </div>
          <div>
            <h3>Job completion</h3>
            <p className="muted">job_id, contractor name, job address, date completed, time completed, before photos, after photos, any issues, describe issue, property secured</p>
          </div>
        </div>
      </section>
    </>
  );
}
