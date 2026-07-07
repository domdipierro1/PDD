"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { MetricRow } from "@/components/metric-row";
import { supabase } from "@/lib/supabase";
import type { Job, Contractor, Complaint } from "@/lib/types";
import { contractorPaymentDue } from "@/lib/quote";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [jobRes, contractorRes, complaintRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", params.id).single(),
      supabase.from("contractors").select("*").order("name", { ascending: true }),
      supabase.from("complaints").select("*").eq("job_id", params.id).order("date_opened", { ascending: false }),
    ]);
    if (jobRes.error) setError(jobRes.error.message);
    setJob(jobRes.data as Job);
    setContractors((contractorRes.data || []) as Contractor[]);
    setComplaints((complaintRes.data || []) as Complaint[]);
  }

  useEffect(() => { load(); }, [params.id]);

  async function update(values: Record<string, unknown>, success: string) {
    if (!job) return;
    const { error: updateError } = await supabase.from("jobs").update(values).eq("id", job.id);
    if (updateError) return setError(updateError.message);
    setMessage(success);
    await load();
  }

  async function assignContractor(contractorId: string) {
    await update({ selected_contractor_id: contractorId || null, job_status: contractorId ? "Contractor Assigned" : "Contractor Needed" }, "Contractor assignment updated.");
  }

  if (error) return <div className="notice bad">{error}</div>;
  if (!job) return <div className="notice">Loading job…</div>;
  const activeContractors = contractors.filter((c) => c.contractor_status === "Active" || c.active_rota_approved);
  const canPay = contractorPaymentDue(job);
  const openComplaints = complaints.filter((c) => c.complaint_status !== "Closed");
  const completionFormBase = process.env.NEXT_PUBLIC_CONTRACTOR_COMPLETION_FORM_URL;
  const selectedContractor = contractors.find((c) => c.id === job.selected_contractor_id);
  const completionFormLink = completionFormBase
    ? `${completionFormBase}${completionFormBase.includes("?") ? "&" : "?"}${new URLSearchParams({
        job_id: job.id,
        job_address: job.job_address || "",
        contractor_name: selectedContractor?.name || "",
      }).toString()}`
    : "";

  async function copyCompletionLink() {
    if (!completionFormLink) return;
    await navigator.clipboard.writeText(completionFormLink);
    setMessage("Contractor completion form link copied.");
  }

  return (
    <>
      <div className="page-head">
        <div><h1>{job.customer_name}</h1><p>{job.job_address || "No address"}</p></div>
        <div className="actions-row"><StatusBadge value={job.job_status} /><StatusBadge value={job.qa_status} />{canPay ? <StatusBadge value="Payment Due" /> : null}<Link className="button ghost" href="/jobs">Back</Link></div>
      </div>
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      {openComplaints.length > 0 ? <div className="notice bad" style={{ marginBottom: 16 }}>This job has an open complaint. Keep payment hold active until resolved.</div> : null}
      <div className="detail-layout">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Job details</h2>
          <div className="kv">
            <div><span>Date</span><strong>{formatDate(job.job_date)}</strong></div>
            <div><span>Service</span><strong>{job.service_needed || "—"}</strong></div>
            <div><span>Property</span><strong>{job.property_size || "—"}</strong></div>
            <div><span>Add-ons</span><strong>{job.addons?.join(", ") || "None"}</strong></div>
            <div><span>Customer price</span><strong>{formatCurrency(job.customer_price)}</strong></div>
            <div><span>Contractor cost</span><strong>{formatCurrency(job.contractor_cost)}</strong></div>
            <div><span>Customer paid</span><strong>{job.customer_paid ? "Yes" : "No"}</strong></div>
            <div><span>Payment cleared</span><strong>{job.payment_cleared ? "Yes" : "No"}</strong></div>
            <div><span>Completion form</span><strong>{job.completion_form_submitted ? "Submitted" : "Not submitted"}</strong></div>
            <div><span>Property secured</span><strong>{job.property_secured ? "Yes" : "No"}</strong></div>
            <div><span>Contractor paid</span><strong>{job.contractor_paid ? "Yes" : "No"}</strong></div>
          </div>
          <div style={{ marginTop: 14 }}><MetricRow customerPrice={job.customer_price} contractorCost={job.contractor_cost} /></div>
          <h3>Photos / completion</h3>
          <div className="kv">
            <div><span>Before photos</span><strong>{job.before_photos_link ? <a href={job.before_photos_link} target="_blank">Open</a> : "—"}</strong></div>
            <div><span>After photos</span><strong>{job.after_photos_link ? <a href={job.after_photos_link} target="_blank">Open</a> : "—"}</strong></div>
          </div>
        </section>
        <aside className="card">
          <h2 style={{ marginTop: 0 }}>Operator actions</h2>
          <label>Assigned contractor<select value={job.selected_contractor_id || ""} onChange={(e) => assignContractor(e.target.value)}><option value="">Not assigned</option>{activeContractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <div className="actions-row" style={{ marginTop: 14 }}>
            <button className="button secondary" onClick={() => update({ contractor_confirmed: true, contractor_confirmation_time: new Date().toISOString(), job_status: "Contractor Assigned" }, "Contractor confirmed.")}>Contractor confirmed</button>
            <button className="button secondary" onClick={() => update({ job_status: "In Progress" }, "Job marked in progress.")}>In progress</button>
            <button className="button secondary" onClick={() => update({ completion_form_submitted: true, job_status: "Completed - Awaiting QA", qa_status: "Awaiting QA" }, "Completion received. QA required.")}>Completion received</button>
            <button className="button secondary" onClick={() => update({ property_secured: true }, "Property secured confirmed.")}>Property secured</button>
            <button className="button" onClick={() => update({ qa_status: "QA Approved", qa_checked_at: new Date().toISOString(), job_status: "Completed", payment_hold: false }, "QA approved.")}>QA approved</button>
            <button className="button ghost" onClick={() => update({ qa_status: "Re-clean Needed", payment_hold: true, job_status: "Completed - Awaiting QA" }, "Re-clean needed. Payment hold added.")}>Re-clean needed</button>
            <button className="button secondary" onClick={() => update({ customer_paid: true, payment_cleared: true, customer_payment_date: new Date().toISOString().slice(0,10) }, "Customer payment cleared.")}>Payment cleared</button>
            <button className="button" disabled={!canPay} onClick={() => update({ contractor_paid: true, contractor_payment_date: new Date().toISOString().slice(0,10) }, "Contractor marked paid.")}>Mark contractor paid</button>
            <Link className="button danger" href={`/complaints/new?job_id=${job.id}`}>Log complaint</Link>
          </div>
          <div className="notice warn" style={{ marginTop: 14 }}>Contractor payment only becomes due after payment cleared, completion evidence submitted, QA approved, property secured and no unresolved issue.</div>
          <div className="notice" style={{ marginTop: 14 }}>
            <strong>Contractor completion form</strong><br />
            {completionFormLink ? (
              <>
                Send this job-specific link after the contractor is assigned.<br />
                <button className="button ghost" type="button" onClick={copyCompletionLink} style={{ marginTop: 10 }}>Copy completion form link</button>
              </>
            ) : (
              <>Add NEXT_PUBLIC_CONTRACTOR_COMPLETION_FORM_URL in Vercel to generate job-specific form links here.</>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
