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

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const quoteForm = endpoint(origin, "/quote-request");
  const onboardingForm = endpoint(origin, "/contractor-onboarding");
  const completionForm = endpoint(origin, "/job-completion");
  const websiteEndpoint = endpoint(origin, "/api/website-enquiry");
  const onboardingEndpoint = endpoint(origin, "/api/contractor-onboarding?public=1");
  const completionEndpoint = endpoint(origin, "/api/job-completion?public=1");

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Forms & integrations</h1>
          <p>Use built-in public forms first. Contractors still do not get app access.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Customer quote form</h2>
          <p className="muted">This built-in page creates a Lead in the portal. You can link to it from the website or replace the website form action with the API endpoint below.</p>
          <CopyBlock label="Built-in quote form" value={quoteForm} />
          <CopyBlock label="Website form API endpoint" value={websiteEndpoint} />
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Contractor onboarding</h2>
          <p className="muted">Send this public/unlisted link to possible contractors. It creates a Contractor record with status Docs Received, but does not activate them.</p>
          <CopyBlock label="Built-in contractor onboarding form" value={onboardingForm} />
          <CopyBlock label="Public onboarding API" value={onboardingEndpoint} />
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Job completion</h2>
          <p className="muted">Use the job-specific copy button inside each job page so the link includes the correct job_id. This page moves the job to Awaiting QA.</p>
          <CopyBlock label="Base completion form" value={completionForm} />
          <CopyBlock label="Public completion API" value={completionEndpoint} />
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Required Vercel variables</h2>
          <p className="muted">These should already be set. The service role key stays server-side only.</p>
          <CopyBlock label="Required" value={"SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_or_service_role_key\nFORM_WEBHOOK_SECRET=choose-a-long-random-password"} />
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Current workflow</h2>
        <div className="grid grid-3">
          <div>
            <h3>Website lead</h3>
            <p className="muted">Customer submits /quote-request or website form → new Lead appears as Quote Needed.</p>
          </div>
          <div>
            <h3>Contractor onboarding</h3>
            <p className="muted">Contractor submits details → Contractor record created → you review agreement, insurance and test job.</p>
          </div>
          <div>
            <h3>Job completion</h3>
            <p className="muted">Contractor submits sign-off/photos link → job moves to Awaiting QA → payment stays locked until safe.</p>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>CRM setup pages</h2>
        <div className="grid grid-2">
          <div>
            <h3>Form Specs</h3>
            <p className="muted">Tracks the CRM/AppSheet blueprint for customer enquiry, quote, booking, contractor onboarding, job dispatch, completion/QA, issue/re-clean and review forms.</p>
          </div>
          <div>
            <h3>Message Templates</h3>
            <p className="muted">Editable customer and contractor templates. Use this instead of relying on hard-coded messages only.</p>
          </div>
        </div>
      </section>
    </>
  );
}
