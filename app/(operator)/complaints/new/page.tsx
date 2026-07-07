"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Job } from "@/lib/types";
import { complaintStatuses, severityLevels } from "@/lib/options";
import { toBool, toMoney } from "@/lib/utils";

function NewComplaintForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job_id") || "";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState(jobId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    supabase.from("jobs").select("*").order("job_date", { ascending: false }).then(({ data }) => setJobs((data || []) as Job[]));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const job = jobs.find((j) => j.id === selectedJob);
    const payload = {
      job_id: selectedJob || null,
      customer_name: String(form.get("customer_name") || job?.customer_name || "").trim() || null,
      complaint_source: String(form.get("complaint_source") || "Customer"),
      issue_type: String(form.get("issue_type") || "Quality"),
      severity: String(form.get("severity") || "Medium"),
      description: String(form.get("description") || "").trim() || null,
      photos_link: String(form.get("photos_link") || "").trim() || null,
      complaint_status: String(form.get("complaint_status") || "Open"),
      re_clean_needed: toBool(form.get("re_clean_needed")),
      re_clean_date: String(form.get("re_clean_date") || "") || null,
      refund_discount_offered: toMoney(form.get("refund_discount_offered")),
      insurance_claim: toBool(form.get("insurance_claim")),
      review_risk: toBool(form.get("review_risk")),
    };
    const { error: insertError } = await supabase.from("complaints").insert(payload);
    if (!insertError && selectedJob) await supabase.from("jobs").update({ customer_issue: true, payment_hold: true, payment_hold_reason: "Complaint open" }).eq("id", selectedJob);
    setSaving(false);
    if (insertError) return setError(insertError.message);
    router.push("/complaints");
  }

  return (
    <>
      <div className="page-head"><div><h1>Log complaint</h1><p>Add a payment hold immediately while the issue is unresolved.</p></div><Link className="button ghost" href="/complaints">Back</Link></div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      <form className="card form-grid" onSubmit={onSubmit}>
        <label className="full">Linked job<select value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}><option value="">No linked job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.customer_name} · {job.job_address || job.postcode}</option>)}</select></label>
        <label>Customer name<input name="customer_name" /></label>
        <label>Complaint source<select name="complaint_source"><option>Customer</option><option>Agent</option><option>Contractor</option><option>Internal QA</option></select></label>
        <label>Issue type<select name="issue_type"><option>Quality</option><option>Damage</option><option>Access</option><option>Conduct</option><option>No-show</option><option>Payment</option></select></label>
        <label>Severity<select name="severity">{severityLevels.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Status<select name="complaint_status">{complaintStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Re-clean date<input name="re_clean_date" type="date" /></label>
        <label>Refund/discount offered<input name="refund_discount_offered" inputMode="decimal" /></label>
        <label>Photos link<input name="photos_link" type="url" /></label>
        <label><span>Re-clean needed?</span><input name="re_clean_needed" type="checkbox" /></label>
        <label><span>Insurance claim?</span><input name="insurance_claim" type="checkbox" /></label>
        <label><span>Review risk?</span><input name="review_risk" type="checkbox" /></label>
        <label className="full">Description<textarea name="description" required /></label>
        <div className="full actions-row"><button className="button" disabled={saving}>{saving ? "Saving…" : "Save complaint"}</button><Link className="button ghost" href="/complaints">Cancel</Link></div>
      </form>
    </>
  );
}

export default function NewComplaintPage() {
  return <Suspense fallback={<div className="notice">Loading…</div>}><NewComplaintForm /></Suspense>;
}
