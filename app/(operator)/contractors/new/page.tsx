"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { dbsStatuses, hmrcStatuses } from "@/lib/options";
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
      hmrc_status: String(form.get("hmrc_status") || "Not Sure"),
      insurance_certificate_uploaded: toBool(form.get("insurance_certificate_uploaded")),
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
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { data, error: insertError } = await supabase.from("contractors").insert(payload).select("id").single();
    setSaving(false);
    if (insertError) return setError(insertError.message);
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
        <label>HMRC/self-employed status<select name="hmrc_status">{hmrcStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>DBS status<select name="dbs_status">{dbsStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>Own transport?</span><input name="own_transport" type="checkbox" /></label>
        <label><span>EOT/deep clean experience?</span><input name="eot_deep_clean_experience" type="checkbox" /></label>
        <label><span>Insurance uploaded?</span><input name="insurance_certificate_uploaded" type="checkbox" /></label>
        <label><span>ID/right-to-work uploaded?</span><input name="id_right_to_work_uploaded" type="checkbox" /></label>
        <label>Insurance expiry date<input name="insurance_expiry_date" type="date" /></label>
        <label>Insurance cover amount<input name="insurance_cover_amount" inputMode="decimal" placeholder="1000000" /></label>
        <label className="full">Insurance file link<input name="insurance_file_link" type="url" /></label>
        <label className="full">Notes<textarea name="notes" /></label>
        <div className="full actions-row"><button className="button" disabled={saving}>{saving ? "Saving…" : "Save contractor"}</button><Link className="button ghost" href="/contractors">Cancel</Link></div>
      </form>
    </>
  );
}
