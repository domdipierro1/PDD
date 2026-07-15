"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Contractor, TestClean } from "@/lib/types";
import { testCleanDecisions } from "@/lib/options";
import { formatCurrency, formatDate, toBool, toMoney } from "@/lib/utils";

export default function TestCleansPage() {
  const [testCleans, setTestCleans] = useState<TestClean[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [testRes, contractorRes] = await Promise.all([
      supabase.from("test_cleans").select("*").order("scheduled_at", { ascending: false }),
      supabase.from("contractors").select("*").order("name", { ascending: true }),
    ]);
    if (testRes.error) setError(testRes.error.message);
    setTestCleans((testRes.data || []) as TestClean[]);
    setContractors((contractorRes.data || []) as Contractor[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const contractorId = String(form.get("contractor_id") || "") || null;
    const selected = contractors.find((c) => c.id === contractorId);
    const payload = {
      contractor_id: contractorId,
      contractor_name: selected?.name || String(form.get("contractor_name") || "").trim() || null,
      test_clean_address: String(form.get("test_clean_address") || "").trim() || null,
      test_clean_type: String(form.get("test_clean_type") || "").trim() || null,
      scheduled_at: String(form.get("scheduled_at") || "") || null,
      agreed_test_fee: toMoney(form.get("agreed_test_fee")),
      checklist_sent: toBool(form.get("checklist_sent")),
      before_photos_received: toBool(form.get("before_photos_received")),
      after_photos_received: toBool(form.get("after_photos_received")),
      completion_form_received: toBool(form.get("completion_form_received")),
      quality_score: form.get("quality_score") ? Number(form.get("quality_score")) : null,
      communication_score: form.get("communication_score") ? Number(form.get("communication_score")) : null,
      punctuality_score: form.get("punctuality_score") ? Number(form.get("punctuality_score")) : null,
      passed: toBool(form.get("passed")),
      active_approval_decision: String(form.get("active_approval_decision") || "Pending"),
      notes: String(form.get("notes") || "").trim() || null,
      evidence_link: String(form.get("evidence_link") || "").trim() || null,
    };
    const { data, error: insertError } = await supabase.from("test_cleans").insert(payload).select("id").single();
    if (insertError) return setError(insertError.message);
    if (payload.passed && contractorId) {
      await supabase.from("contractors").update({ test_job_status: "Passed", test_job_result: "Passed", contractor_status: "Test Job Passed" }).eq("id", contractorId);
    }
    (event.currentTarget as HTMLFormElement).reset();
    setMessage(`Test clean saved${data?.id ? "." : "."}`);
    await load();
  }

  async function markPassed(row: TestClean) {
    const { error: updateError } = await supabase.from("test_cleans").update({ passed: true, active_approval_decision: "Approved Active" }).eq("id", row.id);
    if (updateError) return setError(updateError.message);
    if (row.contractor_id) await supabase.from("contractors").update({ test_job_status: "Passed", test_job_result: "Passed", contractor_status: "Test Job Passed" }).eq("id", row.contractor_id);
    setMessage("Test clean passed and contractor updated.");
    await load();
  }

  const pending = useMemo(() => testCleans.filter((row) => !row.passed), [testCleans]);

  return (
    <>
      <div className="page-head"><div><h1>Test Cleans</h1><p>{pending.length} contractor test clean{pending.length === 1 ? "" : "s"} not passed yet.</p></div></div>
      <div className="notice warn" style={{ marginBottom: 16 }}>Do not approve a contractor for the active rota until test/live trial quality, communication, punctuality, photos, completion form and checklist are acceptable.</div>
      {loading ? <div className="notice">Loading test cleans…</div> : null}
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}

      <section className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0 }}>Add test clean</h2>
        <form className="form-grid" onSubmit={save}>
          <label>Contractor<select name="contractor_id"><option value="">Select contractor</option>{contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label>Contractor name if not in CRM<input name="contractor_name" /></label>
          <label className="full">Test clean address/type<input name="test_clean_address" placeholder="Address or internal/test property" /></label>
          <label>Type<input name="test_clean_type" placeholder="EOT / deep clean / after builders" /></label>
          <label>Date/time<input name="scheduled_at" type="datetime-local" /></label>
          <label>Agreed test fee<input name="agreed_test_fee" inputMode="decimal" placeholder="80" /></label>
          <label>Quality score 1–10<input name="quality_score" type="number" min="1" max="10" /></label>
          <label>Communication score 1–10<input name="communication_score" type="number" min="1" max="10" /></label>
          <label>Punctuality score 1–10<input name="punctuality_score" type="number" min="1" max="10" /></label>
          <label>Active approval decision<select name="active_approval_decision" defaultValue="Pending">{testCleanDecisions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="check-row"><input name="checklist_sent" type="checkbox" /> Checklist sent?</label>
          <label className="check-row"><input name="before_photos_received" type="checkbox" /> Before photos received?</label>
          <label className="check-row"><input name="after_photos_received" type="checkbox" /> After photos received?</label>
          <label className="check-row"><input name="completion_form_received" type="checkbox" /> Completion form received?</label>
          <label className="check-row"><input name="passed" type="checkbox" /> Passed?</label>
          <label className="full">Evidence link<input name="evidence_link" /></label>
          <label className="full">Notes<textarea name="notes" /></label>
          <div className="full"><button className="button" type="submit">Save test clean</button></div>
        </form>
      </section>

      {testCleans.length === 0 ? <EmptyState title="No test cleans yet" body="Create test/live trial records before marking contractors active." /> : (
        <div className="list">
          {testCleans.map((row) => (
            <div className="card list-card" key={row.id}>
              <div className="list-top"><h3>{row.contractor_name || "Unnamed contractor"}</h3><div className="actions-row"><StatusBadge value={row.passed ? "Passed" : "Pending"} /><StatusBadge value={row.active_approval_decision || "Pending"} /></div></div>
              <div className="list-meta"><span>{formatDate(row.scheduled_at)}</span><span>{row.test_clean_type || "—"}</span><span>{formatCurrency(row.agreed_test_fee)}</span>{row.contractor_id ? <Link href={`/contractors/${row.contractor_id}`}>Open contractor</Link> : null}{row.evidence_link ? <a href={row.evidence_link} target="_blank">Evidence</a> : null}</div>
              <div className="metric-row"><span>Quality <strong>{row.quality_score || "—"}</strong></span><span>Comms <strong>{row.communication_score || "—"}</strong></span><span>Punctuality <strong>{row.punctuality_score || "—"}</strong></span><span>Photos <strong>{row.before_photos_received && row.after_photos_received ? "Yes" : "No"}</strong></span></div>
              <p className="help">{row.notes || "No notes."}</p>
              {!row.passed ? <button className="button secondary" onClick={() => markPassed(row)}>Mark passed</button> : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
