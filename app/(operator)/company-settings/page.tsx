"use client";

import { FormEvent, useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { supabase } from "@/lib/supabase";
import type { BusinessSettings } from "@/lib/types";
import { accountStatuses } from "@/lib/options";
import { toBool } from "@/lib/utils";

const defaultSettings: Partial<BusinessSettings> = {
  id: "default",
  legal_company_name: "PDD Services Limited",
  trading_name: "PDD Cleaning Services",
  business_email: "info@pddcleaningservices.co.uk",
  admin_backup_email: "pddserviceslimited@gmail.com",
  tide_account_status: "Open",
  stripe_account_status: "Not Started",
  insurance_status: "Not Confirmed",
  companies_house_auth_code_stored_securely: true,
  hmrc_utr_received: false,
  corporation_tax_setup_status: "Not Started",
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
      registered_office_address: String(form.get("registered_office_address") || "").trim() || null,
      actual_trading_admin_address: String(form.get("actual_trading_admin_address") || "").trim() || null,
      business_email: String(form.get("business_email") || "").trim() || null,
      admin_backup_email: String(form.get("admin_backup_email") || "").trim() || null,
      phone_number: String(form.get("phone_number") || "").trim() || null,
      tide_account_status: String(form.get("tide_account_status") || "Not Started"),
      stripe_account_status: String(form.get("stripe_account_status") || "Not Started"),
      insurance_status: String(form.get("insurance_status") || "Not Confirmed"),
      companies_house_auth_code_stored_securely: toBool(form.get("companies_house_auth_code_stored_securely")),
      hmrc_utr_received: toBool(form.get("hmrc_utr_received")),
      corporation_tax_setup_status: String(form.get("corporation_tax_setup_status") || "Not Started"),
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
          <h1>Business Details</h1>
          <p>Company identity, trading details, account setup and secure-record flags.</p>
        </div>
        <div className="actions-row">
          <StatusBadge value={`Tide: ${settings.tide_account_status || "—"}`} />
          <StatusBadge value={`Stripe: ${settings.stripe_account_status || "—"}`} />
        </div>
      </div>
      {loading ? <div className="notice" style={{ marginBottom: 16 }}>Loading company settings…</div> : null}
      {error ? <div className="notice bad" style={{ marginBottom: 16 }}>{error}</div> : null}
      {message ? <div className="notice" style={{ marginBottom: 16 }}>{message}</div> : null}

      <div className="notice warn" style={{ marginBottom: 16 }}>
        Do not store the actual Companies House authentication code in this CRM. Store only whether it has been saved securely elsewhere.
      </div>

      <form className="card form-grid" onSubmit={save}>
        <label>Legal company name<input name="legal_company_name" defaultValue={settings.legal_company_name || ""} /></label>
        <label>Trading name<input name="trading_name" defaultValue={settings.trading_name || ""} /></label>
        <label>Company number<input name="company_number" defaultValue={settings.company_number || ""} /></label>
        <label>Phone number<input name="phone_number" defaultValue={settings.phone_number || ""} /></label>
        <label>Business email<input name="business_email" type="email" defaultValue={settings.business_email || ""} /></label>
        <label>Admin backup email<input name="admin_backup_email" type="email" defaultValue={settings.admin_backup_email || ""} /></label>
        <label className="full">Registered office address<textarea name="registered_office_address" defaultValue={settings.registered_office_address || ""} /></label>
        <label className="full">Actual trading/admin address<textarea name="actual_trading_admin_address" defaultValue={settings.actual_trading_admin_address || ""} /></label>
        <label>Tide account status<select name="tide_account_status" defaultValue={settings.tide_account_status || "Open"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Stripe account status<select name="stripe_account_status" defaultValue={settings.stripe_account_status || "Not Started"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label>Insurance status<input name="insurance_status" defaultValue={settings.insurance_status || ""} placeholder="Not Confirmed / Confirmed / Renewal Due" /></label>
        <label>Corporation Tax setup status<select name="corporation_tax_setup_status" defaultValue={settings.corporation_tax_setup_status || "Not Started"}>{accountStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="check-row"><input name="companies_house_auth_code_stored_securely" type="checkbox" defaultChecked={Boolean(settings.companies_house_auth_code_stored_securely)} /> Companies House auth code stored securely?</label>
        <label className="check-row"><input name="hmrc_utr_received" type="checkbox" defaultChecked={Boolean(settings.hmrc_utr_received)} /> HMRC UTR received?</label>
        <label className="full">Notes<textarea name="notes" defaultValue={settings.notes || ""} /></label>
        <div className="full"><button className="button" type="submit">Save business details</button></div>
      </form>
    </>
  );
}
