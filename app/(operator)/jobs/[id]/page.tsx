"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { MetricRow } from "@/components/metric-row";
import { supabase } from "@/lib/supabase";
import type { Job, Contractor, ContractorRate, Complaint, JobDocument, JobPhoto, FinanceItem } from "@/lib/types";
import { contractorPaymentDue } from "@/lib/quote";
import { formatDate, formatCurrency, toBool, toMoney } from "@/lib/utils";
import { estimatedRateForProperty } from "@/lib/rates";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [documents, setDocuments] = useState<JobDocument[]>([]);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>([]);
  const [contractorRates, setContractorRates] = useState<ContractorRate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [jobRes, contractorRes, complaintRes, docRes, photoRes, financeRes, rateRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", params.id).single(),
      supabase.from("contractors").select("*").order("name", { ascending: true }),
      supabase.from("complaints").select("*").eq("job_id", params.id).order("date_opened", { ascending: false }),
      supabase.from("job_documents").select("*").eq("job_id", params.id).order("created_at", { ascending: false }),
      supabase.from("job_photos").select("*").eq("job_id", params.id).order("created_at", { ascending: false }),
      supabase.from("finance_items").select("*").eq("job_id", params.id).order("created_at", { ascending: false }),
      supabase.from("contractor_rates").select("*").order("effective_from", { ascending: false }),
    ]);
    if (jobRes.error) setError(jobRes.error.message);
    setJob(jobRes.data as Job);
    setContractors((contractorRes.data || []) as Contractor[]);
    setComplaints((complaintRes.data || []) as Complaint[]);
    if (!docRes.error) setDocuments((docRes.data || []) as JobDocument[]);
    if (!photoRes.error) setPhotos((photoRes.data || []) as JobPhoto[]);
    if (!financeRes.error) setFinanceItems((financeRes.data || []) as FinanceItem[]);
    if (!rateRes.error) setContractorRates((rateRes.data || []) as ContractorRate[]);
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

  async function addDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!job) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      job_id: job.id,
      contractor_id: job.selected_contractor_id,
      document_type: String(form.get("document_type") || "Other"),
      title: String(form.get("title") || "Document"),
      file_link: String(form.get("file_link") || "").trim() || null,
      signed: toBool(form.get("signed")),
      signed_by: String(form.get("signed_by") || "").trim() || null,
      signed_at: String(form.get("signed_at") || "") || null,
      start_work_consent: toBool(form.get("start_work_consent")),
      expiry_date: String(form.get("expiry_date") || "") || null,
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { error: insertError } = await supabase.from("job_documents").insert(payload);
    if (insertError) return setError(insertError.message);
    (event.currentTarget as HTMLFormElement).reset();
    setMessage("Document added to job record.");
    await load();
  }

  async function addPhoto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!job) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      job_id: job.id,
      contractor_id: job.selected_contractor_id,
      photo_stage: String(form.get("photo_stage") || "After"),
      title: String(form.get("title") || "").trim() || null,
      file_link: String(form.get("file_link") || "").trim(),
      submitted_by: String(form.get("submitted_by") || "").trim() || null,
      marketing_permission: toBool(form.get("marketing_permission")),
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { error: insertError } = await supabase.from("job_photos").insert(payload);
    if (insertError) return setError(insertError.message);
    (event.currentTarget as HTMLFormElement).reset();
    setMessage("Photo link added to job record.");
    await load();
  }

  async function addFinanceItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!job) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      job_id: job.id,
      lead_id: job.lead_id,
      item_type: String(form.get("item_type") || "Cost"),
      category: String(form.get("category") || "Other"),
      description: String(form.get("description") || "").trim() || null,
      amount: toMoney(form.get("amount")) || 0,
      due_date: String(form.get("due_date") || "") || null,
      paid_date: String(form.get("paid_date") || "") || null,
      payment_status: String(form.get("payment_status") || "Pending"),
      evidence_link: String(form.get("evidence_link") || "").trim() || null,
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { error: insertError } = await supabase.from("finance_items").insert(payload);
    if (insertError) return setError(insertError.message);
    (event.currentTarget as HTMLFormElement).reset();
    setMessage("Finance item added.");
    await load();
  }

  async function deleteJob() {
    if (!job) return;
    const confirmed = window.confirm("Delete this job? This cannot be undone. Linked documents, photo links, finance items, completion submissions and complaints for this job will also be removed where possible.");
    if (!confirmed) return;
    const typed = window.prompt("Type DELETE to confirm deleting this job.");
    if (typed !== "DELETE") {
      setMessage("Delete cancelled.");
      return;
    }

    const optionalDeletes = [
      supabase.from("job_documents").delete().eq("job_id", job.id),
      supabase.from("job_photos").delete().eq("job_id", job.id),
      supabase.from("finance_items").delete().eq("job_id", job.id),
      supabase.from("complaints").delete().eq("job_id", job.id),
      supabase.from("job_completion_submissions").delete().or(`job_id.eq.${job.id},linked_job_id.eq.${job.id}`),
    ];

    for (const request of optionalDeletes) {
      const { error: optionalError } = await request;
      if (optionalError && !(optionalError.message.includes("does not exist") || optionalError.message.includes("Could not find the table"))) {
        setError(optionalError.message);
        return;
      }
    }

    const { error: deleteError } = await supabase.from("jobs").delete().eq("id", job.id);
    if (deleteError) return setError(deleteError.message);
    router.push("/jobs");
  }

  if (error) return <div className="notice bad">{error}</div>;
  if (!job) return <div className="notice">Loading job…</div>;
  const currentJob = job;
  const activeContractors = contractors.filter((c) => c.contractor_status === "Active" || c.active_rota_approved);
  const canPay = contractorPaymentDue(currentJob);
  const openComplaints = complaints.filter((c) => c.complaint_status !== "Closed");
  const selectedContractor = contractors.find((c) => c.id === currentJob.selected_contractor_id);
  const selectedContractorRate = contractorRates.find((rate) => rate.contractor_id === currentJob.selected_contractor_id) || null;
  const suggestedContractorCost = estimatedRateForProperty(selectedContractorRate, currentJob.property_size);
  const completionFormLink = `/job-completion?${new URLSearchParams({
    job_id: currentJob.id,
    job_address: currentJob.job_address || "",
    contractor_name: selectedContractor?.name || "",
  }).toString()}`;

  const extraRevenue = financeItems.filter((i) => i.item_type === "Revenue").reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const extraCosts = financeItems.filter((i) => i.item_type === "Cost").reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalRevenue = Number(currentJob.customer_price || 0) + extraRevenue;
  const totalCosts = Number(currentJob.contractor_cost || 0) + extraCosts;

  async function copyCompletionLink() {
    const absolute = `${window.location.origin}${completionFormLink}`;
    await navigator.clipboard.writeText(absolute);
    setMessage("Contractor completion form link copied.");
  }

  async function copyDispatchMessage() {
    const absoluteCompletionLink = `${window.location.origin}${completionFormLink}`;
    const text = `Hi ${selectedContractor?.name || ""}, we have a job available.

Service: ${currentJob.service_needed || "Cleaning"}
Property: ${currentJob.property_size || "Property"}
Date: ${formatDate(currentJob.job_date)}
Arrival window: ${currentJob.arrival_window || "To confirm"}
Address: ${currentJob.job_address || "To confirm"}
Add-ons: ${currentJob.addons?.length ? currentJob.addons.join(", ") : "None"}
Access: ${currentJob.access_notes || "To confirm"}
Parking: ${currentJob.parking_notes || "To confirm"}
Your rate: ${formatCurrency(currentJob.contractor_cost || suggestedContractorCost)}

Please confirm whether you can accept this job. Before/after photos and the completion checklist are required after the clean. Completion form: ${absoluteCompletionLink}`;
    await navigator.clipboard.writeText(text);
    setMessage("Contractor dispatch message copied.");
  }

  return (
    <>
      <div className="page-head">
        <div><h1>{currentJob.customer_name}</h1><p>{currentJob.job_address || "No address"}</p></div>
        <div className="actions-row"><StatusBadge value={currentJob.job_status} /><StatusBadge value={currentJob.qa_status} />{canPay ? <StatusBadge value="Payment Due" /> : null}<Link className="button ghost" href="/jobs">Back</Link></div>
      </div>
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      {openComplaints.length > 0 ? <div className="notice bad" style={{ marginBottom: 16 }}>This job has an open complaint. Keep payment hold active until resolved.</div> : null}
      <div className="detail-layout">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Job details</h2>
          <div className="kv">
            <div><span>Date</span><strong>{formatDate(currentJob.job_date)}</strong></div>
            <div><span>Service</span><strong>{currentJob.service_needed || "—"}</strong></div>
            <div><span>Property</span><strong>{currentJob.property_size || "—"}</strong></div>
            <div><span>Add-ons</span><strong>{currentJob.addons?.join(", ") || "None"}</strong></div>
            <div><span>Customer price</span><strong>{formatCurrency(currentJob.customer_price)}</strong></div>
            <div><span>Contractor cost</span><strong>{formatCurrency(currentJob.contractor_cost)}</strong></div>
            <div><span>Extra revenue</span><strong>{formatCurrency(extraRevenue)}</strong></div>
            <div><span>Extra costs</span><strong>{formatCurrency(extraCosts)}</strong></div>
            <div><span>Total job profit</span><strong>{formatCurrency(totalRevenue - totalCosts)}</strong></div>
            <div><span>Customer paid</span><strong>{currentJob.customer_paid ? "Yes" : "No"}</strong></div>
            <div><span>Payment cleared</span><strong>{currentJob.payment_cleared ? "Yes" : "No"}</strong></div>
            <div><span>Completion form</span><strong>{currentJob.completion_form_submitted ? "Submitted" : "Not submitted"}</strong></div>
            <div><span>Property secured</span><strong>{currentJob.property_secured ? "Yes" : "No"}</strong></div>
            <div><span>Contractor paid</span><strong>{currentJob.contractor_paid ? "Yes" : "No"}</strong></div>
          </div>
          <div style={{ marginTop: 14 }}><MetricRow customerPrice={currentJob.customer_price} contractorCost={currentJob.contractor_cost} /></div>
          <h3>Photos / completion</h3>
          <div className="kv">
            <div><span>Before photos</span><strong>{currentJob.before_photos_link ? <a href={currentJob.before_photos_link} target="_blank">Open</a> : "—"}</strong></div>
            <div><span>After photos</span><strong>{currentJob.after_photos_link ? <a href={currentJob.after_photos_link} target="_blank">Open</a> : "—"}</strong></div>
          </div>
        </section>
        <aside className="card">
          <h2 style={{ marginTop: 0 }}>Operator actions</h2>
          <label>Assigned contractor<select value={currentJob.selected_contractor_id || ""} onChange={(e) => assignContractor(e.target.value)}><option value="">Not assigned</option>{activeContractors.map((c) => <option key={c.id} value={c.id}>{c.name} {c.rate_tier ? `(${c.rate_tier})` : ""}</option>)}</select></label>
          {selectedContractor ? <div className="notice" style={{ marginTop: 12 }}>
            <strong>{selectedContractor.name}</strong><br />
            Tier: {selectedContractor.rate_tier || "Unrated"} · Priority: {selectedContractor.fulfilment_priority || "Reserve"}<br />
            Suggested cost from rate card: {formatCurrency(suggestedContractorCost)}
            {suggestedContractorCost ? <button className="button ghost" style={{ marginTop: 10 }} onClick={() => update({ contractor_cost: suggestedContractorCost }, "Contractor cost applied from rate card.")}>Apply suggested cost</button> : null}
          </div> : null}
          <div className="actions-row" style={{ marginTop: 14 }}>
            <button className="button secondary" onClick={() => update({ contractor_confirmed: true, contractor_confirmation_time: new Date().toISOString(), job_status: "Contractor Assigned" }, "Contractor confirmed.")}>Contractor confirmed</button>
            <button className="button secondary" onClick={() => update({ job_status: "In Progress" }, "Job marked in progress.")}>In progress</button>
            <button className="button secondary" onClick={() => update({ completion_form_submitted: true, job_status: "Completed - Awaiting QA", qa_status: "Awaiting QA" }, "Completion received. QA required.")}>Completion received</button>
            <button className="button secondary" onClick={() => update({ property_secured: true }, "Property secured confirmed.")}>Property secured</button>
            <button className="button" onClick={() => update({ qa_status: "QA Approved", qa_checked_at: new Date().toISOString(), job_status: "Completed", payment_hold: false }, "QA approved.")}>QA approved</button>
            <button className="button ghost" onClick={() => update({ qa_status: "Re-clean Needed", payment_hold: true, job_status: "Completed - Awaiting QA" }, "Re-clean needed. Payment hold added.")}>Re-clean needed</button>
            <button className="button secondary" onClick={() => update({ customer_paid: true, payment_cleared: true, customer_payment_date: new Date().toISOString().slice(0,10) }, "Customer payment cleared.")}>Payment cleared</button>
            <button className="button" disabled={!canPay} onClick={() => update({ contractor_paid: true, contractor_payment_date: new Date().toISOString().slice(0,10) }, "Contractor marked paid.")}>Mark contractor paid</button>
            <Link className="button danger" href={`/complaints/new?job_id=${currentJob.id}`}>Log complaint</Link>
          </div>
          <div className="notice warn" style={{ marginTop: 14 }}>Contractor payment only becomes due after payment cleared, completion evidence submitted, QA approved, property secured and no unresolved issue.</div>
          <div className="notice" style={{ marginTop: 14 }}><strong>Contractor job completion form</strong><br />Send this job-specific link after the contractor is assigned.<br /><button className="button ghost" type="button" onClick={copyCompletionLink} style={{ marginTop: 10 }}>Copy completion form link</button><button className="button ghost" type="button" onClick={copyDispatchMessage} style={{ marginTop: 10 }}>Copy contractor dispatch message</button></div>
          <div className="notice bad" style={{ marginTop: 14 }}>
            <strong>Danger zone</strong><br />
            Delete this job only if it was created by mistake or is a duplicate. This removes linked internal records where possible.
            <button className="button danger full" type="button" style={{ marginTop: 10 }} onClick={deleteJob}>Delete job</button>
          </div>
        </aside>
      </div>

      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Documents</h2>
          <form className="form-grid" onSubmit={addDocument}>
            <label>Type<select name="document_type"><option>Customer Agreement</option><option>Contractor Agreement</option><option>Job Information Sheet</option><option>Quote / Booking Confirmation</option><option>Invoice</option><option>Receipt</option><option>Other</option></select></label>
            <label>Title<input name="title" required /></label>
            <label className="full">File link<input name="file_link" placeholder="Google Drive / Signable / PDF link" /></label>
            <label>Signed by<input name="signed_by" /></label>
            <label>Signed date<input name="signed_at" type="date" /></label>
            <label className="check-row"><input name="signed" type="checkbox" /> Signed?</label>
            <label className="check-row"><input name="start_work_consent" type="checkbox" /> Start-work consent?</label>
            <label className="full">Notes<textarea name="notes" /></label>
            <div className="full"><button className="button secondary" type="submit">Add document</button></div>
          </form>
          <div className="list" style={{ marginTop: 14 }}>{documents.map((doc) => <div className="card list-card" key={doc.id}><div className="list-top"><h3>{doc.title}</h3><StatusBadge value={doc.signed ? "Signed" : doc.document_type} /></div><div className="list-meta">{doc.file_link ? <a href={doc.file_link} target="_blank">Open</a> : null}<span>{formatDate(doc.signed_at || doc.created_at)}</span></div></div>)}</div>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Photo evidence</h2>
          <form className="form-grid" onSubmit={addPhoto}>
            <label>Stage<select name="photo_stage"><option>Before</option><option>After</option><option>Issue</option><option>Marketing</option></select></label>
            <label>Title<input name="title" /></label>
            <label className="full">Photo/folder link<input name="file_link" required placeholder="Google Drive/shared photo folder link" /></label>
            <label>Submitted by<input name="submitted_by" defaultValue={selectedContractor?.name || ""} /></label>
            <label className="check-row"><input name="marketing_permission" type="checkbox" /> Marketing permission?</label>
            <label className="full">Notes<textarea name="notes" /></label>
            <div className="full"><button className="button secondary" type="submit">Add photo link</button></div>
          </form>
          <div className="list" style={{ marginTop: 14 }}>{photos.map((photo) => <div className="card list-card" key={photo.id}><div className="list-top"><h3>{photo.title || photo.photo_stage}</h3><StatusBadge value={photo.photo_stage} /></div><div className="list-meta"><a href={photo.file_link} target="_blank">Open</a><span>{formatDate(photo.created_at)}</span></div></div>)}</div>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Finance items</h2>
          <form className="form-grid" onSubmit={addFinanceItem}>
            <label>Type<select name="item_type"><option>Cost</option><option>Revenue</option></select></label>
            <label>Category<input name="category" placeholder="Parking, materials, add-on, refund" /></label>
            <label>Amount<input name="amount" required inputMode="decimal" /></label>
            <label>Status<select name="payment_status"><option>Pending</option><option>Paid</option><option>Cleared</option><option>Hold</option></select></label>
            <label className="full">Evidence link<input name="evidence_link" /></label>
            <label className="full">Description<textarea name="description" /></label>
            <div className="full"><button className="button secondary" type="submit">Add item</button></div>
          </form>
          <div className="list" style={{ marginTop: 14 }}>{financeItems.map((item) => <div className="card list-card" key={item.id}><div className="list-top"><h3>{item.category}</h3><StatusBadge value={item.item_type} /></div><div className="list-meta"><span>{formatCurrency(item.amount)}</span><span>{item.payment_status}</span>{item.evidence_link ? <a href={item.evidence_link} target="_blank">Evidence</a> : null}</div></div>)}</div>
        </section>
      </div>
    </>
  );
}
