"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { FinanceItem, Job } from "@/lib/types";
import { formatCurrency, formatDate, toMoney } from "@/lib/utils";
import { contractorPaymentDue } from "@/lib/quote";

export default function FinancePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [view, setView] = useState("This Month");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [jobRes, itemRes] = await Promise.all([
      supabase.from("jobs").select("*").order("job_date", { ascending: false }),
      supabase.from("finance_items").select("*").order("created_at", { ascending: false }),
    ]);
    setJobs((jobRes.data || []) as Job[]);
    if (!itemRes.error) setItems((itemRes.data || []) as FinanceItem[]);
    if (itemRes.error && !itemRes.error.message.includes("does not exist")) setError(itemRes.error.message);
  }

  useEffect(() => { load(); }, []);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartISO = monthStart.toISOString().slice(0, 10);

  const scopedJobs = useMemo(() => {
    if (view === "All") return jobs;
    return jobs.filter((job) => (job.job_date || job.created_at || "") >= monthStartISO);
  }, [jobs, monthStartISO, view]);

  const scopedItems = useMemo(() => {
    if (view === "All") return items;
    return items.filter((item) => (item.paid_date || item.due_date || item.created_at || "") >= monthStartISO);
  }, [items, monthStartISO, view]);

  const jobRevenue = scopedJobs.reduce((sum, job) => sum + Number(job.customer_price || 0), 0);
  const jobCosts = scopedJobs.reduce((sum, job) => sum + Number(job.contractor_cost || 0), 0);
  const extraRevenue = scopedItems.filter((i) => i.item_type === "Revenue").reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const extraCosts = scopedItems.filter((i) => i.item_type === "Cost").reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalRevenue = jobRevenue + extraRevenue;
  const totalCosts = jobCosts + extraCosts;
  const grossProfit = totalRevenue - totalCosts;
  const margin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
  const unpaidCustomer = scopedJobs.filter((job) => !job.payment_cleared).reduce((sum, job) => sum + Number(job.customer_price || 0), 0);
  const contractorDue = scopedJobs.filter(contractorPaymentDue).reduce((sum, job) => sum + Number(job.contractor_cost || 0), 0);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      item_type: String(form.get("item_type") || "Cost"),
      category: String(form.get("category") || "Other"),
      description: String(form.get("description") || "").trim() || null,
      amount: toMoney(form.get("amount")) || 0,
      due_date: String(form.get("due_date") || "") || null,
      paid_date: String(form.get("paid_date") || "") || null,
      payment_status: String(form.get("payment_status") || "Pending"),
      payment_method: String(form.get("payment_method") || "").trim() || null,
      evidence_link: String(form.get("evidence_link") || "").trim() || null,
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { error: insertError } = await supabase.from("finance_items").insert(payload);
    if (insertError) return setError(insertError.message);
    (event.currentTarget as HTMLFormElement).reset();
    setMessage("Finance item added.");
    await load();
  }

  return (
    <>
      <div className="page-head"><div><h1>Finance</h1><p>Job-level revenue, contractor costs, extra costs and profit. Use Xero/accountant for formal accounts later.</p></div></div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      <div className="actions-row" style={{ marginBottom: 16 }}>{["This Month", "All"].map((item) => <button key={item} className={`button ${view === item ? "" : "ghost"}`} onClick={() => setView(item)}>{item}</button>)}</div>

      <div className="grid grid-4">
        <StatCard title="Revenue" value={formatCurrency(totalRevenue)} />
        <StatCard title="Costs" value={formatCurrency(totalCosts)} />
        <StatCard title="Gross profit" value={formatCurrency(grossProfit)} note={`${margin.toFixed(1)}% margin`} />
        <StatCard title="Unpaid customer value" value={formatCurrency(unpaidCustomer)} />
        <StatCard title="Contractor due soon" value={formatCurrency(contractorDue)} />
        <StatCard title="Jobs counted" value={scopedJobs.length} />
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Add revenue/cost item</h2>
          <form className="form-grid" onSubmit={addItem}>
            <label>Type<select name="item_type"><option>Cost</option><option>Revenue</option></select></label>
            <label>Category<input name="category" placeholder="Ad spend, materials, parking, refund, etc." /></label>
            <label>Amount<input name="amount" inputMode="decimal" required /></label>
            <label>Status<select name="payment_status"><option>Pending</option><option>Paid</option><option>Cleared</option><option>Hold</option></select></label>
            <label>Due date<input name="due_date" type="date" /></label>
            <label>Paid date<input name="paid_date" type="date" /></label>
            <label className="full">Evidence link<input name="evidence_link" placeholder="Receipt, invoice, bank screenshot link" /></label>
            <label className="full">Description<textarea name="description" /></label>
            <label className="full">Notes<textarea name="notes" /></label>
            <div className="full"><button className="button" type="submit">Add finance item</button></div>
          </form>
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Recent finance items</h2>
          {scopedItems.length === 0 ? <EmptyState title="No extra finance items yet" body="Job revenue and contractor costs are already counted from Jobs. Add other costs like ads, materials, parking, refunds or payment fees here." /> : (
            <div className="list">{scopedItems.slice(0, 12).map((item) => <div className="card list-card" key={item.id}><div className="list-top"><h3>{item.category}</h3><StatusBadge value={item.item_type} /></div><div className="list-meta"><span>{formatCurrency(item.amount)}</span><span>{item.payment_status}</span><span>{formatDate(item.paid_date || item.due_date)}</span>{item.evidence_link ? <a href={item.evidence_link} target="_blank">Evidence</a> : null}</div><p className="muted">{item.description}</p></div>)}</div>
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Job profit log</h2>
        {scopedJobs.length === 0 ? <EmptyState title="No jobs yet" body="Converted jobs will appear here with revenue, contractor cost and gross profit." /> : (
          <div className="table-like"><table><thead><tr><th>Date</th><th>Job</th><th>Revenue</th><th>Contractor cost</th><th>Profit</th><th>Status</th></tr></thead><tbody>{scopedJobs.map((job) => { const revenue = Number(job.customer_price || 0); const cost = Number(job.contractor_cost || 0); return <tr key={job.id}><td>{formatDate(job.job_date)}</td><td><Link href={`/jobs/${job.id}`}>{job.customer_name}</Link></td><td>{formatCurrency(revenue)}</td><td>{formatCurrency(cost)}</td><td>{formatCurrency(revenue - cost)}</td><td>{job.payment_cleared ? "Cleared" : "Unpaid"}</td></tr>; })}</tbody></table></div>
        )}
      </section>
    </>
  );
}
