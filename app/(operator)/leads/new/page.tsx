"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addons, leadSources, propertySizes, services } from "@/lib/options";
import { splitMulti, toMoney } from "@/lib/utils";
import { suggestedBaseQuote } from "@/lib/quote";

export default function NewLeadPage() {
  const router = useRouter();
  const [propertySize, setPropertySize] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      customer_name: String(form.get("customer_name") || "").trim(),
      phone: String(form.get("phone") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      address: String(form.get("address") || "").trim() || null,
      postcode: String(form.get("postcode") || "").trim() || null,
      property_size: String(form.get("property_size") || "") || null,
      service_needed: String(form.get("service_needed") || "") || null,
      preferred_date: String(form.get("preferred_date") || "") || null,
      addons: splitMulti(form.get("addons")),
      condition_notes: String(form.get("condition_notes") || "").trim() || null,
      access_notes: String(form.get("access_notes") || "").trim() || null,
      parking_notes: String(form.get("parking_notes") || "").trim() || null,
      lead_source: String(form.get("lead_source") || "Website"),
      quote_status: "Quote Needed",
      suggested_customer_quote: suggestedBaseQuote(String(form.get("property_size") || "")),
      customer_quote: toMoney(form.get("customer_quote")),
      contractor_cost_estimate: toMoney(form.get("contractor_cost_estimate")),
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { data, error: insertError } = await supabase.from("leads").insert(payload).select("id").single();
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.push(`/leads/${data?.id}`);
  }

  return (
    <>
      <div className="page-head">
        <div><h1>New lead</h1><p>Keep this quick. Capture enough to quote and follow up.</p></div>
        <Link className="button ghost" href="/leads">Back</Link>
      </div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      <form className="card form-grid" onSubmit={onSubmit}>
        <label>Customer name<input name="customer_name" required /></label>
        <label>Phone<input name="phone" type="tel" /></label>
        <label>Email<input name="email" type="email" /></label>
        <label>Postcode<input name="postcode" /></label>
        <label className="full">Address<input name="address" /></label>
        <label>Property size<select name="property_size" value={propertySize} onChange={(e) => setPropertySize(e.target.value)}><option value="">Select</option>{propertySizes.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Service needed<select name="service_needed"><option value="">Select</option>{services.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Preferred date<input name="preferred_date" type="date" /></label>
        <label>Lead source<select name="lead_source">{leadSources.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="full">Add-ons <span className="help">Comma-separated. Options: {addons.join(", ")}</span><input name="addons" placeholder="Oven, Carpet, Internal Windows" /></label>
        <label>Customer quote<input name="customer_quote" inputMode="decimal" placeholder={`Suggested: £${suggestedBaseQuote(propertySize) || 0}`} /></label>
        <label>Contractor cost estimate<input name="contractor_cost_estimate" inputMode="decimal" /></label>
        <label className="full">Condition notes<textarea name="condition_notes" /></label>
        <label>Access notes<textarea name="access_notes" /></label>
        <label>Parking notes<textarea name="parking_notes" /></label>
        <label className="full">Internal notes<textarea name="notes" /></label>
        <div className="full actions-row"><button className="button" disabled={saving}>{saving ? "Saving…" : "Save lead"}</button><Link className="button ghost" href="/leads">Cancel</Link></div>
      </form>
    </>
  );
}
