import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/server-supabase";
import { arrayValue, bool, dateValue, getReturnUrl, isHoneypotFilled, numberValue, optionalText, readIncomingPayload, text, verifyWebhookSecret } from "@/lib/form-ingest";

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
    hmrc_status: text(payload, ["self-employed with hmrc", "hmrc_status", "self employed", "self-employed/hmrc status"], "Not Sure"),
    insurance_certificate_uploaded: bool(payload, ["own public liability insurance", "insurance", "insurance_certificate_uploaded"], Boolean(insuranceFile)),
    insurance_file_link: insuranceFile,
    insurance_expiry_date: dateValue(payload, ["insurance expiry date", "insurance_expiry_date", "expiry date"]),
    id_right_to_work_uploaded: Boolean(rightToWorkFile) || bool(payload, ["right to work uploaded", "id/right to work uploaded"]),
    id_file_link: rightToWorkFile,
    contractor_agreement_signed: false,
    rate_card_signed: false,
    test_job_status: "Needed",
    test_job_result: "Pending",
    active_rota_approved: false,
    contractor_status: "Docs Received",
    dbs_status: "Not Required",
    notes,
  };

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("contractors").insert(contractor).select("id").single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

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
