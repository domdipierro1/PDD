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
          <label>Name<input name="name" required /></label>
          <label>Phone<input name="phone" type="tel" required /></label>
          <label>Email<input name="email" type="email" /></label>
          <label>Postcode / area<input name="postcode_area" placeholder="e.g. Enfield, N14" required /></label>
          <label>Service needed<select name="service_needed" required><option value="">Select</option><option>End of Tenancy Cleaning</option><option>Deep Cleaning</option><option>Interior Window Cleaning</option><option>Oven Cleaning</option><option>Exterior Window Cleaning</option><option>Jet Washing</option><option>Waste Clearance</option><option>Multiple Services / Not Sure</option></select></label>
          <label>Property size<select name="property_size"><option value="">Select</option><option>Studio</option><option>1 Bed</option><option>2 Bed</option><option>3 Bed</option><option>4 Bed+</option><option>Other / Not Sure</option></select></label>
          <label>Preferred date<input name="preferred_date" type="date" /></label>
          <label>Add-ons<input name="addons" placeholder="Oven, carpets, windows, waste" /></label>
          <label className="full">Message<textarea name="message" placeholder="Condition, access, parking, urgency, or anything else useful." /></label>
          <label className="full check-row"><input name="contact_consent" value="Agreed" type="checkbox" required /> I agree for PDD Cleaning Services to contact me about this quote request.</label>
          <div className="full"><button className="button" type="submit">Send quote request</button></div>
        </form>
      </section>
    </main>
  );
}
