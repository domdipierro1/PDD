"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { LaunchChecklistItem } from "@/lib/types";
import { launchStatuses } from "@/lib/options";
import { formatDate } from "@/lib/utils";

export default function LaunchChecklistPage() {
  const [items, setItems] = useState<LaunchChecklistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  async function load() {
    const { data, error: fetchError } = await supabase.from("launch_checklist").select("*").order("id", { ascending: true });
    if (fetchError) setError(fetchError.message);
    setItems((data || []) as LaunchChecklistItem[]);
  }
  useEffect(() => { load(); }, []);
  async function updateStatus(id: string, status: string) {
    const { error: updateError } = await supabase.from("launch_checklist").update({ status }).eq("id", id);
    if (updateError) return setError(updateError.message);
    await load();
  }
  const blockers = items.filter((item) => item.required_before_live && item.status !== "Done");
  return (
    <>
      <div className="page-head"><div><h1>Launch Checklist</h1><p>{blockers.length} required item{blockers.length === 1 ? "" : "s"} still not done before live customer work.</p></div></div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      <div className="list">
        {items.map((item) => <div className="card list-card" key={item.id}><div className="list-top"><h3>{item.task}</h3><div className="actions-row"><StatusBadge value={item.status} />{item.blocker ? <StatusBadge value="Blocked" /> : null}</div></div><div className="list-meta"><span>{item.category}</span><span>Required: {item.required_before_live ? "Yes" : "No"}</span><span>Due: {formatDate(item.due_date)}</span></div><p className="help">{item.details}</p><label>Status<select value={item.status || "Pending"} onChange={(e) => updateStatus(item.id, e.target.value)}>{launchStatuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>)}
      </div>
    </>
  );
}
