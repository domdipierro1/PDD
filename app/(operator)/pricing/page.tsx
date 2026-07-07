"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PricingReference } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function PricingPage() {
  const [rows, setRows] = useState<PricingReference[]>([]);
  useEffect(() => {
    supabase.from("pricing_reference").select("*").order("category", { ascending: true }).order("customer_sell_min", { ascending: true }).then(({ data }) => setRows((data || []) as PricingReference[]));
  }, []);
  return (
    <>
      <div className="page-head"><div><h1>Pricing Reference</h1><p>Internal quote support only. Do not publish full pricing tables on the website.</p></div></div>
      <div className="card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th align="left">Category</th><th align="left">Item</th><th align="left">Sell range</th><th align="left">Contractor range</th><th align="left">Notes</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} style={{ borderTop: "1px solid var(--line)" }}><td style={{ padding: 12 }}>{row.category}</td><td style={{ padding: 12 }}>{row.item}</td><td style={{ padding: 12 }}>{formatCurrency(row.customer_sell_min)} – {formatCurrency(row.customer_sell_max)}</td><td style={{ padding: 12 }}>{formatCurrency(row.contractor_cost_min)} – {formatCurrency(row.contractor_cost_max)}</td><td style={{ padding: 12 }}>{row.notes}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
