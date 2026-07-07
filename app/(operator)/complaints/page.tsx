"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Complaint } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState("Open");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("complaints").select("*").order("date_opened", { ascending: false }).then(({ data }) => {
      setComplaints((data || []) as Complaint[]);
      setLoading(false);
    });
  }, []);
  const filtered = useMemo(() => filter === "All" ? complaints : complaints.filter((c) => c.complaint_status !== "Closed"), [complaints, filter]);
  return (
    <>
      <div className="page-head"><div><h1>Complaints</h1><p>Track quality issues, re-cleans, refunds, insurance claims and review risk.</p></div><Link className="button" href="/complaints/new">Log complaint</Link></div>
      <div className="actions-row" style={{ marginBottom: 16 }}>{["Open", "All"].map((item) => <button key={item} className={`button ${filter === item ? "" : "ghost"}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {loading ? <div className="notice">Loading complaints…</div> : null}
      {filtered.length === 0 ? <EmptyState title="No complaints" body="Keep it this way. Any issue or re-clean should be logged here." actionHref="/complaints/new" actionLabel="Log complaint" /> : (
        <div className="list">{filtered.map((complaint) => <div className="card list-card" key={complaint.id}><div className="list-top"><h3>{complaint.customer_name || "Unnamed customer"}</h3><div className="actions-row"><StatusBadge value={complaint.complaint_status} /><StatusBadge value={complaint.severity} /></div></div><div className="list-meta"><span>{formatDate(complaint.date_opened)}</span><span>{complaint.issue_type}</span><span>Re-clean: {complaint.re_clean_needed ? "Yes" : "No"}</span><span>Refund: {formatCurrency(complaint.refund_discount_offered)}</span></div><p className="help">{complaint.description || "No description"}</p>{complaint.job_id ? <Link className="button ghost" href={`/jobs/${complaint.job_id}`}>Open job</Link> : null}</div>)}</div>
      )}
    </>
  );
}
