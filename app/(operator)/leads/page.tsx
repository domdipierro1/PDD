"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { MetricRow } from "@/components/metric-row";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("leads").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setLeads((data || []) as Lead[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return leads;
    if (filter === "Open") return leads.filter((l) => !["Accepted", "Lost"].includes(l.quote_status || ""));
    return leads.filter((l) => l.quote_status === filter);
  }, [filter, leads]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Leads & Quotes</h1>
          <p>Capture enquiries, quote fast, follow up, and convert accepted quotes into jobs.</p>
        </div>
        <Link className="button" href="/leads/new">New lead</Link>
      </div>
      <div className="actions-row" style={{ marginBottom: 16 }}>
        {["All", "Open", "Quote Needed", "Quote Sent", "Follow Up Needed", "Accepted", "Lost"].map((item) => (
          <button key={item} className={`button ${filter === item ? "" : "ghost"}`} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>
      {loading ? <div className="notice">Loading leads…</div> : null}
      {filtered.length === 0 ? <EmptyState title="No leads in this view" body="Add a test lead or switch filter." actionHref="/leads/new" actionLabel="Add lead" /> : (
        <div className="list">
          {filtered.map((lead) => (
            <Link className="card list-card" key={lead.id} href={`/leads/${lead.id}`}>
              <div className="list-top"><h3>{lead.customer_name}</h3><StatusBadge value={lead.quote_status} /></div>
              <div className="list-meta">
                <span>{lead.phone || "No phone"}</span>
                <span>{lead.property_size || "Property not set"}</span>
                <span>{lead.service_needed || "Service not set"}</span>
                <span>{lead.postcode || "No postcode"}</span>
                <span>Preferred: {formatDate(lead.preferred_date)}</span>
              </div>
              <MetricRow customerPrice={lead.customer_quote || lead.suggested_customer_quote} contractorCost={lead.contractor_cost_estimate} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
