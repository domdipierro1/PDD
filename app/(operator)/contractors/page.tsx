"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Contractor } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("contractors").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setContractors((data || []) as Contractor[]);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return contractors;
    if (filter === "Needs Docs") return contractors.filter((c) => !c.contractor_agreement_signed || !c.rate_card_signed || !c.insurance_certificate_uploaded || !c.id_right_to_work_uploaded);
    if (filter === "Insurance Expiring") return contractors.filter((c) => !c.insurance_expiry_date || c.insurance_expiry_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    return contractors.filter((c) => c.contractor_status === filter);
  }, [filter, contractors]);

  return (
    <>
      <div className="page-head"><div><h1>Contractors</h1><p>Screening, documents, insurance, test jobs and active rota approval.</p></div><Link className="button" href="/contractors/new">New contractor</Link></div>
      <div className="actions-row" style={{ marginBottom: 16 }}>{["All", "Needs Docs", "Insurance Expiring", "Active", "Interested", "Docs Requested", "Agreement Signed", "Test Job Passed", "Paused - Complaint"].map((item) => <button key={item} className={`button ${filter === item ? "" : "ghost"}`} onClick={() => setFilter(item)}>{item}</button>)}</div>
      {loading ? <div className="notice">Loading contractors…</div> : null}
      {filtered.length === 0 ? <EmptyState title="No contractors in this view" body="Add contractors as you screen them. Do not mark active until docs and test job are done." actionHref="/contractors/new" actionLabel="Add contractor" /> : (
        <div className="grid grid-3">
          {filtered.map((contractor) => (
            <Link className="card list-card" key={contractor.id} href={`/contractors/${contractor.id}`}>
              <div className="list-top"><h3>{contractor.name}</h3><StatusBadge value={contractor.contractor_status} /></div>
              <div className="list-meta"><span>{contractor.phone || "No phone"}</span><span>{contractor.areas_covered || "No areas"}</span><span>Insurance: {formatDate(contractor.insurance_expiry_date)}</span></div>
              <div className="metric-row"><span>Agreement <strong>{contractor.contractor_agreement_signed ? "Yes" : "No"}</strong></span><span>Rate card <strong>{contractor.rate_card_signed ? "Yes" : "No"}</strong></span><span>Test <strong>{contractor.test_job_status || "—"}</strong></span></div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
