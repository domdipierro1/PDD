import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/server-supabase";
import { arrayValue, bool, dateValue, getReturnUrl, isHoneypotFilled, numberValue, optionalText, readIncomingPayload, text, verifyWebhookSecret } from "@/lib/form-ingest";
import { compactLines, fieldLine, notifyTelegram, portalLink } from "@/lib/telegram";

export async function POST(request: Request) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ ok: false, error: "Invalid form webhook secret." }, { status: 401 });
  }

  const payload = await readIncomingPayload(request);
  const returnUrl = getReturnUrl(request, payload);

  if (isHoneypotFilled(payload)) {
    if (returnUrl) return NextResponse.redirect(returnUrl, 303);
    return NextResponse.json({ ok: true });
  }
  const insuranceFile = optionalText(payload, ["insurance_file_link", "insurance file", "insurance certificate", "upload insurance certificate", "public liability insurance certificate"]);
  const rightToWorkFile = optionalText(payload, ["id_file_link", "right to work", "upload right to work proof", "id", "id/right to work"]);

  const rateNotes = optionalText(payload, ["rate notes", "rate_notes", "pricing notes", "usual rate notes"]);

  const notes = [
    optionalText(payload, ["describe experience", "experience notes", "experience", "cleaning experience"]),
    optionalText(payload, ["anything else", "additional notes", "notes"]),
    optionalText(payload, ["willing to do a paid test job", "test job"]) ? `Paid test job: ${optionalText(payload, ["willing to do a paid test job", "test job"])}` : null,
    "Created automatically from contractor onboarding form.",
  ].filter(Boolean).join("\n\n");

  const contractor = {
    name: text(payload, ["full name", "name", "contractor name"], "New contractor"),
    phone: optionalText(payload, ["phone", "phone number", "mobile", "telephone"]),
    email: optionalText(payload, ["email", "email address"]),
    areas_covered: arrayValue(payload, ["areas you cover", "area(s) you cover", "areas_covered", "areas covered", "area", "postcode coverage"]).join(", ") || null,
    own_transport: bool(payload, ["own transport", "own_transport", "transport"]),
    years_experience: numberValue(payload, ["years of experience", "years_experience", "experience years"]),
    eot_deep_clean_experience: bool(payload, ["eot/deep clean experience", "end of tenancy experience", "deep clean experience", "eot deep clean experience"]),
    services_offered: arrayValue(payload, ["services_offered", "services offered", "services"]).join(", ") || null,
    end_of_tenancy_experience: bool(payload, ["end_of_tenancy_experience", "end of tenancy experience", "eot experience"]),
    deep_clean_experience: bool(payload, ["deep_clean_experience", "deep clean experience"]),
    after_builders_experience: bool(payload, ["after_builders_experience", "after builders experience"]),
    oven_window_carpet_experience: optionalText(payload, ["oven_window_carpet_experience", "oven/window/carpet experience", "oven window carpet experience"]),
    oven_experience: bool(payload, ["oven experience", "oven cleaning experience"]),
    window_experience: bool(payload, ["window experience", "window cleaning experience"]),
    carpet_experience: bool(payload, ["carpet experience", "carpet cleaning experience"]),
    hmrc_status: text(payload, ["self-employed with hmrc", "hmrc_status", "self employed", "self-employed/hmrc status"], "Not Sure"),
    insurance_certificate_uploaded: bool(payload, ["own public liability insurance", "insurance", "insurance_certificate_uploaded"], Boolean(insuranceFile)),
    insurance_file_link: insuranceFile,
    insurance_expiry_date: dateValue(payload, ["insurance expiry date", "insurance_expiry_date", "expiry date"]),
    insurance_cover_amount: numberValue(payload, ["insurance cover amount", "insurance_cover_amount", "cover amount"]),
    id_right_to_work_uploaded: Boolean(rightToWorkFile) || bool(payload, ["right to work uploaded", "id/right to work uploaded"]),
    id_file_link: rightToWorkFile,
    contractor_agreement_signed: false,
    rate_card_signed: false,
    test_job_status: "Needed",
    test_job_result: "Pending",
    active_rota_approved: false,
    contractor_status: "Docs Received",
    rate_tier: "Unrated",
    fulfilment_priority: "Reserve",
    rate_discovery_status: "Rates Received",
    rate_notes: rateNotes,
    dbs_status: "Not Required",
    notes,
  };

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("contractors").insert(contractor).select("id").single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const ratePayload = {
    contractor_id: data?.id,
    rate_card_signed: false,
    effective_from: new Date().toISOString().slice(0, 10),
    studio_rate: numberValue(payload, ["studio rate", "studio_rate", "studio"]),
    one_bed_rate: numberValue(payload, ["1 bed rate", "one bed rate", "one_bed_rate"]),
    two_bed_rate: numberValue(payload, ["2 bed rate", "two bed rate", "two_bed_rate"]),
    three_bed_rate: numberValue(payload, ["3 bed rate", "three bed rate", "three_bed_rate"]),
    four_bed_rate: numberValue(payload, ["4 bed rate", "four bed rate", "four_bed_rate"]),
    deep_clean_hourly_rate: numberValue(payload, ["deep clean hourly rate", "deep_clean_hourly_rate", "deep clean rate"]),
    single_oven_rate: numberValue(payload, ["single oven rate", "single_oven_rate"]),
    double_oven_rate: numberValue(payload, ["double oven rate", "double_oven_rate"]),
    notes: rateNotes,
  };
  const hasAnyRate = Object.entries(ratePayload).some(([key, value]) => key.endsWith("_rate") && value !== null && value !== undefined);
  if (data?.id && hasAnyRate) {
    await supabase.from("contractor_rates").insert(ratePayload);
  }

  await notifyTelegram(compactLines([
    "👷 New Contractor Application",
    "",
    fieldLine("Name", contractor.name),
    fieldLine("Phone", contractor.phone),
    fieldLine("Email", contractor.email),
    fieldLine("Areas", contractor.areas_covered),
    fieldLine("Transport", contractor.own_transport ? "Yes" : "No"),
    fieldLine("Years experience", contractor.years_experience),
    fieldLine("Services", contractor.services_offered),
    fieldLine("EOT/deep clean", contractor.eot_deep_clean_experience ? "Yes" : "No"),
    fieldLine("After builders", contractor.after_builders_experience ? "Yes" : "No"),
    fieldLine("HMRC status", contractor.hmrc_status),
    fieldLine("Insurance", contractor.insurance_certificate_uploaded ? "Yes" : "No / not supplied"),
    fieldLine("Right to work", contractor.id_right_to_work_uploaded ? "Supplied" : "Missing"),
    fieldLine("Rate notes", contractor.rate_notes),
    "",
    "Next step: review docs, rates and suitability before any test job.",
    `Open contractor: ${portalLink(`/contractors/${data?.id}`)}`,
    `All contractors: ${portalLink("/contractors")}`,
  ]));

  if (returnUrl) return NextResponse.redirect(returnUrl, 303);
  return NextResponse.json({ ok: true, contractor_id: data?.id });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "contractor-onboarding",
    message: "POST contractor onboarding form submissions here to create Contractors in the PDD Operator Portal. Use ?secret=YOUR_FORM_WEBHOOK_SECRET if configured.",
  });
}
