"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { MetricRow } from "@/components/metric-row";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Job } from "@/lib/types";
import { contractorPaymentDue } from "@/lib/quote";
import { formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState("Due");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("jobs").select("*").order("job_date", { ascending: false }).then(({ data }) => {
      setJobs((data || []) as Job[]);
      setLoading(false);
    });
  }, []);
  const filtered = useMemo(() => {
    if (view === "Due") return jobs.filter(contractorPaymentDue);
    if (view === "Holds") return jobs.filter((j) => j.payment_hold || j.customer_issue || j.contractor_issue);
    if (view === "Unpaid Customer") return jobs.filter((j) => !j.payment_cleared);
    return jobs;
  }, [jobs, view]);
  return (
    <>
      <div className="page-head"><div><h1>Payments</h1><p>Control contractor payment release. Never pay before cleared customer payment, completion form, before/after photos, QA approval, secured property and issue/payment-hold checks are clear.</p></div></div>
      <div className="actions-row" style={{ marginBottom: 16 }}>{["Due", "Holds", "Unpaid Customer", "All"].map((item) => <button key={item} className={`button ${view === item ? "" : "ghost"}`} onClick={() => setView(item)}>{item}</button>)}</div>
      {loading ? <div className="notice">Loading payments…</div> : null}
      {filtered.length === 0 ? <EmptyState title="No payment items" body="Safe-to-pay jobs and payment holds will show here." /> : (
        <div className="list">{filtered.map((job) => <Link className="card list-card" href={`/jobs/${job.id}`} key={job.id}><div className="list-top"><h3>{job.customer_name}</h3><div className="actions-row"><StatusBadge value={contractorPaymentDue(job) ? "Payment Due" : job.payment_hold ? "Payment Hold" : job.job_status} /></div></div><div className="list-meta"><span>{formatDate(job.job_date)}</span><span>Paid: {job.customer_paid ? "Yes" : "No"}</span><span>Cleared: {job.payment_cleared ? "Yes" : "No"}</span><span>Contractor paid: {job.contractor_paid ? "Yes" : "No"}</span></div><MetricRow customerPrice={job.customer_price} contractorCost={job.contractor_cost} /></Link>)}</div>
      )}
    </>
  );
}
