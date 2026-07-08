"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { MetricRow } from "@/components/metric-row";
import { supabase } from "@/lib/supabase";
import type { Lead, Contractor } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { quoteMessage, suggestedBaseQuote } from "@/lib/quote";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [leadRes, contractorRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", params.id).single(),
      supabase.from("contractors").select("*").order("name", { ascending: true }),
    ]);
    if (leadRes.error) setError(leadRes.error.message);
    setLead(leadRes.data as Lead);
    setContractors((contractorRes.data || []) as Contractor[]);
  }

  useEffect(() => { load(); }, [params.id]);

  async function setStatus(status: string, extra: Record<string, unknown> = {}) {
    if (!lead) return;
    const { error: updateError } = await supabase.from("leads").update({ quote_status: status, ...extra }).eq("id", lead.id);
    if (updateError) return setError(updateError.message);
    setMessage(`Lead marked ${status}.`);
    await load();
  }

  async function assignContractor(contractorId: string) {
    if (!lead) return;
    const { error: updateError } = await supabase.from("leads").update({ selected_contractor_id: contractorId || null }).eq("id", lead.id);
    if (updateError) return setError(updateError.message);
    await load();
  }

  async function deleteLead() {
    if (!lead) return;
    const confirmed = window.confirm("Delete this lead? This cannot be undone. Any job already created from this lead will stay in Jobs, but it will no longer be linked to this lead.");
    if (!confirmed) return;
    const typed = window.prompt("Type DELETE to confirm deleting this lead.");
    if (typed !== "DELETE") {
      setMessage("Delete cancelled.");
      return;
    }

    const optionalDeletes = [
      supabase.from("job_documents").delete().eq("lead_id", lead.id),
      supabase.from("finance_items").delete().eq("lead_id", lead.id),
    ];

    for (const request of optionalDeletes) {
      const { error: optionalError } = await request;
      if (optionalError && !(optionalError.message.includes("does not exist") || optionalError.message.includes("Could not find the table"))) {
        setError(optionalError.message);
        return;
      }
    }

    const { error: deleteError } = await supabase.from("leads").delete().eq("id", lead.id);
    if (deleteError) return setError(deleteError.message);
    router.push("/leads");
  }

  async function convertToJob() {
    if (!lead) return;
    const payload = {
      lead_id: lead.id,
      customer_name: lead.customer_name,
      customer_phone: lead.phone,
      customer_email: lead.email,
      job_address: lead.address,
      postcode: lead.postcode,
      property_size: lead.property_size,
      service_needed: lead.service_needed,
      addons: lead.addons || [],
      job_date: lead.preferred_date,
      access_notes: lead.access_notes,
      parking_notes: lead.parking_notes,
      selected_contractor_id: lead.selected_contractor_id,
      job_status: lead.selected_contractor_id ? "Contractor Assigned" : "Contractor Needed",
      qa_status: "Not Started",
      customer_price: lead.customer_quote || lead.suggested_customer_quote || null,
      contractor_cost: lead.contractor_cost_estimate,
      notes: lead.notes,
    };
    const { data, error: insertError } = await supabase.from("jobs").insert(payload).select("id").single();
    if (insertError) return setError(insertError.message);
    await setStatus("Accepted");
    router.push(`/jobs/${data?.id}`);
  }

  if (error) return <div className="notice bad">{error}</div>;
  if (!lead) return <div className="notice">Loading lead…</div>;

  const activeContractors = contractors.filter((c) => c.contractor_status === "Active" || c.active_rota_approved);

  return (
    <>
      <div className="page-head">
        <div><h1>{lead.customer_name}</h1><p>{lead.phone || "No phone"} · {lead.postcode || "No postcode"}</p></div>
        <div className="actions-row"><StatusBadge value={lead.quote_status} /><Link className="button ghost" href="/leads">Back</Link></div>
      </div>
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      <div className="detail-layout">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Lead details</h2>
          <div className="kv">
            <div><span>Service</span><strong>{lead.service_needed || "—"}</strong></div>
            <div><span>Property size</span><strong>{lead.property_size || "—"}</strong></div>
            <div><span>Preferred date</span><strong>{formatDate(lead.preferred_date)}</strong></div>
            <div><span>Address</span><strong>{lead.address || "—"}</strong></div>
            <div><span>Add-ons</span><strong>{lead.addons?.join(", ") || "None"}</strong></div>
            <div><span>Suggested quote</span><strong>{formatCurrency(lead.suggested_customer_quote || suggestedBaseQuote(lead.property_size))}</strong></div>
            <div><span>Customer quote</span><strong>{formatCurrency(lead.customer_quote)}</strong></div>
            <div><span>Contractor estimate</span><strong>{formatCurrency(lead.contractor_cost_estimate)}</strong></div>
          </div>
          <div style={{ marginTop: 14 }}><MetricRow customerPrice={lead.customer_quote || lead.suggested_customer_quote} contractorCost={lead.contractor_cost_estimate} /></div>
          <h3>Generated quote message</h3>
          <textarea readOnly value={quoteMessage(lead)} style={{ minHeight: 150 }} />
          <div className="actions-row" style={{ marginTop: 12 }}>
            <button className="button" onClick={() => navigator.clipboard.writeText(quoteMessage(lead)).then(() => setMessage("Quote message copied."))}>Copy quote message</button>
            <button className="button secondary" onClick={() => setStatus("Quote Sent", { quote_sent_at: new Date().toISOString() })}>Mark quote sent</button>
            <button className="button secondary" onClick={() => setStatus("Follow Up Needed", { follow_up_date: new Date(Date.now() + 86400000).toISOString().slice(0,10) })}>Follow up tomorrow</button>
            <button className="button ghost" onClick={() => setStatus("Lost")}>Mark lost</button>
          </div>
        </section>
        <aside className="card">
          <h2 style={{ marginTop: 0 }}>Convert to job</h2>
          <label>Suggested contractor<select value={lead.selected_contractor_id || ""} onChange={(e) => assignContractor(e.target.value)}><option value="">Not assigned yet</option>{activeContractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <div className="notice warn" style={{ marginTop: 14 }}>Do not confirm a live job to the customer until contractor availability is confirmed.</div>
          <button className="button full" style={{ marginTop: 14 }} onClick={convertToJob}>Create job from lead</button>
          <Link className="button ghost full" style={{ marginTop: 10 }} href="/contractors/new">Add contractor</Link>
          <div className="notice bad" style={{ marginTop: 14 }}>
            <strong>Danger zone</strong><br />
            Delete this lead only if it was created by mistake or is a duplicate. Jobs already created from this lead will stay in Jobs.
            <button className="button danger full" type="button" style={{ marginTop: 10 }} onClick={deleteLead}>Delete lead</button>
          </div>
        </aside>
      </div>
    </>
  );
}
