"use client";

import { FormEvent, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { LegalDocumentChecklist } from "@/lib/types";
import { legalDocumentStatuses } from "@/lib/options";
import { formatDate, toBool } from "@/lib/utils";

const seedDocs = [
  "Contractor Agreement",
  "Contractor Rate Card",
  "Contractor Onboarding Declaration",
  "Customer Booking Terms",
  "Privacy Policy",
  "Complaint/Re-clean Policy",
  "Key/Access Policy",
  "Payment/Cancellation Terms",
];

export default function LegalDocsPage() {
  const [docs, setDocs] = useState<LegalDocumentChecklist[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from("legal_documents_checklist").select("*").order("document_name", { ascending: true });
    if (fetchError) setError(fetchError.message);
    setDocs((data || []) as LegalDocumentChecklist[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function quickSeed() {
    const payload = seedDocs.map((document_name) => ({ document_name, current_version: "Draft v1", status: "Draft", solicitor_review_needed: true, launch_blocker: true }));
    const { error: upsertError } = await supabase.from("legal_documents_checklist").upsert(payload, { onConflict: "document_name" });
    if (upsertError) return setError(upsertError.message);
    setMessage("Legal document checklist seeded.");
    await load();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const id = String(form.get("id") || "");
    const payload = {
      document_name: String(form.get("document_name") || "").trim(),
      current_version: String(form.get("current_version") || "").trim() || null,
      status: String(form.get("status") || "Draft"),
      solicitor_review_needed: toBool(form.get("solicitor_review_needed")),
      last_updated: String(form.get("last_updated") || new Date().toISOString().slice(0, 10)),
      notes: String(form.get("notes") || "").trim() || null,
      file_link: String(form.get("file_link") || "").trim() || null,
      launch_blocker: toBool(form.get("launch_blocker")),
    };
    const request = id ? supabase.from("legal_documents_checklist").update(payload).eq("id", id) : supabase.from("legal_documents_checklist").insert(payload);
    const { error: saveError } = await request;
    if (saveError) return setError(saveError.message);
    setMessage(id ? "Document updated." : "Document added.");
    (event.currentTarget as HTMLFormElement).reset();
    await load();
  }

  const blockers = docs.filter((doc) => doc.launch_blocker && doc.status !== "Approved");

  return (
    <>
      <div className="page-head">
        <div><h1>Solicitor / Legal Docs</h1><p>{blockers.length} launch-blocking document{blockers.length === 1 ? "" : "s"} not approved yet.</p></div>
        <button className="button ghost" onClick={quickSeed}>Seed required docs</button>
      </div>
      <div className="notice warn" style={{ marginBottom: 16 }}>
        Do not mark any document as solicitor-approved unless it has actually been reviewed by a solicitor. Drafts can support preparation, but customer/contractor-facing documents should be reviewed before scaling.
      </div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      {loading ? <div className="notice">Loading legal checklist…</div> : null}
      {docs.length === 0 ? <EmptyState title="No legal documents yet" body="Seed the required documents or add one manually." /> : (
        <div className="list" style={{ marginBottom: 18 }}>
          {docs.map((doc) => (
            <details className="card list-card" key={doc.id} open={doc.status !== "Approved"}>
              <summary className="list-top" style={{ cursor: "pointer" }}><h3>{doc.document_name}</h3><div className="actions-row"><StatusBadge value={doc.status} />{doc.launch_blocker ? <StatusBadge value="Blocks launch" /> : null}</div></summary>
              <div className="list-meta"><span>Version: {doc.current_version || "—"}</span><span>Updated: {formatDate(doc.last_updated)}</span>{doc.file_link ? <a href={doc.file_link} target="_blank">Open file</a> : null}</div>
              <form className="form-grid" onSubmit={save} style={{ marginTop: 14 }}>
                <input type="hidden" name="id" value={doc.id} />
                <label>Document name<input name="document_name" defaultValue={doc.document_name} /></label>
                <label>Current version<input name="current_version" defaultValue={doc.current_version || ""} /></label>
                <label>Status<select name="status" defaultValue={doc.status || "Draft"}>{legalDocumentStatuses.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label>Last updated<input name="last_updated" type="date" defaultValue={doc.last_updated || new Date().toISOString().slice(0, 10)} /></label>
                <label className="check-row"><input name="solicitor_review_needed" type="checkbox" defaultChecked={doc.solicitor_review_needed !== false} /> Solicitor review needed?</label>
                <label className="check-row"><input name="launch_blocker" type="checkbox" defaultChecked={doc.launch_blocker !== false} /> Blocks launch?</label>
                <label className="full">File link<input name="file_link" defaultValue={doc.file_link || ""} /></label>
                <label className="full">Notes<textarea name="notes" defaultValue={doc.notes || ""} /></label>
                <div className="full"><button className="button secondary" type="submit">Save document</button></div>
              </form>
            </details>
          ))}
        </div>
      )}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Add legal document</h2>
        <form className="form-grid" onSubmit={save}>
          <label>Document name<input name="document_name" required /></label>
          <label>Current version<input name="current_version" defaultValue="Draft v1" /></label>
          <label>Status<select name="status" defaultValue="Draft">{legalDocumentStatuses.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>Last updated<input name="last_updated" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
          <label className="check-row"><input name="solicitor_review_needed" type="checkbox" defaultChecked /> Solicitor review needed?</label>
          <label className="check-row"><input name="launch_blocker" type="checkbox" defaultChecked /> Blocks launch?</label>
          <label className="full">File link<input name="file_link" /></label>
          <label className="full">Notes<textarea name="notes" /></label>
          <div className="full"><button className="button" type="submit">Add document</button></div>
        </form>
      </section>
    </>
  );
}
