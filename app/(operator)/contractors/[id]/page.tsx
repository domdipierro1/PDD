"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Contractor, Job } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ContractorDetailPage() {
  const params = useParams<{ id: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [contractorRes, jobRes] = await Promise.all([
      supabase.from("contractors").select("*").eq("id", params.id).single(),
      supabase.from("jobs").select("*").eq("selected_contractor_id", params.id).order("job_date", { ascending: false }),
    ]);
    if (contractorRes.error) setError(contractorRes.error.message);
    setContractor(contractorRes.data as Contractor);
    setJobs((jobRes.data || []) as Job[]);
  }

  useEffect(() => { load(); }, [params.id]);

  async function update(values: Record<string, unknown>, success: string) {
    if (!contractor) return;
    const { error: updateError } = await supabase.from("contractors").update(values).eq("id", contractor.id);
    if (updateError) return setError(updateError.message);
    setMessage(success);
    await load();
  }

  if (error) return <div className="notice bad">{error}</div>;
  if (!contractor) return <div className="notice">Loading contractor…</div>;

  const canActivate = Boolean(contractor.contractor_agreement_signed && contractor.rate_card_signed && contractor.insurance_certificate_uploaded && contractor.id_right_to_work_uploaded && contractor.test_job_status === "Passed");

  return (
    <>
      <div className="page-head">
        <div><h1>{contractor.name}</h1><p>{contractor.phone || "No phone"} · {contractor.areas_covered || "No areas"}</p></div>
        <div className="actions-row"><StatusBadge value={contractor.contractor_status} /><Link className="button ghost" href="/contractors">Back</Link></div>
      </div>
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      <div className="detail-layout">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Compliance checklist</h2>
          <div className="kv">
            <div><span>Agreement signed</span><strong>{contractor.contractor_agreement_signed ? "Yes" : "No"}</strong></div>
            <div><span>Rate card signed</span><strong>{contractor.rate_card_signed ? "Yes" : "No"}</strong></div>
            <div><span>Insurance uploaded</span><strong>{contractor.insurance_certificate_uploaded ? "Yes" : "No"}</strong></div>
            <div><span>Insurance expiry</span><strong>{formatDate(contractor.insurance_expiry_date)}</strong></div>
            <div><span>ID/right-to-work uploaded</span><strong>{contractor.id_right_to_work_uploaded ? "Yes" : "No"}</strong></div>
            <div><span>Test job status</span><strong>{contractor.test_job_status || "—"}</strong></div>
            <div><span>Active rota approved</span><strong>{contractor.active_rota_approved ? "Yes" : "No"}</strong></div>
            <div><span>HMRC status</span><strong>{contractor.hmrc_status || "—"}</strong></div>
            <div><span>DBS status</span><strong>{contractor.dbs_status || "—"}</strong></div>
          </div>
          <h3>Notes</h3>
          <p className="help">{contractor.notes || "No notes yet."}</p>
        </section>
        <aside className="card">
          <h2 style={{ marginTop: 0 }}>Actions</h2>
          <div className="actions-row">
            <button className="button secondary" onClick={() => update({ contractor_status: "Docs Requested" }, "Docs requested.")}>Docs requested</button>
            <button className="button secondary" onClick={() => update({ contractor_status: "Docs Received", insurance_certificate_uploaded: true, id_right_to_work_uploaded: true }, "Docs received.")}>Docs received</button>
            <button className="button secondary" onClick={() => update({ contractor_agreement_signed: true, contractor_status: "Agreement Signed" }, "Agreement marked signed.")}>Agreement signed</button>
            <button className="button secondary" onClick={() => update({ rate_card_signed: true }, "Rate card marked signed.")}>Rate card signed</button>
            <button className="button secondary" onClick={() => update({ test_job_status: "Booked", contractor_status: "Test Job Needed" }, "Test job booked.")}>Test job booked</button>
            <button className="button secondary" onClick={() => update({ test_job_status: "Passed", test_job_result: "Passed", contractor_status: "Test Job Passed" }, "Test job passed.")}>Test job passed</button>
            <button className="button" disabled={!canActivate} onClick={() => update({ active_rota_approved: true, contractor_status: "Active" }, "Contractor activated.")}>Activate</button>
            <button className="button danger" onClick={() => update({ active_rota_approved: false, contractor_status: "Paused - Complaint" }, "Contractor paused.")}>Pause</button>
          </div>
          {!canActivate ? <div className="notice warn" style={{ marginTop: 14 }}>Do not activate until agreement, rate card, insurance, ID/right-to-work and test job are complete.</div> : null}
        </aside>
      </div>
      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Assigned jobs</h2>
        {jobs.length === 0 ? <p className="help">No jobs assigned yet.</p> : <div className="list">{jobs.map((job) => <Link className="card list-card" href={`/jobs/${job.id}`} key={job.id}><div className="list-top"><h3>{job.customer_name}</h3><StatusBadge value={job.job_status} /></div><div className="list-meta"><span>{formatDate(job.job_date)}</span><span>{job.service_needed}</span><span>{job.postcode}</span></div></Link>)}</div>}
      </section>
    </>
  );
}
