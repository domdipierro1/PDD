import { classNames } from "@/lib/utils";

const positive = new Set(["Accepted", "Completed", "QA Approved", "Active", "Done", "Won", "Passed", "Resolved", "Closed", "Core", "First Choice", "Rate Card Agreed"]);
const warning = new Set(["Quote Needed", "Follow Up Needed", "Contractor Needed", "Completed - Awaiting Photos", "Completed - Awaiting QA", "Awaiting QA", "Pending", "In Progress", "Follow Up", "Waiting for Photos", "Re-clean Booked", "Premium Backup", "Backup", "Ask Rates", "Rates Received", "Negotiating", "Reserve", "Unrated"]);
const danger = new Set(["Lost", "Cancelled", "Re-clean Needed", "Paused - Complaint", "Paused - Insurance Expired", "Removed", "Blocked", "High", "Critical", "Open", "Too Expensive", "Not Suitable", "Do Not Use Yet"]);

export function StatusBadge({ value }: { value?: string | null }) {
  const text = value || "Not set";
  const tone = positive.has(text) ? "good" : warning.has(text) ? "warn" : danger.has(text) ? "bad" : "neutral";
  return <span className={classNames("badge", `badge-${tone}`)}>{text}</span>;
}
