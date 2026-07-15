"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { CrmFormBlueprint } from "@/lib/types";
import { formBlueprintStatuses } from "@/lib/options";
import { toBool } from "@/lib/utils";

export default function FormBlueprintsPage() {
  const [forms, setForms] = useState<CrmFormBlueprint[]>([]);
  const [view, setView] = useState("All");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from("crm_form_blueprints").select("*").order("form_name", { ascending: true });
    if (fetchError) setError(fetchError.message);
    setForms((data || []) as CrmFormBlueprint[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => view === "All" ? forms : forms.filter((form) => form.form_type === view), [forms, view]);
  const formTypes = useMemo(() => Array.from(new Set(forms.map((form) => form.form_type).filter(Boolean))) as string[], [forms]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const id = String(form.get("id") || "");
    const payload = {
      form_key: String(form.get("form_key") || "").trim(),
      form_name: String(form.get("form_name") || "").trim(),
      form_type: String(form.get("form_type") || "Internal").trim() || null,
      linked_table: String(form.get("linked_table") || "").trim() || null,
      purpose: String(form.get("purpose") || "").trim() || null,
      required_fields: String(form.get("required_fields") || "").trim() || null,
      optional_fields: String(form.get("optional_fields") || "").trim() || null,
      status: String(form.get("status") || "Draft"),
      owner: String(form.get("owner") || "Dom").trim() || null,
      notes: String(form.get("notes") || "").trim() || null,
      active: toBool(form.get("active")),
    };
    if (!payload.form_key || !payload.form_name) return setError("Form key and form name are required.");
    const request = id ? supabase.from("crm_form_blueprints").update(payload).eq("id", id) : supabase.from("crm_form_blueprints").insert(payload);
    const { error: saveError } = await request;
    if (saveError) return setError(saveError.message);
    setMessage(id ? "Form spec updated." : "Form spec added.");
    (event.currentTarget as HTMLFormElement).reset();
    await load();
  }

  return (
    <>
      <div className="page-head">
        <div><h1>CRM Form Specs</h1><p>Blueprints for customer, contractor, job, QA, issue and review forms before live operation.</p></div>
        <div className="actions-row">
          {["All", ...formTypes].map((item) => <button key={item} className={`button ${view === item ? "" : "ghost"}`} onClick={() => setView(item)}>{item}</button>)}
        </div>
      </div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      {loading ? <div className="notice">Loading form specs…</div> : null}
      {filtered.length === 0 ? <EmptyState title="No form specs yet" body="Run migration 007 to seed the PDD form blueprint system." /> : (
        <div className="list" style={{ marginBottom: 18 }}>
          {filtered.map((item) => (
            <details className="card list-card" key={item.id} open={item.status !== "Ready"}>
              <summary className="list-top" style={{ cursor: "pointer" }}><h3>{item.form_name}</h3><div className="actions-row"><StatusBadge value={item.form_type} /><StatusBadge value={item.status} />{item.active ? null : <StatusBadge value="Inactive" />}</div></summary>
              <div className="list-meta"><span>Table: {item.linked_table || "—"}</span><span>Owner: {item.owner || "Dom"}</span></div>
              <p className="muted"><strong>Purpose:</strong> {item.purpose || "—"}</p>
              <p className="muted"><strong>Required fields:</strong> {item.required_fields || "—"}</p>
              <p className="muted"><strong>Optional fields:</strong> {item.optional_fields || "—"}</p>
              <form className="form-grid" onSubmit={save} style={{ marginTop: 14 }}>
                <input type="hidden" name="id" value={item.id} />
                <label>Form key<input name="form_key" defaultValue={item.form_key} /></label>
                <label>Form name<input name="form_name" defaultValue={item.form_name} /></label>
                <label>Form type<input name="form_type" defaultValue={item.form_type || "Internal"} /></label>
                <label>Linked table<input name="linked_table" defaultValue={item.linked_table || ""} /></label>
                <label>Status<select name="status" defaultValue={item.status || "Draft"}>{formBlueprintStatuses.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label>Owner<input name="owner" defaultValue={item.owner || "Dom"} /></label>
                <label className="full">Purpose<textarea name="purpose" defaultValue={item.purpose || ""} /></label>
                <label className="full">Required fields<textarea name="required_fields" defaultValue={item.required_fields || ""} /></label>
                <label className="full">Optional fields<textarea name="optional_fields" defaultValue={item.optional_fields || ""} /></label>
                <label className="check-row"><input name="active" type="checkbox" defaultChecked={item.active !== false} /> Active?</label>
                <label className="full">Notes<textarea name="notes" defaultValue={item.notes || ""} /></label>
                <div className="full"><button className="button secondary" type="submit">Save form spec</button></div>
              </form>
            </details>
          ))}
        </div>
      )}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Add form spec</h2>
        <form className="form-grid" onSubmit={save}>
          <label>Form key<input name="form_key" required /></label>
          <label>Form name<input name="form_name" required /></label>
          <label>Form type<input name="form_type" defaultValue="Internal" /></label>
          <label>Linked table<input name="linked_table" /></label>
          <label>Status<select name="status" defaultValue="Draft">{formBlueprintStatuses.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>Owner<input name="owner" defaultValue="Dom" /></label>
          <label className="full">Purpose<textarea name="purpose" /></label>
          <label className="full">Required fields<textarea name="required_fields" /></label>
          <label className="full">Optional fields<textarea name="optional_fields" /></label>
          <label className="check-row"><input name="active" type="checkbox" defaultChecked /> Active?</label>
          <label className="full">Notes<textarea name="notes" /></label>
          <div className="full"><button className="button" type="submit">Add form spec</button></div>
        </form>
      </section>
    </>
  );
}
