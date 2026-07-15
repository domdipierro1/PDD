"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { MessageTemplate } from "@/lib/types";
import { messageTemplateCategories, messageTemplateChannels } from "@/lib/options";
import { toBool } from "@/lib/utils";

export default function MessageTemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [category, setCategory] = useState("All");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from("message_templates").select("*").order("category", { ascending: true }).order("template_id", { ascending: true });
    if (fetchError) setError(fetchError.message);
    setTemplates((data || []) as MessageTemplate[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => category === "All" ? templates : templates.filter((template) => template.category === category), [templates, category]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const id = String(form.get("id") || "");
    const payload = {
      template_id: String(form.get("template_id") || "").trim(),
      template_name: String(form.get("template_name") || "").trim(),
      category: String(form.get("category") || "Customer"),
      stage_status: String(form.get("stage_status") || "").trim() || null,
      channel: String(form.get("channel") || "WhatsApp"),
      subject_line: String(form.get("subject_line") || "").trim() || null,
      message_body: String(form.get("message_body") || "").trim(),
      variables_used: String(form.get("variables_used") || "").trim() || null,
      active: toBool(form.get("active")),
      notes: String(form.get("notes") || "").trim() || null,
    };
    if (!payload.template_id || !payload.template_name || !payload.message_body) {
      setError("Template ID, name and message body are required.");
      return;
    }
    const request = id ? supabase.from("message_templates").update(payload).eq("id", id) : supabase.from("message_templates").insert(payload);
    const { error: saveError } = await request;
    if (saveError) return setError(saveError.message);
    setMessage(id ? "Template updated." : "Template added.");
    (event.currentTarget as HTMLFormElement).reset();
    await load();
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setMessage("Template copied.");
  }

  return (
    <>
      <div className="page-head">
        <div><h1>Message Templates</h1><p>Editable customer, contractor and internal messages. Use these instead of hard-coded-only copy.</p></div>
        <div className="actions-row">
          {["All", "Customer", "Contractor", "Internal"].map((item) => <button key={item} className={`button ${category === item ? "" : "ghost"}`} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      {loading ? <div className="notice">Loading templates…</div> : null}
      <div className="notice warn" style={{ marginBottom: 16 }}>
        Google review templates must not offer incentives, pressure customers, or ask only for positive reviews. Complaint templates should handle the issue before asking for feedback.
      </div>
      {filtered.length === 0 ? <EmptyState title="No templates yet" body="Run migration 007 to seed the editable PDD customer and contractor templates." /> : (
        <div className="list" style={{ marginBottom: 18 }}>
          {filtered.map((template) => (
            <details className="card list-card" key={template.id}>
              <summary className="list-top" style={{ cursor: "pointer" }}>
                <h3>{template.template_id} — {template.template_name}</h3>
                <div className="actions-row"><StatusBadge value={template.category} /><StatusBadge value={template.channel || "—"} />{template.active ? null : <StatusBadge value="Inactive" />}</div>
              </summary>
              <div className="list-meta"><span>Stage: {template.stage_status || "—"}</span><span>Variables: {template.variables_used || "—"}</span></div>
              <pre className="code-card" style={{ whiteSpace: "pre-wrap" }}>{template.message_body}</pre>
              <button className="button ghost" type="button" onClick={() => copy(template.message_body)}>Copy message</button>
              <form className="form-grid" onSubmit={save} style={{ marginTop: 14 }}>
                <input type="hidden" name="id" value={template.id} />
                <label>Template ID<input name="template_id" defaultValue={template.template_id} /></label>
                <label>Template name<input name="template_name" defaultValue={template.template_name} /></label>
                <label>Category<select name="category" defaultValue={template.category}>{messageTemplateCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Channel<select name="channel" defaultValue={template.channel || "WhatsApp"}>{messageTemplateChannels.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Stage/status<input name="stage_status" defaultValue={template.stage_status || ""} /></label>
                <label>Subject line<input name="subject_line" defaultValue={template.subject_line || ""} /></label>
                <label className="full">Message body<textarea name="message_body" defaultValue={template.message_body} rows={8} /></label>
                <label className="full">Variables used<input name="variables_used" defaultValue={template.variables_used || ""} /></label>
                <label className="check-row"><input name="active" type="checkbox" defaultChecked={template.active !== false} /> Active?</label>
                <label className="full">Notes<textarea name="notes" defaultValue={template.notes || ""} /></label>
                <div className="full"><button className="button secondary" type="submit">Save template</button></div>
              </form>
            </details>
          ))}
        </div>
      )}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Add new template</h2>
        <form className="form-grid" onSubmit={save}>
          <label>Template ID<input name="template_id" placeholder="e.g. CUST-014" required /></label>
          <label>Template name<input name="template_name" required /></label>
          <label>Category<select name="category" defaultValue="Customer">{messageTemplateCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Channel<select name="channel" defaultValue="WhatsApp">{messageTemplateChannels.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Stage/status<input name="stage_status" /></label>
          <label>Subject line<input name="subject_line" /></label>
          <label className="full">Message body<textarea name="message_body" rows={8} required /></label>
          <label className="full">Variables used<input name="variables_used" placeholder="[Name], [Amount]" /></label>
          <label className="check-row"><input name="active" type="checkbox" defaultChecked /> Active?</label>
          <label className="full">Notes<textarea name="notes" /></label>
          <div className="full"><button className="button" type="submit">Add template</button></div>
        </form>
      </section>
    </>
  );
}
