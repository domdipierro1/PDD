"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Job } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function QAPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("jobs").select("*").order("job_date", { ascending: true }).then(({ data }) => {
      setJobs((data || []) as Job[]);
      setLoading(false);
    });
  }, []);
  const qaJobs = useMemo(() => jobs.filter((j) => j.completion_form_submitted && j.qa_status === "Awaiting QA"), [jobs]);
  return (
    <>
      <div className="page-head"><div><h1>QA Review</h1><p>Review completion forms, before/after photos, property secured and job notes before releasing payment.</p></div></div>
      {loading ? <div className="notice">Loading QA jobs…</div> : null}
      {qaJobs.length === 0 ? <EmptyState title="No jobs awaiting QA" body="Jobs will appear here once completion evidence is submitted." /> : (
        <div className="list">{qaJobs.map((job) => <Link className="card list-card" href={`/jobs/${job.id}`} key={job.id}><div className="list-top"><h3>{job.customer_name}</h3><StatusBadge value={job.qa_status} /></div><div className="list-meta"><span>{formatDate(job.job_date)}</span><span>{job.job_address}</span><span>Secured: {job.property_secured ? "Yes" : "No"}</span></div></Link>)}</div>
      )}
    </>
  );
}
