import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/server-supabase";
import { arrayValue, bool, dateValue, getReturnUrl, isHoneypotFilled, optionalText, readIncomingPayload, verifyWebhookSecret } from "@/lib/form-ingest";
import { compactLines, fieldLine, notifyTelegram, portalLink } from "@/lib/telegram";

function formatChecklist(title: string, items: string[]) {
  if (!items.length) return null;
  return `${title}:\n- ${items.join("\n- ")}`;
}

export async function POST(request: Request) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ ok: false, error: "Invalid form webhook secret." }, { status: 401 });
  }

  const url = new URL(request.url);
  const payload = await readIncomingPayload(request);
  const returnUrl = getReturnUrl(request, payload);

  if (isHoneypotFilled(payload)) {
    if (returnUrl) return NextResponse.redirect(returnUrl, 303);
    return NextResponse.json({ ok: true });
  }

  const jobId = url.searchParams.get("job_id") || optionalText(payload, ["job_id", "job id", "linked job id", "linked_job_id"]);
  const beforePhotos = optionalText(payload, ["before_photos", "before photos", "upload before photos", "before photo link"]);
  const afterPhotos = optionalText(payload, ["after_photos", "after photos", "upload after photos", "after photo link"]);
  const anyIssues = bool(payload, ["any issues", "any_issues", "issues"]);
  const issueDescription = optionalText(payload, ["describe issue", "issue description", "issue_description"]);
  const propertySecured = bool(payload, ["property secured", "property_secured"]);
  const keysReturnedSecured = optionalText(payload, ["keys returned secured", "keys_returned_secured", "keys returned", "keys secured"]);
  const extraWorkRequested = bool(payload, ["extra work requested", "extra_work_requested"]);
  const scopeIssue = bool(payload, ["scope issue", "scope_issue"]);
  const contractorPaymentRequested = bool(payload, ["contractor payment requested", "contractor_payment_requested"]);
  const kitchenChecklist = arrayValue(payload, ["kitchen checklist", "kitchen_checklist"]);
  const bathroomChecklist = arrayValue(payload, ["bathroom checklist", "bathroom_checklist"]);
  const livingChecklist = arrayValue(payload, ["living checklist", "bedrooms living checklist", "living_checklist"]);
  const generalChecklist = arrayValue(payload, ["general checklist", "general_checklist"]);
  const addonChecklist = arrayValue(payload, ["addon checklist", "add-on checklist", "addons checklist", "addon_checklist"]);
  const unableToCompleteNotes = optionalText(payload, ["unable to complete notes", "not applicable notes", "incomplete items", "unable_to_complete_notes"]);
  const checklistNotes = [
    formatChecklist("Kitchen checklist", kitchenChecklist),
    formatChecklist("Bathroom checklist", bathroomChecklist),
    formatChecklist("Bedrooms/living checklist", livingChecklist),
    formatChecklist("General/security checklist", generalChecklist),
    formatChecklist("Add-ons checklist", addonChecklist),
    unableToCompleteNotes ? `Unable to complete / N/A notes:\n${unableToCompleteNotes}` : null,
  ].filter(Boolean).join("\n\n");

  const submission = {
    job_id: jobId || null,
    linked_job_id: jobId || null,
    contractor_name: optionalText(payload, ["contractor name", "contractor_name", "name"]),
    job_address: optionalText(payload, ["job address", "job_address", "property address", "address"]),
    date_completed: dateValue(payload, ["date completed", "date_completed", "completion date"]),
    arrival_time: optionalText(payload, ["arrival time", "arrival_time", "time arrived"]),
    time_completed: optionalText(payload, ["time completed", "time_completed", "completion time"]),
    kitchen_completed: kitchenChecklist.length > 0 || bool(payload, ["kitchen completed", "kitchen", "kitchen confirmed complete"]),
    bathroom_completed: bathroomChecklist.length > 0 || bool(payload, ["bathroom completed", "bathroom", "bathroom confirmed complete"]),
    bedrooms_completed: livingChecklist.length > 0 || bool(payload, ["bedrooms completed", "bedrooms", "bedrooms confirmed complete"]),
    general_completed: generalChecklist.length > 0 || bool(payload, ["general completed", "general", "general confirmed complete"]),
    addons_completed: arrayValue(payload, ["addons completed", "add-ons completed", "add ons completed"]).concat(addonChecklist),
    before_photos: beforePhotos,
    after_photos: afterPhotos,
    any_issues: anyIssues,
    issue_description: issueDescription,
    property_secured: propertySecured,
    checklist_completed: kitchenChecklist.length > 0 && bathroomChecklist.length > 0 && livingChecklist.length > 0 && generalChecklist.length > 0,
    keys_returned_secured: keysReturnedSecured || "Not applicable",
    extra_work_requested: extraWorkRequested,
    scope_issue: scopeIssue,
    contractor_payment_requested: contractorPaymentRequested,
    additional_notes: [optionalText(payload, ["additional notes", "notes"]), checklistNotes].filter(Boolean).join("\n\n") || null,
  };

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("job_completion_submissions").insert(submission).select("id").single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (jobId) {
    if (beforePhotos) {
      await supabase.from("job_photos").insert({
        job_id: jobId,
        photo_stage: "Before",
        title: "Before photos",
        file_link: beforePhotos,
        submitted_by: submission.contractor_name,
        notes: "Created automatically from job completion form."
      });
    }

    if (afterPhotos) {
      await supabase.from("job_photos").insert({
        job_id: jobId,
        photo_stage: "After",
        title: "After photos",
        file_link: afterPhotos,
        submitted_by: submission.contractor_name,
        notes: "Created automatically from job completion form."
      });
    }

    const updatePayload: Record<string, unknown> = {
      completion_form_submitted: true,
      before_photos_link: beforePhotos,
      after_photos_link: afterPhotos,
      completion_notes: [
        submission.additional_notes,
        issueDescription ? `Issue: ${issueDescription}` : null,
      ].filter(Boolean).join("\n\n") || null,
      property_secured: propertySecured,
      checklist_completed: true,
      access_key_returned_secured: keysReturnedSecured === "Yes" || keysReturnedSecured === "Not applicable",
      issues_reported: anyIssues || scopeIssue || extraWorkRequested,
      contractor_payment_requested: contractorPaymentRequested,
      qa_status: "Awaiting QA",
      job_status: "QA Review",
      customer_issue: anyIssues || scopeIssue,
      payment_hold: anyIssues || scopeIssue || extraWorkRequested,
      payment_hold_reason: anyIssues || scopeIssue || extraWorkRequested ? "Issue/scope/extra work reported on contractor completion form." : null,
    };

    await supabase.from("jobs").update(updatePayload).eq("id", jobId);
  }

  const completionProblems = [
    anyIssues ? "Issue reported" : null,
    scopeIssue ? "Scope issue" : null,
    extraWorkRequested ? "Extra work requested" : null,
    !beforePhotos ? "Before photos missing" : null,
    !afterPhotos ? "After photos missing" : null,
    !propertySecured ? "Property not confirmed secured" : null,
  ].filter(Boolean).join(", ");

  await notifyTelegram(compactLines([
    completionProblems ? "🚨 PDD Job Completion Needs Review" : "✅ PDD Job Completion Submitted",
    "",
    fieldLine("Contractor", submission.contractor_name),
    fieldLine("Job address", submission.job_address),
    fieldLine("Linked job ID", jobId),
    fieldLine("Date completed", submission.date_completed),
    fieldLine("Arrival time", submission.arrival_time),
    fieldLine("Time completed", submission.time_completed),
    fieldLine("Before photos", beforePhotos ? "Submitted" : "Missing"),
    fieldLine("After photos", afterPhotos ? "Submitted" : "Missing"),
    fieldLine("Issue reported", anyIssues ? "Yes" : "No"),
    fieldLine("Issue details", issueDescription),
    fieldLine("Property secured", propertySecured ? "Yes" : "No"),
    fieldLine("Keys returned/secured", keysReturnedSecured),
    fieldLine("Extra work requested", extraWorkRequested ? "Yes" : "No"),
    fieldLine("Scope issue", scopeIssue ? "Yes" : "No"),
    fieldLine("Contractor payment requested", contractorPaymentRequested ? "Yes" : "No"),
    fieldLine("Review flags", completionProblems || null),
    "",
    "Next step: QA review before contractor payment.",
    jobId ? `Open job: ${portalLink(`/jobs/${jobId}`)}` : `Open QA: ${portalLink("/qa")}`,
    `QA queue: ${portalLink("/qa")}`,
  ]));

  if (returnUrl) return NextResponse.redirect(returnUrl, 303);
  return NextResponse.json({ ok: true, submission_id: data?.id, linked_job_id: jobId });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "job-completion",
    message: "POST contractor job completion form submissions here. Include job_id to update the linked job into Awaiting QA.",
  });
}
