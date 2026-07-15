"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbsStatuses, hmrcStatuses, fulfilmentPriorities, rateDiscoveryStatuses, rateTiers } from "@/lib/options";
import { toBool, toMoney } from "@/lib/utils";

export default function NewContractorPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      phone: String(form.get("phone") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      areas_covered: String(form.get("areas_covered") || "").trim() || null,
      own_transport: toBool(form.get("own_transport")),
      years_experience: form.get("years_experience") ? Number(form.get("years_experience")) : null,
      eot_deep_clean_experience: toBool(form.get("eot_deep_clean_experience")),
      services_offered: String(form.get("services_offered") || "").trim() || null,
      end_of_tenancy_experience: toBool(form.get("end_of_tenancy_experience")),
      deep_clean_experience: toBool(form.get("deep_clean_experience")),
      after_builders_experience: toBool(form.get("after_builders_experience")),
      oven_window_carpet_experience: String(form.get("oven_window_carpet_experience") || "").trim() || null,
      self_employed_status: String(form.get("hmrc_status") || "Not Sure"),
      hmrc_status: String(form.get("hmrc_status") || "Not Sure"),
      insurance_certificate_uploaded: toBool(form.get("insurance_certificate_uploaded")),
      public_liability_received: toBool(form.get("insurance_certificate_uploaded")),
      insurance_file_link: String(form.get("insurance_file_link") || "").trim() || null,
      insurance_expiry_date: String(form.get("insurance_expiry_date") || "") || null,
      insurance_cover_amount: toMoney(form.get("insurance_cover_amount")),
      id_right_to_work_uploaded: toBool(form.get("id_right_to_work_uploaded")),
      contractor_agreement_signed: false,
      rate_card_signed: false,
      test_job_status: "Needed",
      test_job_result: "Pending",
      active_rota_approved: false,
      contractor_status: "Interested",
      dbs_status: String(form.get("dbs_status") || "Not Required"),
      rate_tier: String(form.get("rate_tier") || "Unrated"),
      fulfilment_priority: String(form.get("fulfilment_priority") || "Reserve"),
      rate_discovery_status: String(form.get("rate_discovery_status") || "Ask Rates"),
      rate_notes: String(form.get("rate_notes") || "").trim() || null,
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { data, error: insertError } = await supabase.from("contractors").insert(payload).select("id").single();
    if (insertError) { setSaving(false); return setError(insertError.message); }

    const ratePayload = {
      contractor_id: data?.id,
      rate_card_signed: false,
      effective_from: new Date().toISOString().slice(0, 10),
      studio_rate: toMoney(form.get("studio_rate")),
      one_bed_rate: toMoney(form.get("one_bed_rate")),
      two_bed_rate: toMoney(form.get("two_bed_rate")),
      three_bed_rate: toMoney(form.get("three_bed_rate")),
      four_bed_rate: toMoney(form.get("four_bed_rate")),
      deep_clean_hourly_rate: toMoney(form.get("deep_clean_hourly_rate")),
      notes: String(form.get("rate_notes") || "").trim() || null,
    };
    const hasAnyRate = Object.entries(ratePayload).some(([key, value]) => key.endsWith("_rate") && value !== null);
    if (data?.id && hasAnyRate) await supabase.from("contractor_rates").insert(ratePayload);
    setSaving(false);
    router.push(`/contractors/${data?.id}`);
  }

  return (
    <>
      <div className="page-head"><div><h1>New contractor</h1><p>Screen the contractor before any test or live job.</p></div><Link className="button ghost" href="/contractors">Back</Link></div>
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      <form className="card form-grid" onSubmit={onSubmit}>
        <label>Name<input name="name" required /></label>
        <label>Phone<input name="phone" type="tel" /></label>
        <label>Email<input name="email" type="email" /></label>
        <label>Years experience<input name="years_experience" type="number" min="0" /></label>
        <label className="full">Areas covered<input name="areas_covered" placeholder="Southgate, Palmers Green, Wood Green" /></label>
        <label className="full">Services offered<input name="services_offered" placeholder="End of tenancy, deep clean, after builders, oven, windows, carpet" /></label>
        <label>HMRC/self-employed status<select name="hmrc_status">{hmrcStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>DBS status<select name="dbs_status">{dbsStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Rate tier<select name="rate_tier">{rateTiers.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Fulfilment priority<select name="fulfilment_priority">{fulfilmentPriorities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Rate discovery<select name="rate_discovery_status">{rateDiscoveryStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Own transport?</span><input name="own_transport" type="checkbox" /></label>
        <label><span>EOT/deep clean experience?</span><input name="eot_deep_clean_experience" type="checkbox" /></label>
        <label><span>End of tenancy experience?</span><input name="end_of_tenancy_experience" type="checkbox" /></label>
        <label><span>Deep clean experience?</span><input name="deep_clean_experience" type="checkbox" /></label>
        <label><span>After builders experience?</span><input name="after_builders_experience" type="checkbox" /></label>
        <label className="full">Oven/window/carpet experience<input name="oven_window_carpet_experience" placeholder="Describe relevant add-on experience" /></label>
        <label><span>Insurance uploaded?</span><input name="insurance_certificate_uploaded" type="checkbox" /></label>
        <label><span>ID/right-to-work uploaded?</span><input name="id_right_to_work_uploaded" type="checkbox" /></label>
        <label>Insurance expiry date<input name="insurance_expiry_date" type="date" /></label>
        <label>Insurance cover amount<input name="insurance_cover_amount" inputMode="decimal" placeholder="1000000" /></label>
        <label className="full">Insurance file link<input name="insurance_file_link" type="url" /></label>
        <fieldset className="checklist-group full">
          <legend>Quoted rates, if known</legend>
          <p className="help checklist-help">Ask the cleaner for their rates first. Leave blank if not known yet.</p>
          <div className="form-grid">
            <label>Studio<input name="studio_rate" inputMode="decimal" placeholder="60" /></label>
            <label>1 Bed<input name="one_bed_rate" inputMode="decimal" placeholder="100" /></label>
            <label>2 Bed<input name="two_bed_rate" inputMode="decimal" placeholder="160" /></label>
            <label>3 Bed<input name="three_bed_rate" inputMode="decimal" placeholder="200" /></label>
            <label>4 Bed<input name="four_bed_rate" inputMode="decimal" placeholder="Agreed per job" /></label>
            <label>Deep clean hourly<input name="deep_clean_hourly_rate" inputMode="decimal" placeholder="20" /></label>
          </div>
        </fieldset>
        <label className="full">Rate notes<textarea name="rate_notes" placeholder="e.g. Wants £20 above target, has own kit, flexible on 1-2 bed jobs." /></label>
        <label className="full">Notes<textarea name="notes" /></label>
        <div className="full actions-row"><button className="button" disabled={saving}>{saving ? "Saving…" : "Save contractor"}</button><Link className="button ghost" href="/contractors">Cancel</Link></div>
      </form>
    </>
  );
}
