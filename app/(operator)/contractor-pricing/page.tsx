"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { Contractor, ContractorRate } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { rateVariance, suggestTier, targetContractorRates } from "@/lib/rates";

export default function ContractorPricingPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [rates, setRates] = useState<ContractorRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [contractorRes, rateRes] = await Promise.all([
        supabase.from("contractors").select("*").order("created_at", { ascending: false }),
        supabase.from("contractor_rates").select("*").order("effective_from", { ascending: false }),
      ]);
      setContractors((contractorRes.data || []) as Contractor[]);
      setRates((rateRes.data || []) as ContractorRate[]);
      setLoading(false);
    }
    load();
  }, []);

  const latestRates = useMemo(() => {
    const map = new Map<string, ContractorRate>();
    for (const rate of rates) {
      if (!map.has(rate.contractor_id)) map.set(rate.contractor_id, rate);
    }
    return map;
  }, [rates]);

  const rows = contractors.map((contractor) => {
    const rate = latestRates.get(contractor.id) || null;
    return { contractor, rate, suggestedTier: suggestTier(rate) };
  });

  const stats = {
    total: contractors.length,
    withRates: rows.filter((row) => row.rate).length,
    core: rows.filter((row) => (row.contractor.rate_tier || row.suggestedTier) === "Core").length,
    backup: rows.filter((row) => ["Premium Backup", "Backup"].includes(row.contractor.rate_tier || row.suggestedTier)).length,
    reserve: rows.filter((row) => ["Reserve", "Unrated"].includes(row.contractor.rate_tier || row.suggestedTier)).length,
  };

  function varianceLabel(value: number | null | undefined, target: number) {
    const variance = rateVariance(value, target);
    if (variance === null) return "—";
    if (variance === 0) return "Target";
    return variance > 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Contractor Rates</h1>
          <p>Compare cleaner rates, tag fulfilment priority and protect margin before accepting jobs.</p>
        </div>
        <Link className="button" href="/contractors/new">Add contractor</Link>
      </div>

      {loading ? <div className="notice">Loading contractor rates…</div> : null}

      <div className="grid grid-5">
        <StatCard title="Contractors" value={stats.total} href="/contractors" />
        <StatCard title="With rate cards" value={stats.withRates} />
        <StatCard title="Core" value={stats.core} />
        <StatCard title="Premium backup" value={stats.backup} />
        <StatCard title="Reserve/unrated" value={stats.reserve} />
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>How to use this</h2>
          <div className="list">
            <div className="notice"><strong>1. Ask their rates first.</strong><br />Do not lead with your rate card. Collect market rates by property size.</div>
            <div className="notice"><strong>2. Tag them by fulfilment use.</strong><br />Core = best margin/reliable. Premium Backup = reliable but dearer. Reserve = keep warm.</div>
            <div className="notice"><strong>3. Do not chase cheap at the cost of quality.</strong><br />A £20 dearer cleaner can still be useful if the customer price supports it.</div>
          </div>
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Message scripts</h2>
          <p className="help">Use these before sharing PDD target rates.</p>
          <textarea readOnly value={`Thanks. What would you normally charge for end of tenancy cleaning by property size?\n\nStudio\n1 Bed\n2 Bed\n3 Bed\n4 Bed+\n\nAnd what would you usually charge for deep cleaning per hour?`} />
          <textarea readOnly style={{ marginTop: 12 }} value={`Thanks, that is helpful. I can keep you on the list for jobs where the customer price supports that. I would confirm every job, scope and rate with you before you accept it. Would you still be interested on that basis?`} />
        </section>
      </div>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 style={{ marginTop: 0 }}>Rate comparison</h2>
        {rows.length === 0 ? <EmptyState title="No contractors yet" body="Add cleaners as you speak to them, then record their quoted rates." actionHref="/contractors/new" actionLabel="Add contractor" /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contractor</th>
                  <th>Tier</th>
                  <th>Studio</th>
                  <th>1 Bed</th>
                  <th>2 Bed</th>
                  <th>3 Bed</th>
                  <th>Deep/hr</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ contractor, rate, suggestedTier }) => (
                  <tr key={contractor.id}>
                    <td><Link className="link-arrow" href={`/contractors/${contractor.id}`}>{contractor.name}</Link><br /><span className="help">{contractor.areas_covered || "No areas"}</span></td>
                    <td><StatusBadge value={contractor.rate_tier || suggestedTier} /></td>
                    <td>{formatCurrency(rate?.studio_rate)}<br /><span className="help">{varianceLabel(rate?.studio_rate, targetContractorRates.studio_rate)}</span></td>
                    <td>{formatCurrency(rate?.one_bed_rate)}<br /><span className="help">{varianceLabel(rate?.one_bed_rate, targetContractorRates.one_bed_rate)}</span></td>
                    <td>{formatCurrency(rate?.two_bed_rate)}<br /><span className="help">{varianceLabel(rate?.two_bed_rate, targetContractorRates.two_bed_rate)}</span></td>
                    <td>{formatCurrency(rate?.three_bed_rate)}<br /><span className="help">{varianceLabel(rate?.three_bed_rate, targetContractorRates.three_bed_rate)}</span></td>
                    <td>{formatCurrency(rate?.deep_clean_hourly_rate)}<br /><span className="help">{varianceLabel(rate?.deep_clean_hourly_rate, targetContractorRates.deep_clean_hourly_rate)}</span></td>
                    <td><StatusBadge value={contractor.contractor_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
