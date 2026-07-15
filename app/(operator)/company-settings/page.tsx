"use client";

import { FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { BusinessSettings } from "@/lib/types";
import { accountStatuses } from "@/lib/options";
import { toBool, toMoney } from "@/lib/utils";

const defaultSettings: Partial<BusinessSettings> = {
  id: "default",
  legal_company_name: "PDD Services Limited",
  trading_name: "PDD Cleaning Services",
  company_number: "17329999",
  company_type: "Private company limited by shares",
  incorporation_date: "2026-07-09",
  registered_in: "England & Wales",
  business_email: "info@pddcleaningservices.co.uk",
  public_customer_email: "info@pddcleaningservices.co.uk",
  admin_backup_email: "pddserviceslimited@gmail.com",
  phone_number: "07568 273696",
  website: "https://pddcleaningservices.co.uk",
  google_business_profile_status: "In Progress",
  ico_registration_status: "Done",
  ico_application_reference: "C1984389",
  solicitor_review_status: "Not Started",
  google_review_link_saved: false,
  service_area_business: true,
  storefront_required: false,
  tide_account_status: "Open",
  stripe_account_status: "Open",
  stripe_payout_bank: "Tide",
  insurance_status: "Active",
  public_liability_provider: "Admiral Business via Tide",
  public_liability_policy_number: "2BII252DPV",
  public_liability_cover_amount: 1000000,
  public_liability_start_date: "2026-07-15",
  public_liability_end_date: "2027-07-14",
  professional_indemnity_status: "Included - separate certificate",
  companies_house_auth_code_stored_securely: true,
  hmrc_utr_received: false,
  corporation_tax_setup_status: "Not Started",
  vat_registered: false,
  actual_trading_admin_address_restricted: true,
  auth_code_restricted: true,
  service_area_notes: "Customers are served at their properties. PDD is a service-area business, not a storefront.",
};

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<Partial<BusinessSettings>>(defaultSettings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from("business_settings").select("*").eq("id", "default").maybeSingle();
    if (fetchError && !fetchError.message.includes("does not exist")) setError(fetchError.message);
    setSettings({ ...defaultSettings, ...(data || {}) });
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      id: "default",
      legal_company_name: String(form.get("legal_company_name") || "").trim() || null,
      trading_name: String(form.get("trading_name") || "").trim() || null,
      company_number: String(form.get("company_number") || "").trim() || null,
      company_type: String(form.get("company_type") || "").trim() || null,
      incorporation_date: String(form.get("incorporation_date") || "") || null,
      registered_in: String(form.get("registered_in") || "").trim() || null,
      registered_office_address: String(form.get("registered_office_address") || "").trim() || null,
      actual_trading_admin_address: String(form.get("actual_trading_admin_address") || "").trim() || null,
      business_email: String(form.get("business_email") || "").trim() || null,
      public_customer_email: String(form.get("public_customer_email") || "").trim() || null,
      admin_backup_email: String(form.get("admin_backup_email") || "").trim() || null,
      phone_number: String(form.get("phone_number") || "").trim() || null,
      website: String(form.get("website") || "").trim() || null,
      tide_account_status: String(form.get("tide_account_status") || "Not Started"),
      stripe_account_status: String(form.get("stripe_account_status") || "Not Started"),
      stripe_payout_bank: String(form.get("stripe_payout_bank") || "").trim() || null,
      google_business_profile_status: String(form.get("google_business_profile_status") || "Not Started"),
      ico_registration_status: String(form.get("ico_registration_status") || "Not Started"),
      ico_application_reference: String(form.get("ico_application_reference") || "").trim() || null,
      solicitor_review_status: String(form.get("solicitor_review_status") || "Not Started"),
      insurance_status: String(form.get("insurance_status") || "Not Confirmed"),
      public_liability_provider: String(form.get("public_liability_provider") || "").trim() || null,
      public_liability_policy_number: String(form.get("public_liability_policy_number") || "").trim() || null,
      public_liability_cover_amount: toMoney(form.get("public_liability_cover_amount")),
      public_liability_start_date: String(form.get("public_liability_start_date") || "") || null,
      public_liability_end_date: String(form.get("public_liability_end_date") || "") || null,
      professional_indemnity_status: String(form.get("professional_indemnity_status") || "").trim() || null,
      professional_indemnity_provider: String(form.get("professional_indemnity_provider") || "").trim() || null,
      professional_indemnity_cover_amount: toMoney(form.get("professional_indemnity_cover_amount")),
      professional_indemnity_certificate_upload: String(form.get("professional_indemnity_certificate_upload") || "").trim() || null,
      professional_indemnity_expiry_date: String(form.get("professional_indemnity_expiry_date") || "") || null,
      companies_house_auth_code_stored_securely: toBool(form.get("companies_house_auth_code_stored_securely")),
      hmrc_utr_received: toBool(form.get("hmrc_utr_received")),
      corporation_tax_setup_status: String(form.get("corporation_tax_setup_status") || "Not Started"),
      vat_registered: toBool(form.get("vat_registered")),
      actual_trading_admin_address_restricted: toBool(form.get("actual_trading_admin_address_restricted")),
      auth_code_restricted: toBool(form.get("auth_code_restricted")),
      service_area_business: toBool(form.get("service_area_business")),
      storefront_required: toBool(form.get("storefront_required")),
      google_review_link: String(form.get("google_review_link") || "").trim() || null,
      google_review_link_saved: toBool(form.get("google_review_link_saved")),
      service_area_notes: String(form.get("service_area_notes") || "").trim() || null,
      notes: String(form.get("notes") || "").trim() || null,
    };
    const { error: upsertError } = await supabase.from("business_settings").upsert(payload);
    if (upsertError) return setError(upsertError.message);
    setMessage("Business details saved.");
    await load();
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Company Settings</h1>
          <p>Private admin record for legal company, payments, ICO, insurance and service-area setup.</p>
        </div>
        <div className="actions-row">
          <StatusBadge value={`Tide: ${settings.tide_account_status || "—"}`} />
          <StatusBadge value={`Stripe: ${settings.stripe_account_status || "—"}`} />
          <StatusBadge value={`Insurance: ${settings.insurance_status || "—"}`} />
        </div>
      </div>
      {loading ? <div className="notice" style={{ marginBottom: 16 }}>Loading company settings…</div> : null}
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}

      <div className="notice warn" style={{ marginBottom: 16 }}>
        Do not store the actual Companies House authentication code in visible CRM fields. Store only the yes/no confirmation. Home/admin address and compliance documents should stay admin-only.
      </div>

      <form className="card form-grid" onSubmit={save}>
        <label>Legal company name<input name="legal_company_name" defaultValue={settings.legal_company_name || ""} /></label>
        <label>Trading name<input name="trading_name" defaultValue={settings.trading_name || ""} /></label>
        <label>Company number<input name="company_number" defaultValue={settings.company_number || ""} /></label>
        <label>Company type<input name="company_type" defaultValue={settings.company_type || ""} /></label>
        <label>Incorporation date<input name="incorporation_date" type="date" defaultValue={settings.incorporation_date || ""} /></label>
        <label>Registered in<input name="registered_in" defaultValue={settings.registered_in || "England & Wales"} /></label>
        <label>Phone number<input name="phone_number" defaultValue={settings.phone_number || ""} /></label>
        <label>Website<input name="website" defaultValue={settings.website || "https://pddcleaningservices.co.uk"} /></label>
        <label>Public customer email<input name="public_customer_email" type="email" defaultValue={settings.public_customer_email || settings.business_email || ""} /></label>
        <label>Business email<input name="business_email" type="email" defaultValue={settings.business_email || ""} /></label>
        <label>Admin backup email<input name="admin_backup_email" type="email" defaultValue={settings.admin_backup_email || ""} /></label>
        <label className="full">Registered office / correspondence address<textarea name="registered_office_address" defaultValue={settings.registered_office_address || ""} /></label>
        <label className="full">Actual trading/admin address <span className="help">Admin-only. This is the real place the business is operated/administered from.</span><textarea name="actual_trading_admin_address" defaultValue={settings.actual_trading_admin_address || ""} /></label>

        <label>Tide account status<select name="tide_account_status" defaultValue={settings.tide_account_status || "Open"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Stripe account status<select name="stripe_account_status" defaultValue={settings.stripe_account_status || "Open"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Stripe payout bank<input name="stripe_payout_bank" defaultValue={settings.stripe_payout_bank || "Tide"} /></label>
        <label>Google Business Profile status<select name="google_business_profile_status" defaultValue={settings.google_business_profile_status || "Not Started"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>ICO status<select name="ico_registration_status" defaultValue={settings.ico_registration_status || "Done"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>ICO application/reference number<input name="ico_application_reference" defaultValue={settings.ico_application_reference || ""} /></label>
        <label>Solicitor review status<select name="solicitor_review_status" defaultValue={settings.solicitor_review_status || "Not Started"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Corporation Tax setup status<select name="corporation_tax_setup_status" defaultValue={settings.corporation_tax_setup_status || "Not Started"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>

        <label>Insurance status<input name="insurance_status" defaultValue={settings.insurance_status || ""} /></label>
        <label>Public liability provider<input name="public_liability_provider" defaultValue={settings.public_liability_provider || ""} /></label>
        <label>Public liability policy number<input name="public_liability_policy_number" defaultValue={settings.public_liability_policy_number || ""} /></label>
        <label>Public liability cover amount<input name="public_liability_cover_amount" inputMode="decimal" defaultValue={settings.public_liability_cover_amount || ""} /></label>
        <label>Public liability start<input name="public_liability_start_date" type="date" defaultValue={settings.public_liability_start_date || ""} /></label>
        <label>Public liability end<input name="public_liability_end_date" type="date" defaultValue={settings.public_liability_end_date || ""} /></label>
        <label>Professional indemnity status<input name="professional_indemnity_status" defaultValue={settings.professional_indemnity_status || ""} /></label>
        <label>PI provider<input name="professional_indemnity_provider" defaultValue={settings.professional_indemnity_provider || ""} /></label>
        <label>PI cover amount<input name="professional_indemnity_cover_amount" inputMode="decimal" defaultValue={settings.professional_indemnity_cover_amount || ""} /></label>
        <label>PI expiry date<input name="professional_indemnity_expiry_date" type="date" defaultValue={settings.professional_indemnity_expiry_date || ""} /></label>
        <label className="full">PI certificate upload/link<input name="professional_indemnity_certificate_upload" defaultValue={settings.professional_indemnity_certificate_upload || ""} placeholder="Secure file link" /></label>

        <label className="check-row"><input name="companies_house_auth_code_stored_securely" type="checkbox" defaultChecked={Boolean(settings.companies_house_auth_code_stored_securely)} /> Companies House auth code stored securely?</label>
        <label className="check-row"><input name="auth_code_restricted" type="checkbox" defaultChecked={settings.auth_code_restricted !== false} /> Auth code restricted from normal views?</label>
        <label className="check-row"><input name="hmrc_utr_received" type="checkbox" defaultChecked={Boolean(settings.hmrc_utr_received)} /> HMRC Corporation Tax UTR received?</label>
        <label className="check-row"><input name="vat_registered" type="checkbox" defaultChecked={Boolean(settings.vat_registered)} /> VAT registered?</label>
        <label className="check-row"><input name="actual_trading_admin_address_restricted" type="checkbox" defaultChecked={settings.actual_trading_admin_address_restricted !== false} /> Home/admin address restricted?</label>
        <label className="check-row"><input name="service_area_business" type="checkbox" defaultChecked={settings.service_area_business !== false} /> Service-area business?</label>
        <label className="check-row"><input name="storefront_required" type="checkbox" defaultChecked={Boolean(settings.storefront_required)} /> Storefront required?</label>
        <label className="full">Service-area notes<textarea name="service_area_notes" defaultValue={settings.service_area_notes || ""} /></label>
        <label className="full">Google review link<input name="google_review_link" defaultValue={settings.google_review_link || ""} placeholder="Paste Google review link when ready" /></label>
        <label className="check-row"><input name="google_review_link_saved" type="checkbox" defaultChecked={Boolean(settings.google_review_link_saved)} /> Google review link saved?</label>
        <label className="full">Notes<textarea name="notes" defaultValue={settings.notes || ""} /></label>
        <div className="full"><button className="button" type="submit">Save company settings</button></div>
      </form>
    </>
  );
}
