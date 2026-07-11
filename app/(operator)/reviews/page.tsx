"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Job } from "@/lib/types";
import { formatDate } from "@/lib/utils";

function readyForReview(job: Job) {
  return Boolean(
    job.qa_status === "QA Approved" &&
    !job.customer_issue &&
    !job.contractor_issue &&
    !job.payment_hold &&
    !job.review_request_sent &&
    !job.review_received
  );
}

export default function ReviewsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState("Needs Request");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error: fetchError } = await supabase.from("jobs").select("*").order("job_date", { ascending: false });
    if (fetchError) setError(fetchError.message);
    setJobs((data || []) as Job[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (view === "Needs Request") return jobs.filter(readyForReview);
    if (view === "Follow Up") return jobs.filter((job) => job.review_request_sent && !job.review_follow_up_sent && !job.review_received && !job.customer_issue && !job.payment_hold);
    if (view === "Received") return jobs.filter((job) => job.review_received);
    if (view === "Blocked") return jobs.filter((job) => job.customer_issue || job.contractor_issue || job.payment_hold);
    return jobs;
  }, [jobs, view]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reviews</h1>
          <p>Ask for genuine Google reviews only after completion, QA and issue checks. No incentives or pressure.</p>
        </div>
      </div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      <div className="notice warn" style={{ marginBottom: 16 }}>
        Do not offer discounts, money, free services or incentives for reviews. If there is a complaint, resolve the issue before asking for feedback.
      </div>
      <div className="actions-row" style={{ marginBottom: 16 }}>
        {["Needs Request", "Follow Up", "Received", "Blocked", "All"].map((item) => <button key={item} className={`button ${view === item ? "" : "ghost"}`} onClick={() => setView(item)}>{item}</button>)}
      </div>
      {loading ? <div className="notice">Loading review queue…</div> : null}
      {filtered.length === 0 ? <EmptyState title="No jobs in this review view" body="Jobs ready for a review request will appear after QA is approved and there are no active issues or payment holds." /> : (
        <div className="list">
          {filtered.map((job) => (
            <Link className="card list-card" href={`/jobs/${job.id}`} key={job.id}>
              <div className="list-top">
                <h3>{job.customer_name}</h3>
                <div className="actions-row">
                  {readyForReview(job) ? <StatusBadge value="Review Request Due" /> : null}
                  {job.review_received ? <StatusBadge value="Review Received" /> : null}
                  {job.review_request_sent ? <StatusBadge value="Request Sent" /> : null}
                  {job.payment_hold || job.customer_issue || job.contractor_issue ? <StatusBadge value="Issue First" /> : null}
                </div>
              </div>
              <div className="list-meta">
                <span>{formatDate(job.job_date)}</span>
                <span>{job.service_needed}</span>
                <span>Request: {formatDate(job.review_request_sent_date || job.review_link_sent_at)}</span>
                <span>Follow-up: {formatDate(job.review_follow_up_date)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
