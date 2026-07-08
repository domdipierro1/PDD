type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

const kitchenChecklist = [
  "Cupboards and drawers cleaned inside/out where accessible",
  "Worktops, surfaces, tiles and splashback cleaned",
  "Sink, taps and draining area cleaned/descaled where possible",
  "Hob and extractor exterior cleaned",
  "Oven, fridge/freezer cleaned if included in job scope",
  "Kitchen floor, skirting, doors and handles cleaned",
];

const bathroomChecklist = [
  "Toilet cleaned and sanitised",
  "Bath/shower, screen and fittings cleaned/descaled where possible",
  "Sink, taps and vanity area cleaned",
  "Tiles, grout and visible limescale treated where possible",
  "Mirrors, extractor, shelves and surfaces cleaned",
  "Bathroom floor, skirting, doors and handles cleaned",
];

const livingChecklist = [
  "Bedrooms, living areas and hallway surfaces cleaned",
  "Skirting boards, switches, sockets, doors and frames wiped",
  "Wardrobes/cupboards cleaned where empty and included",
  "Windows, sills and ledges cleaned internally if included",
  "Radiators, cobwebs and accessible high/low areas checked",
  "Floors vacuumed/mopped; carpets vacuumed unless carpet clean booked",
];

const generalChecklist = [
  "All agreed rooms checked against the job details",
  "Add-ons completed where booked",
  "Before photos uploaded/provided",
  "After photos uploaded/provided",
  "Any damage, access issue or incomplete item reported below",
  "Keys/access instructions followed and property secured before leaving",
];

const addonChecklist = [
  "Oven cleaning completed",
  "Carpet cleaning completed",
  "Interior windows completed",
  "Exterior windows completed",
  "Waste clearance completed",
  "Jet washing completed",
];

function ChecklistGroup({ title, intro, name, items, required = true }: { title: string; intro?: string; name: string; items: string[]; required?: boolean }) {
  return (
    <fieldset className="checklist-group full">
      <legend>{title}</legend>
      {intro ? <p className="help checklist-help">{intro}</p> : null}
      <div className="checklist-items">
        {items.map((item) => (
          <label className="check-row checklist-row" key={item}>
            <input type="checkbox" name={name} value={item} required={required} />
            <span>{item}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default async function JobCompletionPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const jobId = stringParam(params.job_id);
  const jobAddress = stringParam(params.job_address);
  const contractorName = stringParam(params.contractor_name);

  return (
    <main className="public-page">
      <section className="public-card">
        <div className="public-logo"><img src="/logo.jpg" alt="PDD Cleaning Services" /></div>
        <p className="eyebrow-lite">Job completion</p>
        <h1>Submit job sign-off</h1>
        <p className="muted">Complete this after the clean. Tick each checklist item once complete, add photos, and leave notes for anything PDD needs to know.</p>
        {!jobId ? <div className="notice warn" style={{ marginBottom: 16 }}>This form is missing a job ID. Ask PDD to resend the job-specific link.</div> : null}

        <form className="form-grid" action="/api/job-completion?public=1&return_url=/form-thank-you?type=completion" method="POST">
          <input className="hidden-field" name="company" tabIndex={-1} autoComplete="off" />
          <input type="hidden" name="job_id" value={jobId} />

          <label>Contractor name<input name="contractor name" defaultValue={contractorName} required /></label>
          <label>Job address<input name="job address" defaultValue={jobAddress} required /></label>
          <label>Date completed<input name="date completed" type="date" required /></label>
          <label>Time completed<input name="time completed" placeholder="e.g. 16:30" required /></label>

          <div className="notice full">
            <strong>Required completion checklist</strong><br />
            Tick each item only once it has been completed. If something cannot be completed or is not applicable, explain it clearly in the notes before submitting.
          </div>

          <ChecklistGroup title="Kitchen" name="kitchen checklist" items={kitchenChecklist} />
          <ChecklistGroup title="Bathroom(s)" name="bathroom checklist" items={bathroomChecklist} />
          <ChecklistGroup title="Bedrooms, living areas and hallway" name="living checklist" items={livingChecklist} />
          <ChecklistGroup title="General finish and security" name="general checklist" items={generalChecklist} />
          <ChecklistGroup title="Add-ons completed, if booked" name="addon checklist" items={addonChecklist} required={false} intro="Only tick add-ons that were included in the job details." />

          <label className="full">Add-ons completed summary<input name="addons completed" placeholder="Oven, carpets, windows, waste, none" /></label>
          <label className="full">BEFORE photos link <span className="help">Paste Google Drive/shared folder link for before photos.</span><input name="before photos" placeholder="https://..." required /></label>
          <label className="full">AFTER photos link <span className="help">Paste Google Drive/shared folder link for after photos.</span><input name="after photos" placeholder="https://..." required /></label>

          <label>Any issues?<select name="any issues"><option>No</option><option>Yes</option></select></label>
          <label>Property secured?<select name="property secured"><option>Yes</option><option>No</option></select></label>

          <label className="full">Unable to complete / not applicable items<textarea name="unable to complete notes" placeholder="List anything not completed, not accessible, heavily stained, damaged, missing utilities, locked rooms, parking/access issues, etc." /></label>
          <label className="full">Describe issue, if any<textarea name="describe issue" placeholder="Use this for customer/property/access/damage issues that PDD should review before QA approval." /></label>
          <label className="full">Contractor notes<textarea name="additional notes" placeholder="Any useful note for PDD, including time spent, customer/agent comments, keys left, extra work done, or follow-up required." /></label>

          <label className="check-row full final-confirmation">
            <input type="checkbox" name="final contractor confirmation" value="Confirmed" required />
            <span>I confirm the checklist has been completed truthfully, before/after photos have been provided, any issues are noted above, and the property has been secured according to the job instructions.</span>
          </label>

          <div className="full"><button className="button" type="submit" disabled={!jobId}>Submit job completion</button></div>
        </form>
      </section>
    </main>
  );
}
