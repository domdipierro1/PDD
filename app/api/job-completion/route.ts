import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/server-supabase";
import { arrayValue, bool, dateValue, getReturnUrl, optionalText, readIncomingPayload, text, verifyWebhookSecret } from "@/lib/form-ingest";

export async function POST(request: Request) {
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json({ ok: false, error: "Invalid form webhook secret." }, { status: 401 });
  }

  const url = new URL(request.url);
  const payload = await readIncomingPayload(request);
  const returnUrl = getReturnUrl(request, payload);
  const jobId = url.searchParams.get("job_id") || optionalText(payload, ["job_id", "job id", "linked job id", "linked_job_id"]);
  const beforePhotos = optionalText(payload, ["before_photos", "before photos", "upload before photos", "before photo link"]);
  const afterPhotos = optionalText(payload, ["after_photos", "after photos", "upload after photos", "after photo link"]);
  const anyIssues = bool(payload, ["any issues", "any_issues", "issues"]);
  const issueDescription = optionalText(payload, ["describe issue", "issue description", "issue_description"]);
  const propertySecured = bool(payload, ["property secured", "property_secured"]);

  const submission = {
    job_id: jobId || null,
    linked_job_id: jobId || null,
    contractor_name: optionalText(payload, ["contractor name", "contractor_name", "name"]),
    job_address: optionalText(payload, ["job address", "job_address", "property address", "address"]),
    date_completed: dateValue(payload, ["date completed", "date_completed", "completion date"]),
    time_completed: optionalText(payload, ["time completed", "time_completed", "completion time"]),
    kitchen_completed: bool(payload, ["kitchen completed", "kitchen", "kitchen confirmed complete"]),
    bathroom_completed: bool(payload, ["bathroom completed", "bathroom", "bathroom confirmed complete"]),
    bedrooms_completed: bool(payload, ["bedrooms completed", "bedrooms", "bedrooms confirmed complete"]),
    general_completed: bool(payload, ["general completed", "general", "general confirmed complete"]),
    addons_completed: arrayValue(payload, ["addons completed", "add-ons completed", "add ons completed"]),
    before_photos: beforePhotos,
    after_photos: afterPhotos,
    any_issues: anyIssues,
    issue_description: issueDescription,
    property_secured: propertySecured,
    additional_notes: optionalText(payload, ["additional notes", "notes"]),
  };

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.from("job_completion_submissions").insert(submission).select("id").single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (jobId) {
    const updatePayload: Record<string, unknown> = {
      completion_form_submitted: true,
      before_photos_link: beforePhotos,
      after_photos_link: afterPhotos,
      completion_notes: [
        submission.additional_notes,
        issueDescription ? `Issue: ${issueDescription}` : null,
      ].filter(Boolean).join("\n\n") || null,
      property_secured: propertySecured,
      qa_status: "Awaiting QA",
      job_status: "Completed - Awaiting QA",
      customer_issue: anyIssues,
      payment_hold: anyIssues,
      payment_hold_reason: anyIssues ? "Issue reported on contractor completion form." : null,
    };

    await supabase.from("jobs").update(updatePayload).eq("id", jobId);
  }

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
