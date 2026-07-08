export default function ContractorOnboardingPage() {
  return (
    <main className="public-page">
      <section className="public-card">
        <div className="public-logo"><img src="/logo.jpg" alt="PDD Cleaning Services" /></div>
        <p className="eyebrow-lite">Contractor onboarding</p>
        <h1>PDD Cleaning Services contractor details</h1>
        <p className="muted">Complete this form if you are interested in taking cleaning jobs from PDD. This does not give app access or guarantee work.</p>
        <form className="form-grid" action="/api/contractor-onboarding?public=1&return_url=/form-thank-you?type=contractor" method="POST">
          <input className="hidden-field" name="company" tabIndex={-1} autoComplete="off" />
          <label>Full name<input name="full name" required /></label>
          <label>Phone number<input name="phone number" type="tel" required /></label>
          <label>Email address<input name="email address" type="email" required /></label>
          <label>Areas covered<input name="areas covered" placeholder="e.g. Enfield, Southgate, Wood Green" required /></label>
          <label>Own transport?<select name="own transport"><option>Yes</option><option>No</option></select></label>
          <label>Years of experience<input name="years of experience" type="number" min="0" /></label>
          <label>EOT/deep clean experience?<select name="eot/deep clean experience"><option>Yes</option><option>No</option></select></label>
          <label>Self-employed with HMRC?<select name="self-employed with hmrc"><option>Yes</option><option>No</option><option>Not Sure</option></select></label>
          <label>Own public liability insurance?<select name="own public liability insurance"><option>Yes</option><option>No</option></select></label>
          <label>Insurance expiry date<input name="insurance expiry date" type="date" /></label>
          <label className="full">Insurance certificate link <span className="help">Google Drive, Dropbox or other secure link for now.</span><input name="insurance file" placeholder="https://..." /></label>
          <label className="full">Right-to-work / ID link <span className="help">Secure link for now. Do not send by public comment or social media.</span><input name="right to work" placeholder="https://..." /></label>
          <label>Willing to do a paid trial/live trial?<select name="willing to do a paid test job"><option>Yes</option><option>No</option></select></label>
          <fieldset className="checklist-group full">
            <legend>Your usual rates</legend>
            <p className="help checklist-help">Please put what you would normally charge. PDD confirms the exact job and rate before you accept any work.</p>
            <div className="form-grid">
              <label>Studio EOT<input name="studio rate" inputMode="decimal" placeholder="e.g. 60" /></label>
              <label>1 Bed EOT<input name="1 bed rate" inputMode="decimal" placeholder="e.g. 100" /></label>
              <label>2 Bed EOT<input name="2 bed rate" inputMode="decimal" placeholder="e.g. 160" /></label>
              <label>3 Bed EOT<input name="3 bed rate" inputMode="decimal" placeholder="e.g. 200" /></label>
              <label>4 Bed+ EOT<input name="4 bed rate" inputMode="decimal" placeholder="Agreed per job" /></label>
              <label>Deep clean hourly<input name="deep clean hourly rate" inputMode="decimal" placeholder="e.g. 20" /></label>
              <label>Single oven<input name="single oven rate" inputMode="decimal" /></label>
              <label>Double oven<input name="double oven rate" inputMode="decimal" /></label>
            </div>
          </fieldset>
          <label className="full">Rate notes<textarea name="rate notes" placeholder="Any extra charges, travel limits, parking, equipment, team size, etc." /></label>
          <label className="full">Describe your experience<textarea name="describe experience" /></label>
          <label className="full">Anything else?<textarea name="anything else" /></label>
          <div className="full"><button className="button" type="submit">Submit contractor details</button></div>
        </form>
      </section>
    </main>
  );
}
