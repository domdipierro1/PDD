"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { LaunchChecklistItem } from "@/lib/types";
import { launchPriorities, launchStatuses } from "@/lib/options";
import { formatDate, toBool } from "@/lib/utils";

const categories = [
  "Company setup",
  "Banking",
  "Stripe/payments",
  "Insurance",
  "ICO/data protection",
  "Solicitor/contracts",
  "Google Business Profile",
  "Contractor onboarding",
  "Test clean",
  "CRM/app workflow",
  "Customer templates",
  "Contractor templates",
  "Review process",
  "Soft launch readiness",
];

export default function LaunchChecklistPage() {
  const [items, setItems] = useState<LaunchChecklistItem[]>([]);
  const [filter, setFilter] = useState("Launch blockers");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from("launch_checklist").select("*").order("id", { ascending: true });
    if (fetchError) setError(fetchError.message);
    setItems((data || []) as LaunchChecklistItem[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const id = String(form.get("id") || "").trim();
    const payload = {
      id,
      task: String(form.get("task") || "").trim(),
      category: String(form.get("category") || "Soft launch readiness"),
      priority: String(form.get("priority") || "High"),
      status: String(form.get("status") || "Not Started"),
      due_date: String(form.get("due_date") || "") || null,
      owner: String(form.get("owner") || "Dom").trim() || "Dom",
      notes: String(form.get("notes") || "").trim() || null,
      evidence_link: String(form.get("evidence_link") || "").trim() || null,
      required_before_live: toBool(form.get("required_before_live")),
      blocker: String(form.get("status") || "") === "Blocked",
      blocks_launch: toBool(form.get("blocks_launch")),
      details: String(form.get("details") || "").trim() || null,
    };
    const { error: upsertError } = await supabase.from("launch_checklist").upsert(payload);
    if (upsertError) return setError(upsertError.message);
    setMessage("Checklist item saved.");
    (event.currentTarget as HTMLFormElement).reset();
    await load();
  }

  const launchBlockers = items.filter((item) => (item.blocks_launch ?? item.required_before_live) && item.status !== "Done");
  const blocked = items.filter((item) => item.status === "Blocked" || item.blocker);
  const filtered = useMemo(() => {
    if (filter === "All") return items;
    if (filter === "Launch blockers") return launchBlockers;
    if (filter === "Blocked") return blocked;
    if (filter === "Done") return items.filter((item) => item.status === "Done");
    return items.filter((item) => item.category === filter);
  }, [filter, items, launchBlockers, blocked]);

  return (
    <>
      <div className="page-head"><div><h1>Launch Setup Checklist</h1><p>{launchBlockers.length} launch-blocking item{launchBlockers.length === 1 ? "" : "s"} still not done before live operation.</p></div></div>
      <div className="actions-row" style={{ marginBottom: 16 }}>{["Launch blockers", "Blocked", "All", "Done", ...categories].map((item) => <button key={item} className={`button ${filter === item ? "" : "ghost"}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      {loading ? <div className="notice">Loading launch checklist…</div> : null}
      <div className="grid grid-3" style={{ marginBottom: 18 }}>
        <div className="card"><h3>Launch blockers</h3><strong style={{ fontSize: 30 }}>{launchBlockers.length}</strong><p className="help">Items blocking live operation.</p></div>
        <div className="card"><h3>Blocked</h3><strong style={{ fontSize: 30 }}>{blocked.length}</strong><p className="help">Items requiring external input.</p></div>
        <div className="card"><h3>Done</h3><strong style={{ fontSize: 30 }}>{items.filter((i) => i.status === "Done").length}</strong><p className="help">Completed setup tasks.</p></div>
      </div>

      {filtered.length === 0 ? <EmptyState title="No checklist items in this view" body="Switch filter or add a new setup item below." /> : (
        <div className="list" style={{ marginBottom: 18 }}>
          {filtered.map((item) => (
            <details className="card list-card" key={item.id} open={Boolean(item.blocks_launch ?? item.required_before_live) && item.status !== "Done"}>
              <summary className="list-top" style={{ cursor: "pointer" }}><h3>{item.task}</h3><div className="actions-row"><StatusBadge value={item.status} /><StatusBadge value={item.priority || "High"} />{(item.blocks_launch ?? item.required_before_live) ? <StatusBadge value="Blocks launch" /> : null}</div></summary>
              <div className="list-meta"><span>{item.category}</span><span>Owner: {item.owner || "Dom"}</span><span>Due: {formatDate(item.due_date)}</span>{item.evidence_link ? <a href={item.evidence_link} target="_blank">Evidence</a> : null}</div>
              <p className="help">{item.details || item.notes || "No details."}</p>
              <form className="form-grid" onSubmit={save} style={{ marginTop: 14 }}>
                <input type="hidden" name="id" value={item.id} />
                <label>Task<input name="task" defaultValue={item.task} /></label>
                <label>Category<select name="category" defaultValue={item.category || "Soft launch readiness"}>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
                <label>Priority<select name="priority" defaultValue={item.priority || "High"}>{launchPriorities.map((p) => <option key={p}>{p}</option>)}</select></label>
                <label>Status<select name="status" defaultValue={item.status || "Not Started"}>{launchStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                <label>Due date<input name="due_date" type="date" defaultValue={item.due_date || ""} /></label>
                <label>Owner<input name="owner" defaultValue={item.owner || "Dom"} /></label>
                <label className="check-row"><input name="required_before_live" type="checkbox" defaultChecked={Boolean(item.required_before_live)} /> Required before live?</label>
                <label className="check-row"><input name="blocks_launch" type="checkbox" defaultChecked={Boolean(item.blocks_launch ?? item.required_before_live)} /> Blocks launch?</label>
                <label className="full">Evidence/link<input name="evidence_link" defaultValue={item.evidence_link || ""} /></label>
                <label className="full">Details<textarea name="details" defaultValue={item.details || ""} /></label>
                <label className="full">Notes<textarea name="notes" defaultValue={item.notes || ""} /></label>
                <div className="full"><button className="button secondary" type="submit">Save item</button></div>
              </form>
            </details>
          ))}
        </div>
      )}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Add setup item</h2>
        <form className="form-grid" onSubmit={save}>
          <label>ID<input name="id" required placeholder="LS-019" /></label>
          <label>Task<input name="task" required /></label>
          <label>Category<select name="category">{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label>Priority<select name="priority">{launchPriorities.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Status<select name="status">{launchStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label>Due date<input name="due_date" type="date" /></label>
          <label>Owner<input name="owner" defaultValue="Dom" /></label>
          <label className="check-row"><input name="required_before_live" type="checkbox" defaultChecked /> Required before live?</label>
          <label className="check-row"><input name="blocks_launch" type="checkbox" defaultChecked /> Blocks launch?</label>
          <label className="full">Evidence/link<input name="evidence_link" /></label>
          <label className="full">Details<textarea name="details" /></label>
          <label className="full">Notes<textarea name="notes" /></label>
          <div className="full"><button className="button" type="submit">Add setup item</button></div>
        </form>
      </section>
    </>
  );
}
