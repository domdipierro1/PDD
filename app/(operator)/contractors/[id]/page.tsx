"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Contractor, ContractorRate, Job } from "@/lib/types";
import { formatCurrency, formatDate, toBool, toMoney } from "@/lib/utils";
import { fulfilmentPriorities, rateDiscoveryStatuses, rateTiers } from "@/lib/options";
import { minimumCustomerPriceForMargin, suggestTier, targetContractorRates } from "@/lib/rates";

export default function ContractorDetailPage() {
  const params = useParams<{ id: string }>();
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [rates, setRates] = useState<ContractorRate[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [contractorRes, jobRes, rateRes] = await Promise.all([
      supabase.from("contractors").select("*").eq("id", params.id).single(),
      supabase.from("jobs").select("*").eq("selected_contractor_id", params.id).order("job_date", { ascending: false }),
      supabase.from("contractor_rates").select("*").eq("contractor_id", params.id).order("effective_from", { ascending: false }),
    ]);
    if (contractorRes.error) setError(contractorRes.error.message);
    setContractor(contractorRes.data as Contractor);
    setJobs((jobRes.data || []) as Job[]);
    setRates((rateRes.data || []) as ContractorRate[]);
  }

  useEffect(() => { load(); }, [params.id]);

  async function update(values: Record<string, unknown>, success: string) {
    if (!contractor) return;
    const { error: updateError } = await supabase.from("contractors").update(values).eq("id", contractor.id);
    if (updateError) return setError(updateError.message);
    setMessage(success);
    await load();
  }

  async function saveRateCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contractor) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      contractor_id: contractor.id,
      rate_card_signed: toBool(form.get("rate_card_signed")),
      effective_from: String(form.get("effective_from") || new Date().toISOString().slice(0, 10)),
      studio_rate: toMoney(form.get("studio_rate")),
      one_bed_rate: toMoney(form.get("one_bed_rate")),
      two_bed_rate: toMoney(form.get("two_bed_rate")),
      three_bed_rate: toMoney(form.get("three_bed_rate")),
      four_bed_rate: toMoney(form.get("four_bed_rate")),
      five_bed_plus_rate: toMoney(form.get("five_bed_plus_rate")),
      deep_clean_hourly_rate: toMoney(form.get("deep_clean_hourly_rate")),
      single_oven_rate: toMoney(form.get("single_oven_rate")),
      double_oven_rate: toMoney(form.get("double_oven_rate")),
      range_cooker_rate: toMoney(form.get("range_cooker_rate")),
      carpet_per_room_rate: toMoney(form.get("carpet_per_room_rate")),
      windows_flat_rate: toMoney(form.get("windows_flat_rate")),
      windows_house_rate: toMoney(form.get("windows_house_rate")),
      waste_small_load_rate: toMoney(form.get("waste_small_load_rate")),
      waste_quarter_van_rate: toMoney(form.get("waste_quarter_van_rate")),
      waste_half_van_rate: toMoney(form.get("waste_half_van_rate")),
      waste_full_van_rate: toMoney(form.get("waste_full_van_rate")),
      notes: String(form.get("notes") || "").trim() || null,
    };

    const { error: insertError } = await supabase.from("contractor_rates").insert(payload);
    if (insertError) return setError(insertError.message);

    const suggested = suggestTier(payload as ContractorRate);
    const updatePayload: Record<string, unknown> = {
      rate_card_signed: payload.rate_card_signed,
      rate_discovery_status: payload.rate_card_signed ? "Rate Card Agreed" : "Rates Received",
      rate_tier: suggested,
      fulfilment_priority: suggested === "Core" ? "First Choice" : suggested === "Premium Backup" ? "Backup" : "Reserve",
      rate_notes: payload.notes,
    };
    await supabase.from("contractors").update(updatePayload).eq("id", contractor.id);
    (event.currentTarget as HTMLFormElement).reset();
    setMessage("Rate card saved and contractor tier updated.");
    await load();
  }

  async function copyText(text: string, success: string) {
    await navigator.clipboard.writeText(text);
    setMessage(success);
  }

  if (error) return <div className="notice bad">{error}</div>;
  if (!contractor) return <div className="notice">Loading contractor…</div>;

  const latestRate = rates[0] || null;
  const autoTier = suggestTier(latestRate);
  const canActivate = Boolean(contractor.contractor_agreement_signed && contractor.rate_card_signed && contractor.insurance_certificate_uploaded && contractor.id_right_to_work_uploaded && contractor.test_job_status === "Passed");

  const rateQuestions = `Thanks. What would you normally charge for end of tenancy cleaning by property size?\n\nStudio\n1 Bed\n2 Bed\n3 Bed\n4 Bed+\n\nAnd what would you usually charge for deep cleaning per hour?`;
  const paidTrialMessage = `Thanks ${contractor.name}. Before I add anyone to the active rota, the first job is treated as a paid trial/live trial. I will confirm the job, scope and rate before you accept it. If it is completed to standard, with before/after photos, checklist submitted and no unresolved issue, I can then offer future jobs when available.`;

  const avgMarginGuide = latestRate
    ? [
      ["Studio", latestRate.studio_rate],
      ["1 Bed", latestRate.one_bed_rate],
      ["2 Bed", latestRate.two_bed_rate],
      ["3 Bed", latestRate.three_bed_rate],
    ].map(([label, cost]) => ({ label: String(label), cost: Number(cost || 0), minSell: minimumCustomerPriceForMargin(Number(cost || 0), 0.4) }))
    : [];

  return (
    <>
      <div className="page-head">
        <div><h1>{contractor.name}</h1><p>{contractor.phone || "No phone"} · {contractor.areas_covered || "No areas"}</p></div>
        <div className="actions-row"><StatusBadge value={contractor.contractor_status} /><StatusBadge value={contractor.rate_tier || autoTier} /><Link className="button ghost" href="/contractors">Back</Link></div>
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
            <button className="button secondary" onClick={() => update({ rate_card_signed: true, rate_discovery_status: "Rate Card Agreed" }, "Rate card marked signed.")}>Rate card signed</button>
            <button className="button secondary" onClick={() => update({ test_job_status: "Booked", contractor_status: "Test Job Needed" }, "Trial/live trial booked.")}>Trial job booked</button>
            <button className="button secondary" onClick={() => update({ test_job_status: "Passed", test_job_result: "Passed", contractor_status: "Test Job Passed" }, "Trial job passed.")}>Trial passed</button>
            <button className="button" disabled={!canActivate} onClick={() => update({ active_rota_approved: true, contractor_status: "Active" }, "Contractor activated.")}>Activate</button>
            <button className="button danger" onClick={() => update({ active_rota_approved: false, contractor_status: "Paused - Complaint" }, "Contractor paused.")}>Pause</button>
          </div>
          {!canActivate ? <div className="notice warn" style={{ marginTop: 14 }}>Do not activate until agreement, rate card, insurance, ID/right-to-work and trial/live trial are complete.</div> : null}
          <div className="notice" style={{ marginTop: 14 }}><strong>Copy messages</strong><br />
            <button className="button ghost" style={{ marginTop: 10 }} onClick={() => copyText(rateQuestions, "Rate question copied.")}>Copy rate question</button>
            <button className="button ghost" style={{ marginTop: 10 }} onClick={() => copyText(paidTrialMessage, "Paid trial message copied.")}>Copy paid trial message</button>
          </div>
        </aside>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Rate tiering</h2>
          <form className="form-grid" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); update({ rate_tier: String(form.get("rate_tier")), fulfilment_priority: String(form.get("fulfilment_priority")), rate_discovery_status: String(form.get("rate_discovery_status")), reliability_score: Number(form.get("reliability_score") || 0), quality_score: Number(form.get("quality_score") || 0), rate_notes: String(form.get("rate_notes") || "").trim() || null, last_contacted_at: String(form.get("last_contacted_at") || "") || null }, "Contractor tiering updated."); }}>
            <label>Rate tier<select name="rate_tier" defaultValue={contractor.rate_tier || autoTier}>{rateTiers.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Fulfilment priority<select name="fulfilment_priority" defaultValue={contractor.fulfilment_priority || "Reserve"}>{fulfilmentPriorities.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Rate discovery status<select name="rate_discovery_status" defaultValue={contractor.rate_discovery_status || "Ask Rates"}>{rateDiscoveryStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Last contacted<input name="last_contacted_at" type="date" defaultValue={contractor.last_contacted_at || ""} /></label>
            <label>Reliability score /5<input name="reliability_score" type="number" min="0" max="5" defaultValue={contractor.reliability_score || 0} /></label>
            <label>Quality score /5<input name="quality_score" type="number" min="0" max="5" defaultValue={contractor.quality_score || 0} /></label>
            <label className="full">Rate notes<textarea name="rate_notes" defaultValue={contractor.rate_notes || ""} placeholder="e.g. Wants £20 above target on EOT jobs, worth using when customer price supports it." /></label>
            <div className="full"><button className="button secondary" type="submit">Save tiering</button></div>
          </form>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Latest rate card</h2>
          {!latestRate ? <p className="help">No rates saved yet. Add the cleaner's quoted rates below.</p> : (
            <div className="kv">
              <div><span>Studio</span><strong>{formatCurrency(latestRate.studio_rate)} target {formatCurrency(targetContractorRates.studio_rate)}</strong></div>
              <div><span>1 Bed</span><strong>{formatCurrency(latestRate.one_bed_rate)} target {formatCurrency(targetContractorRates.one_bed_rate)}</strong></div>
              <div><span>2 Bed</span><strong>{formatCurrency(latestRate.two_bed_rate)} target {formatCurrency(targetContractorRates.two_bed_rate)}</strong></div>
              <div><span>3 Bed</span><strong>{formatCurrency(latestRate.three_bed_rate)} target {formatCurrency(targetContractorRates.three_bed_rate)}</strong></div>
              <div><span>Deep clean/hr</span><strong>{formatCurrency(latestRate.deep_clean_hourly_rate)} target {formatCurrency(targetContractorRates.deep_clean_hourly_rate)}</strong></div>
              <div><span>Suggested tier</span><strong>{autoTier}</strong></div>
            </div>
          )}
          {avgMarginGuide.length ? <><h3>Minimum customer price guide for ~40% margin</h3><div className="kv">{avgMarginGuide.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.cost ? formatCurrency(row.minSell) : "—"}</strong></div>)}</div></> : null}
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Add / update quoted rates</h2>
        <form className="form-grid" onSubmit={saveRateCard}>
          <label>Effective from<input name="effective_from" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
          <label className="check-row"><input name="rate_card_signed" type="checkbox" /> Rate card signed/agreed?</label>
          <label>Studio<input name="studio_rate" inputMode="decimal" placeholder="60" /></label>
          <label>1 Bed<input name="one_bed_rate" inputMode="decimal" placeholder="100" /></label>
          <label>2 Bed<input name="two_bed_rate" inputMode="decimal" placeholder="160" /></label>
          <label>3 Bed<input name="three_bed_rate" inputMode="decimal" placeholder="200" /></label>
          <label>4 Bed<input name="four_bed_rate" inputMode="decimal" placeholder="320" /></label>
          <label>5 Bed+<input name="five_bed_plus_rate" inputMode="decimal" placeholder="Agreed per job" /></label>
          <label>Deep clean hourly<input name="deep_clean_hourly_rate" inputMode="decimal" placeholder="20" /></label>
          <label>Single oven<input name="single_oven_rate" inputMode="decimal" placeholder="35" /></label>
          <label>Double oven<input name="double_oven_rate" inputMode="decimal" placeholder="55" /></label>
          <label>Range cooker<input name="range_cooker_rate" inputMode="decimal" placeholder="75" /></label>
          <label>Carpet per room<input name="carpet_per_room_rate" inputMode="decimal" /></label>
          <label>Windows flat<input name="windows_flat_rate" inputMode="decimal" /></label>
          <label>Windows house<input name="windows_house_rate" inputMode="decimal" /></label>
          <label>Waste small load<input name="waste_small_load_rate" inputMode="decimal" /></label>
          <label>Waste quarter van<input name="waste_quarter_van_rate" inputMode="decimal" /></label>
          <label>Waste half van<input name="waste_half_van_rate" inputMode="decimal" /></label>
          <label>Waste full van<input name="waste_full_van_rate" inputMode="decimal" /></label>
          <label className="full">Rate notes<textarea name="notes" placeholder="What they asked for, flexibility, parking, equipment, conditions, etc." /></label>
          <div className="full"><button className="button" type="submit">Save rate card</button></div>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Assigned jobs</h2>
        {jobs.length === 0 ? <p className="help">No jobs assigned yet.</p> : <div className="list">{jobs.map((job) => <Link className="card list-card" href={`/jobs/${job.id}`} key={job.id}><div className="list-top"><h3>{job.customer_name}</h3><StatusBadge value={job.job_status} /></div><div className="list-meta"><span>{formatDate(job.job_date)}</span><span>{job.service_needed}</span><span>{job.postcode}</span></div></Link>)}</div>}
      </section>
    </>
  );
}
