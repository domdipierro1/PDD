export default function QuoteRequestPage() {
  return (
    <main className="public-page">
      <section className="public-card">
        <div className="public-logo"><img src="/logo.jpg" alt="PDD Cleaning Services" /></div>
        <p className="eyebrow-lite">PDD Cleaning Services</p>
        <h1>Get a cleaning quote</h1>
        <p className="muted">Send the basics. The enquiry will appear inside the PDD Operator Portal as a new lead.</p>
        <form className="form-grid" action="/api/website-enquiry?return_url=/form-thank-you?type=quote" method="POST">
          <input className="hidden-field" name="company" tabIndex={-1} autoComplete="off" />
          <input type="hidden" name="lead_source" value="Portal quote form" />
          <label>Name<input name="name" required /></label>
          <label>Phone<input name="phone" type="tel" required /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Service needed<select name="service_needed" required><option value="">Select</option><option>End of tenancy cleaning</option><option>Deep cleaning</option><option>After builders cleaning</option><option>Oven cleaning</option><option>Interior window cleaning</option><option>Exterior window cleaning</option><option>Carpet cleaning</option><option>Waste clearance</option><option>Jet washing / pressure washing</option><option>Multiple services / not sure</option></select></label>
          <label>Add-ons<input name="addons" placeholder="Oven, carpets, windows, waste" /></label>
          <label>Property size<select name="property_size"><option value="">Select</option><option>Studio</option><option>1 Bed</option><option>2 Bed</option><option>3 Bed</option><option>4 Bed+</option><option>5 Bed+</option><option>Other / Not Sure</option></select></label>
          <label>Preferred date<input name="preferred_date" type="date" /></label>
          <label>Postcode<input name="postcode_area" placeholder="e.g. EN1, N14" required /></label>
          <label>Full address<input name="address" placeholder="Full property address" required /></label>
          <label className="full">Property condition<textarea name="property_condition" placeholder="Empty/furnished, heavy staining, pets, mould/limescale, after builders dust, etc." /></label>
          <label className="full">Access, parking and key notes<textarea name="access_parking_key_notes" placeholder="Keys, codes, concierge, parking restrictions, loading, permits, utilities, access times." /></label>
          <label className="full">Photos link, optional<input name="photos_link" placeholder="Optional Google Drive/photo link" /></label>
          <label className="full">Anything else we should know<textarea name="message" placeholder="Anything else useful for quoting and planning the clean." /></label>
          <label className="full check-row"><input name="contact_consent" value="Agreed" type="checkbox" required /> I agree for PDD Cleaning Services to contact me about this quote request.</label>
          <div className="full"><button className="button" type="submit">Send quote request</button></div>
        </form>
      </section>
    </main>
  );
}
