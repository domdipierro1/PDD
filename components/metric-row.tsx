import { formatCurrency } from "@/lib/utils";
import { grossProfit, marginPercent } from "@/lib/quote";

export function MetricRow({ customerPrice, contractorCost }: { customerPrice?: number | null; contractorCost?: number | null }) {
  const profit = grossProfit(customerPrice, contractorCost);
  const margin = marginPercent(customerPrice, contractorCost);
  return (
    <div className="metric-row">
      <span>Customer: <strong>{formatCurrency(customerPrice)}</strong></span>
      <span>Contractor: <strong>{formatCurrency(contractorCost)}</strong></span>
      <span>Profit: <strong>{formatCurrency(profit)}</strong></span>
      <span>Margin: <strong>{margin === null ? "—" : `${margin.toFixed(0)}%`}</strong></span>
    </div>
  );
}
