"use client";

import { FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { InsuranceChecklist } from "@/lib/types";
import { launchStatuses, yesNoUnknown } from "@/lib/options";
import { toBool, toMoney } from "@/lib/utils";

const defaultInsurance: Partial<InsuranceChecklist> = {
  id: "default",
  broker_insurer_contacted: "Admiral Business via Tide",
  public_liability_quoted: true,
  professional_indemnity_quoted: true,
  employers_liability_needed: "Unknown",
  bona_fide_subcontractors_allowed: "Unknown",
  subcontractors_must_hold_own_pl: true,
  minimum_subcontractor_pl_cover: "Minimum contractor public liability cover to be confirmed by insurer/broker; default target £1m.",
  pdd_site_visits_access_qa_key_photos_touchups_covered: "Unknown",
  arranging_managing_vetting_admin_risk_covered: "Unknown",
  policy_responds_if_customer_claims_against_pdd: "Unknown",
  public_liability_provider: "Admiral Business via Tide",
  public_liability_policy_number: "2BII252DPV",
  public_liability_cover_amount: 1000000,
  occupation_class: "Household Cleaning Services",
  policy_purchased: true,
  policy_start_date: "2026-07-15",
  renewal_date: "2027-07-14",
  cover_start_date: "2026-07-15",
  cover_end_date: "2027-07-14",
  professional_indemnity_status: "Included on separate certificate - upload/store certificate and cover amount",
  policy_documents_uploaded: false,
  status: "In Progress",
  launch_blocker: true,
  admin_only_documents: true,
};

export default function InsurancePage() {
  const [item, setItem] = useState<Partial<InsuranceChecklist>>(defaultInsurance);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from("insurance_checklist").select("*").eq("id", "default").maybeSingle();
    if (fetchError) setError(fetchError.message);
    setItem({ ...defaultInsurance, ...(data || {}) });
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      id: "default",
      broker_insurer_contacted: String(form.get("broker_insurer_contacted") || "").trim() || null,
      public_liability_quoted: toBool(form.get("public_liability_quoted")),
      professional_indemnity_quoted: toBool(form.get("professional_indemnity_quoted")),
      employers_liability_needed: String(form.get("employers_liability_needed") || "Unknown"),
      bona_fide_subcontractors_allowed: String(form.get("bona_fide_subcontractors_allowed") || "Unknown"),
      subcontractors_must_hold_own_pl: toBool(form.get("subcontractors_must_hold_own_pl")),
      minimum_subcontractor_pl_cover: String(form.get("minimum_subcontractor_pl_cover") || "").trim() || null,
      pdd_site_visits_access_qa_key_photos_touchups_covered: String(form.get("pdd_site_visits_access_qa_key_photos_touchups_covered") || "Unknown"),
      arranging_managing_vetting_admin_risk_covered: String(form.get("arranging_managing_vetting_admin_risk_covered") || "Unknown"),
      policy_responds_if_customer_claims_against_pdd: String(form.get("policy_responds_if_customer_claims_against_pdd") || "Unknown"),
      public_liability_provider: String(form.get("public_liability_provider") || "").trim() || null,
      public_liability_policy_number: String(form.get("public_liability_policy_number") || "").trim() || null,
      public_liability_cover_amount: toMoney(form.get("public_liability_cover_amount")),
      occupation_class: String(form.get("occupation_class") || "").trim() || null,
      professional_indemnity_status: String(form.get("professional_indemnity_status") || "").trim() || null,
      professional_indemnity_provider: String(form.get("professional_indemnity_provider") || "").trim() || null,
      professional_indemnity_cover_amount: toMoney(form.get("professional_indemnity_cover_amount")),
      professional_indemnity_certificate_upload: String(form.get("professional_indemnity_certificate_upload") || "").trim() || null,
      professional_indemnity_expiry_date: String(form.get("professional_indemnity_expiry_date") || "") || null,
      exclusion_external_windows: toBool(form.get("exclusion_external_windows")),
      exclusion_carpet_cleaning: toBool(form.get("exclusion_carpet_cleaning")),
      exclusion_waste: toBool(form.get("exclusion_waste")),
      exclusion_jet_washing: toBool(form.get("exclusion_jet_washing")),
      exclusion_after_builders: toBool(form.get("exclusion_after_builders")),
      exclusion_oven_cleaning: toBool(form.get("exclusion_oven_cleaning")),
      policy_purchased: toBool(form.get("policy_purchased")),
      policy_start_date: String(form.get("policy_start_date") || "") || null,
      renewal_date: String(form.get("renewal_date") || "") || null,
      cover_start_date: String(form.get("cover_start_date") || "") || null,
      cover_end_date: String(form.get("cover_end_date") || "") || null,
      policy_documents_uploaded: toBool(form.get("policy_documents_uploaded")),
      evidence_link: String(form.get("evidence_link") || "").trim() || null,
      policy_wording_link: String(form.get("policy_wording_link") || "").trim() || null,
      launch_blocker: toBool(form.get("launch_blocker")),
      status: String(form.get("status") || "Not Started"),
      notes: String(form.get("notes") || "").trim() || null,
      model_confirmed_by_broker: toBool(form.get("model_confirmed_by_broker")),
      admin_only_documents: toBool(form.get("admin_only_documents")),
    };
    const { error: upsertError } = await supabase.from("insurance_checklist").upsert(payload);
    if (upsertError) return setError(upsertError.message);
    setMessage("Insurance checklist saved.");
    await load();
  }

  const complete = Boolean(item.policy_purchased && item.policy_documents_uploaded && item.model_confirmed_by_broker && item.bona_fide_subcontractors_allowed === "Yes");

  return (
    <>
      <div className="page-head">
        <div><h1>Insurance Checklist</h1><p>Track active insurance, PI certificate, exclusions and whether the real contractor-fulfilled PDD model is confirmed.</p></div>
        <div className="actions-row"><StatusBadge value={item.status || "Not Started"} />{complete ? <StatusBadge value="Model Confirmed" /> : <StatusBadge value="Still Check Model" />}</div>
      </div>
      {loading ? <div className="notice">Loading insurance checklist…</div> : null}
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}
      <div className="notice warn" style={{ marginBottom: 16 }}>
        Public liability is active, but do not treat insurance as fully launch-complete unless the insurer/broker confirms this exact model: PDD arranges/manages jobs; cleaning is mainly completed by bona fide self-employed subcontractors with their own PL; Dom may attend for access, inspection, QA, key handling, photos or minor touch-ups.
      </div>

      <form className="card form-grid" onSubmit={save}>
        <label className="full">Broker/insurer contacted<input name="broker_insurer_contacted" defaultValue={item.broker_insurer_contacted || ""} /></label>
        <label>Status<select name="status" defaultValue={item.status || "In Progress"}>{launchStatuses.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>PL provider<input name="public_liability_provider" defaultValue={item.public_liability_provider || ""} /></label>
        <label>PL policy number<input name="public_liability_policy_number" defaultValue={item.public_liability_policy_number || ""} /></label>
        <label>PL cover amount<input name="public_liability_cover_amount" inputMode="decimal" defaultValue={item.public_liability_cover_amount || ""} /></label>
        <label>Occupation/class<input name="occupation_class" defaultValue={item.occupation_class || ""} /></label>
        <label>Cover start<input name="cover_start_date" type="date" defaultValue={item.cover_start_date || item.policy_start_date || ""} /></label>
        <label>Cover end / renewal<input name="cover_end_date" type="date" defaultValue={item.cover_end_date || item.renewal_date || ""} /></label>
        <label>Policy start date<input name="policy_start_date" type="date" defaultValue={item.policy_start_date || ""} /></label>
        <label>Renewal date<input name="renewal_date" type="date" defaultValue={item.renewal_date || ""} /></label>
        <label>Employers’ liability needed?<select name="employers_liability_needed" defaultValue={item.employers_liability_needed || "Unknown"}>{yesNoUnknown.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Bona fide subcontractors allowed?<select name="bona_fide_subcontractors_allowed" defaultValue={item.bona_fide_subcontractors_allowed || "Unknown"}>{yesNoUnknown.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>PDD site visits/access/QA/key/photos/touch-ups covered?<select name="pdd_site_visits_access_qa_key_photos_touchups_covered" defaultValue={item.pdd_site_visits_access_qa_key_photos_touchups_covered || "Unknown"}>{yesNoUnknown.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Arranging/managing/vetting/admin risk covered?<select name="arranging_managing_vetting_admin_risk_covered" defaultValue={item.arranging_managing_vetting_admin_risk_covered || "Unknown"}>{yesNoUnknown.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Responds if customer claims against PDD?<select name="policy_responds_if_customer_claims_against_pdd" defaultValue={item.policy_responds_if_customer_claims_against_pdd || "Unknown"}>{yesNoUnknown.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="full">Minimum subcontractor PL cover<input name="minimum_subcontractor_pl_cover" defaultValue={item.minimum_subcontractor_pl_cover || ""} /></label>
        <label>PI status<input name="professional_indemnity_status" defaultValue={item.professional_indemnity_status || ""} /></label>
        <label>PI provider<input name="professional_indemnity_provider" defaultValue={item.professional_indemnity_provider || ""} /></label>
        <label>PI cover amount<input name="professional_indemnity_cover_amount" inputMode="decimal" defaultValue={item.professional_indemnity_cover_amount || ""} /></label>
        <label>PI expiry date<input name="professional_indemnity_expiry_date" type="date" defaultValue={item.professional_indemnity_expiry_date || ""} /></label>
        <label className="full">PI certificate link<input name="professional_indemnity_certificate_upload" defaultValue={item.professional_indemnity_certificate_upload || ""} placeholder="Secure admin-only link" /></label>
        <label className="check-row"><input name="public_liability_quoted" type="checkbox" defaultChecked={Boolean(item.public_liability_quoted)} /> Public liability quoted/active?</label>
        <label className="check-row"><input name="professional_indemnity_quoted" type="checkbox" defaultChecked={Boolean(item.professional_indemnity_quoted)} /> Professional indemnity included/quoted?</label>
        <label className="check-row"><input name="subcontractors_must_hold_own_pl" type="checkbox" defaultChecked={item.subcontractors_must_hold_own_pl !== false} /> Subcontractors must hold own PL?</label>
        <label className="check-row"><input name="model_confirmed_by_broker" type="checkbox" defaultChecked={Boolean(item.model_confirmed_by_broker)} /> Actual model confirmed by broker/insurer?</label>
        <fieldset className="checklist-group full"><legend>Exclusions to watch</legend><div className="form-grid">
          <label className="check-row"><input name="exclusion_external_windows" type="checkbox" defaultChecked={Boolean(item.exclusion_external_windows)} /> External windows excluded?</label>
          <label className="check-row"><input name="exclusion_carpet_cleaning" type="checkbox" defaultChecked={Boolean(item.exclusion_carpet_cleaning)} /> Carpet cleaning excluded?</label>
          <label className="check-row"><input name="exclusion_waste" type="checkbox" defaultChecked={Boolean(item.exclusion_waste)} /> Waste excluded?</label>
          <label className="check-row"><input name="exclusion_jet_washing" type="checkbox" defaultChecked={Boolean(item.exclusion_jet_washing)} /> Jet washing excluded?</label>
          <label className="check-row"><input name="exclusion_after_builders" type="checkbox" defaultChecked={Boolean(item.exclusion_after_builders)} /> After builders excluded?</label>
          <label className="check-row"><input name="exclusion_oven_cleaning" type="checkbox" defaultChecked={Boolean(item.exclusion_oven_cleaning)} /> Oven cleaning excluded?</label>
        </div></fieldset>
        <label className="check-row"><input name="policy_purchased" type="checkbox" defaultChecked={Boolean(item.policy_purchased)} /> Policy purchased?</label>
        <label className="check-row"><input name="policy_documents_uploaded" type="checkbox" defaultChecked={Boolean(item.policy_documents_uploaded)} /> Policy documents uploaded?</label>
        <label className="check-row"><input name="admin_only_documents" type="checkbox" defaultChecked={item.admin_only_documents !== false} /> Insurance docs admin-only?</label>
        <label className="full">Evidence / policy certificate link<input name="evidence_link" defaultValue={item.evidence_link || ""} /></label>
        <label className="full">Policy wording link<input name="policy_wording_link" defaultValue={item.policy_wording_link || ""} /></label>
        <label className="check-row"><input name="launch_blocker" type="checkbox" defaultChecked={item.launch_blocker !== false} /> Launch blocker?</label>
        <label className="full">Notes<textarea name="notes" defaultValue={item.notes || ""} /></label>
        <div className="full"><button className="button" type="submit">Save insurance checklist</button></div>
      </form>
    </>
  );
}
