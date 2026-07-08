import type { Lead, Job } from "./types";

export function suggestedBaseQuote(propertySize?: string | null) {
  switch (propertySize) {
    case "Studio": return 175;
    case "1 Bed": return 240;
    case "2 Bed": return 300;
    case "3 Bed": return 475;
    case "4 Bed": return 600;
    case "5 Bed+": return 850;
    default: return 0;
  }
}

export function grossProfit(customerPrice?: number | null, contractorCost?: number | null) {
  if (!customerPrice || !contractorCost) return null;
  return Number(customerPrice) - Number(contractorCost);
}

export function marginPercent(customerPrice?: number | null, contractorCost?: number | null) {
  if (!customerPrice || !contractorCost || Number(customerPrice) === 0) return null;
  return ((Number(customerPrice) - Number(contractorCost)) / Number(customerPrice)) * 100;
}

export function contractorPaymentDue(job: Pick<Job, "payment_cleared" | "completion_form_submitted" | "before_photos_link" | "after_photos_link" | "qa_status" | "property_secured" | "payment_hold" | "customer_issue" | "contractor_issue" | "contractor_paid">) {
  return Boolean(
    job.payment_cleared &&
    job.completion_form_submitted &&
    Boolean(job.before_photos_link) &&
    Boolean(job.after_photos_link) &&
    job.qa_status === "QA Approved" &&
    job.property_secured &&
    !job.payment_hold &&
    !job.customer_issue &&
    !job.contractor_issue &&
    !job.contractor_paid
  );
}

export function quoteMessage(lead: Partial<Lead>) {
  const price = lead.customer_quote ?? suggestedBaseQuote(lead.property_size);
  const addons = Array.isArray(lead.addons) && lead.addons.length ? ` including ${lead.addons.join(", ")}` : "";
  return `Hi ${lead.customer_name || "there"}, thanks for your enquiry with PDD Cleaning Services. Based on a ${lead.property_size || "property"} in ${lead.postcode || "your area"}, your ${lead.service_needed || "clean"}${addons} comes to ${price ? `£${price}` : "a price to confirm"}. This includes our checklist clean and 48-hour re-clean support if anything covered is missed. Shall I lock in ${lead.preferred_date || "your preferred date"} for you?`;
}
