import { NextResponse } from "next/server";
import { suggestedBaseQuote } from "@/lib/quote";
import { createServiceSupabaseClient } from "@/lib/server-supabase";
import { arrayValue, getReturnUrl, isHoneypotFilled, optionalText, readIncomingPayload, text } from "@/lib/form-ingest";
import { compactLines, fieldLine, notifyTelegram, portalLink } from "@/lib/telegram";

export async function POST(request: Request) {
  const payload = await readIncomingPayload(request);
  const returnUrl = getReturnUrl(request, payload);

  // Quietly accept spam-bot submissions where the hidden honeypot has been filled.
  if (isHoneypotFilled(payload)) {
    if (returnUrl) return NextResponse.redirect(returnUrl, 303);
    return NextResponse.json({ ok: true });
  }

  const propertySize = optionalText(payload, ["property_size", "property size", "property", "size"]);
  const serviceNeeded = optionalText(payload, ["service_needed", "service needed", "service", "cleaning service"]);
  const message = optionalText(payload, ["message", "notes", "details", "condition_notes", "property condition"]);

  const lead = {
    customer_name: text(payload, ["customer_name", "customer name", "name", "full name"], "Website enquiry"),
    phone: optionalText(payload, ["phone", "phone number", "mobile", "telephone"]),
    email: optionalText(payload, ["email", "email address"]),
    address: optionalText(payload, ["address", "property address", "job address"]),
    postcode: optionalText(payload, ["postcode", "postcode_area", "postcode / area", "area", "location"]),
    property_size: propertySize,
    service_needed: serviceNeeded,
    preferred_date: optionalText(payload, ["preferred_date", "preferred date", "date", "job date"]),
    addons: arrayValue(payload, ["addons", "add-ons", "add ons", "extras", "additional services"]),
    condition_notes: message,
    access_notes: optionalText(payload, ["access_notes", "access notes", "access"]),
    parking_notes: optionalText(payload, ["parking_notes", "parking notes", "parking"]),
    lead_source: text(payload, ["lead_source", "lead source", "source"], "Website"),
    quote_status: "Quote Needed",
    suggested_customer_quote: suggestedBaseQuote(propertySize || "") || null,
    notes: [
      "Created automatically from website enquiry form.",
      optionalText(payload, ["contact_consent", "consent"]) ? `Consent: ${optionalText(payload, ["contact_consent", "consent"])}` : null,
    ].filter(Boolean).join("\n"),
  };

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("leads").insert(lead).select("id").single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  await notifyTelegram(compactLines([
    "🧽 New PDD Customer Enquiry",
    "",
    fieldLine("Name", lead.customer_name),
    fieldLine("Phone", lead.phone),
    fieldLine("Email", lead.email),
    fieldLine("Service", lead.service_needed),
    fieldLine("Property", lead.property_size),
    fieldLine("Area/Postcode", lead.postcode),
    fieldLine("Preferred date", lead.preferred_date),
    fieldLine("Add-ons", lead.addons),
    fieldLine("Suggested quote", lead.suggested_customer_quote ? `£${lead.suggested_customer_quote}` : null),
    fieldLine("Message", lead.condition_notes),
    "",
    `Open lead: ${portalLink(`/leads/${data?.id}`)}`,
    `All leads: ${portalLink("/leads")}`,
  ]));

  if (returnUrl) return NextResponse.redirect(returnUrl, 303);
  return NextResponse.json({ ok: true, lead_id: data?.id });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "website-enquiry",
    message: "POST website quote form submissions here to create Leads in the PDD Operator Portal.",
  });
}
