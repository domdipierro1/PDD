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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState("Open");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("jobs").select("*").order("job_date", { ascending: true }).then(({ data }) => {
      setJobs((data || []) as Job[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return jobs;
    if (filter === "Open") return jobs.filter((j) => !["Completed", "Cancelled"].includes(j.job_status || ""));
    if (filter === "Contractor Needed") return jobs.filter((j) => !j.selected_contractor_id || j.job_status === "Contractor Needed");
    if (filter === "Awaiting QA") return jobs.filter((j) => j.completion_form_submitted && j.qa_status === "Awaiting QA");
    if (filter === "Payment Due") return jobs.filter(contractorPaymentDue);
    return jobs.filter((j) => j.job_status === filter);
  }, [filter, jobs]);

  return (
    <>
      <div className="page-head"><div><h1>Jobs</h1><p>Booked work, assigned contractors, QA and payment clearance.</p></div><Link className="button secondary" href="/leads/new">New lead</Link></div>
      <div className="actions-row" style={{ marginBottom: 16 }}>{["Open", "All", "Contractor Needed", "Awaiting QA", "Payment Due", "Completed", "Cancelled"].map((item) => <button key={item} className={`button ${filter === item ? "" : "ghost"}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {loading ? <div className="notice">Loading jobs…</div> : null}
      {filtered.length === 0 ? <EmptyState title="No jobs in this view" body="Accepted leads converted to jobs will appear here." actionHref="/leads" actionLabel="Go to leads" /> : (
        <div className="list">
          {filtered.map((job) => (
            <Link className="card list-card" href={`/jobs/${job.id}`} key={job.id}>
              <div className="list-top"><h3>{job.customer_name}</h3><div className="actions-row"><StatusBadge value={job.job_status} />{contractorPaymentDue(job) ? <StatusBadge value="Payment Due" /> : null}</div></div>
              <div className="list-meta"><span>{formatDate(job.job_date)}</span><span>{job.property_size}</span><span>{job.service_needed}</span><span>{job.postcode}</span></div>
              <MetricRow customerPrice={job.customer_price} contractorCost={job.contractor_cost} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
