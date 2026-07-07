"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { AgentOutreach } from "@/lib/types";
import { agentStatuses } from "@/lib/options";
import { formatDate, toBool } from "@/lib/utils";

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentOutreach[]>([]);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    const { data, error: fetchError } = await supabase.from("agent_outreach").select("*").order("created_at", { ascending: false });
    if (fetchError) setError(fetchError.message);
    setAgents((data || []) as AgentOutreach[]);
  }
  useEffect(() => { load(); }, []);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      agency: String(form.get("agency") || "").trim(),
      contact_name: String(form.get("contact_name") || "").trim() || null,
      phone: String(form.get("phone") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      area: String(form.get("area") || "").trim() || null,
      status: String(form.get("status") || "Not Contacted"),
      last_contact_date: String(form.get("last_contact_date") || "") || null,
      next_follow_up_date: String(form.get("next_follow_up_date") || "") || null,
      pitch_sent: toBool(form.get("pitch_sent")),
      pricing_sent: toBool(form.get("pricing_sent")),
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { error: insertError } = await supabase.from("agent_outreach").insert(payload);
    if (insertError) return setError(insertError.message);
    event.currentTarget.reset();
    await load();
  }
  return (
    <>
      <div className="page-head"><div><h1>Agent Outreach</h1><p>Track letting agents and property managers once proof/reviews are ready.</p></div></div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      <div className="detail-layout">
        <form className="card form-grid" onSubmit={onSubmit}>
          <h2 className="full" style={{ margin: 0 }}>Add agency</h2>
          <label>Agency<input name="agency" required /></label>
          <label>Contact name<input name="contact_name" /></label>
          <label>Phone<input name="phone" /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Area<input name="area" /></label>
          <label>Status<select name="status">{agentStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Last contact<input name="last_contact_date" type="date" /></label>
          <label>Next follow up<input name="next_follow_up_date" type="date" /></label>
          <label><span>Pitch sent?</span><input name="pitch_sent" type="checkbox" /></label>
          <label><span>Pricing sent?</span><input name="pricing_sent" type="checkbox" /></label>
          <label className="full">Notes<textarea name="notes" /></label>
          <button className="button full">Save agency</button>
        </form>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Pipeline</h2>
          {agents.length === 0 ? <EmptyState title="No agents yet" body="Start this after you have basic proof, reviews or test-job photos." /> : <div className="list">{agents.map((agent) => <div className="card list-card" key={agent.id}><div className="list-top"><h3>{agent.agency}</h3><StatusBadge value={agent.status} /></div><div className="list-meta"><span>{agent.contact_name || "No contact"}</span><span>{agent.area}</span><span>Follow up: {formatDate(agent.next_follow_up_date)}</span></div><p className="help">{agent.notes}</p></div>)}</div>}
        </section>
      </div>
    </>
  );
}
