"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { supabase } from "@/lib/supabase";
import type { Lead, Job, Contractor, Complaint, LaunchChecklistItem } from "@/lib/types";
import { contractorPaymentDue } from "@/lib/quote";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [checklist, setChecklist] = useState<LaunchChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [leadRes, jobRes, contractorRes, complaintRes, checklistRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").order("job_date", { ascending: true }),
        supabase.from("contractors").select("*").order("created_at", { ascending: false }),
        supabase.from("complaints").select("*").order("date_opened", { ascending: false }),
        supabase.from("launch_checklist").select("*").order("id", { ascending: true }),
      ]);
      setLeads((leadRes.data || []) as Lead[]);
      setJobs((jobRes.data || []) as Job[]);
      setContractors((contractorRes.data || []) as Contractor[]);
      setComplaints((complaintRes.data || []) as Complaint[]);
      setChecklist((checklistRes.data || []) as LaunchChecklistItem[]);
      setLoading(false);
    }
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const quoteNeeded = leads.filter((l) => l.quote_status === "Quote Needed").length;
    const followUps = leads.filter((l) => ["Quote Sent", "Awaiting Customer Reply", "Follow Up Needed"].includes(l.quote_status || "")).length;
    const contractorNeeded = jobs.filter((j) => !j.selected_contractor_id || j.job_status === "Contractor Needed").length;
    const todayTomorrow = jobs.filter((j) => j.job_date && j.job_date >= today && j.job_date <= tomorrow).length;
    const awaitingQA = jobs.filter((j) => j.completion_form_submitted && j.qa_status === "Awaiting QA").length;
    const paymentHolds = jobs.filter((j) => j.payment_hold).length;
    const paymentsDue = jobs.filter(contractorPaymentDue).length;
    const openComplaints = complaints.filter((c) => c.complaint_status !== "Closed").length;
    const insuranceIssues = contractors.filter((c) => !c.insurance_certificate_uploaded || !c.insurance_expiry_date || c.insurance_expiry_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).length;
    const launchBlockers = checklist.filter((c) => c.required_before_live && c.status !== "Done").length;
    return { quoteNeeded, followUps, contractorNeeded, todayTomorrow, awaitingQA, paymentHolds, paymentsDue, openComplaints, insuranceIssues, launchBlockers };
  }, [leads, jobs, contractors, complaints, checklist, today, tomorrow]);

  const priorityJobs = jobs.filter((j) => j.payment_hold || (j.completion_form_submitted && j.qa_status === "Awaiting QA") || contractorPaymentDue(j)).slice(0, 6);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Command Centre</h1>
          <p>What needs attention today across leads, jobs, QA, contractors and payments.</p>
        </div>
        <div className="actions-row">
          <Link className="button" href="/leads/new">New lead</Link>
          <Link className="button secondary" href="/jobs">View jobs</Link>
        </div>
      </div>

      {loading ? <div className="notice">Loading dashboard…</div> : null}

      <div className="grid grid-4">
        <StatCard title="Quote needed" value={stats.quoteNeeded} href="/leads" />
        <StatCard title="Follow ups" value={stats.followUps} href="/leads" />
        <StatCard title="Contractor needed" value={stats.contractorNeeded} href="/jobs" />
        <StatCard title="Jobs today/tomorrow" value={stats.todayTomorrow} href="/jobs" />
        <StatCard title="Awaiting QA" value={stats.awaitingQA} href="/qa" />
        <StatCard title="Payment holds" value={stats.paymentHolds} href="/payments" />
        <StatCard title="Contractor payments due" value={stats.paymentsDue} href="/payments" note="Only after clearance + QA" />
        <StatCard title="Open complaints" value={stats.openComplaints} href="/complaints" />
        <StatCard title="Insurance/doc issues" value={stats.insuranceIssues} href="/contractors" />
        <StatCard title="Launch blockers" value={stats.launchBlockers} href="/launch-checklist" />
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <section className="card">
          <div className="page-head" style={{ marginBottom: 12 }}>
            <div><h2 style={{ margin: 0 }}>Priority jobs</h2><p>QA, payment holds and safe-to-pay jobs.</p></div>
          </div>
          {priorityJobs.length === 0 ? <EmptyState title="No urgent jobs" body="When jobs need QA, payment review or a re-clean, they will show here." /> : (
            <div className="list">
              {priorityJobs.map((job) => (
                <Link className="card list-card" key={job.id} href={`/jobs/${job.id}`}>
                  <div className="list-top"><h3>{job.customer_name}</h3><StatusBadge value={job.payment_hold ? "Payment Hold" : contractorPaymentDue(job) ? "Payment Due" : job.qa_status} /></div>
                  <div className="list-meta"><span>{formatDate(job.job_date)}</span><span>{job.property_size}</span><span>{job.service_needed}</span></div>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="card">
          <div className="page-head" style={{ marginBottom: 12 }}>
            <div><h2 style={{ margin: 0 }}>Recent leads</h2><p>Newest enquiries and quote actions.</p></div>
          </div>
          {leads.length === 0 ? <EmptyState title="No leads yet" body="Add a test lead to check the workflow before going live." actionHref="/leads/new" actionLabel="Add test lead" /> : (
            <div className="list">
              {leads.slice(0, 6).map((lead) => (
                <Link className="card list-card" key={lead.id} href={`/leads/${lead.id}`}>
                  <div className="list-top"><h3>{lead.customer_name}</h3><StatusBadge value={lead.quote_status} /></div>
                  <div className="list-meta"><span>{lead.property_size}</span><span>{lead.service_needed}</span><span>{lead.postcode}</span></div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
