# PDD Operator Portal v5.7 — Confirmed Company, Compliance, Payments, Forms and Templates

This version includes the latest confirmed business details and CRM/AppSheet-style operating blueprint before live operation.

## Confirmed business details added
- Legal company: PDD Services Limited
- Trading name: PDD Cleaning Services
- Company number: 17329999
- Company type: Private company limited by shares
- Incorporated: 9 July 2026
- Registered in: England & Wales
- Customer email: info@pddcleaningservices.co.uk
- Admin backup email: pddserviceslimited@gmail.com
- Phone: 07568 273696
- Website/domain: pddcleaningservices.co.uk
- Tide account: open
- Stripe account: set up for payment links
- ICO registration: completed/paid, reference C1984389
- Public liability: Admiral Business via Tide, policy 2BII252DPV, £1m, 15/07/2026–14/07/2027
- Professional indemnity: included on separate certificate, with certificate upload/cover/expiry fields

## Important security rules
- Do not store the actual Companies House authentication code in normal CRM fields.
- Home/trading/admin address should be admin-only.
- Insurance documents, ID/right-to-work documents and contractor bank details should be admin-only.
- Stripe secret keys must not be stored in visible CRM tables.

## New CRM areas
- Message Templates page: editable customer and contractor messages.
- Form Specs page: CRM blueprint for lead, quote, booking, contractor, dispatch, completion/QA, issue/re-clean and review forms.
- Company Settings expanded with confirmed compliance/payment/insurance details.
- Insurance page expanded with active public liability, separate PI certificate and model-confirmation fields.

## Hard contractor payment rule
Contractor payment is only eligible after:
- Customer payment cleared
- Job completed
- Completion form submitted
- Before/after photos submitted where required
- QA approved
- Property secured
- No unresolved complaint
- No damage/access/payment issue
- No payment hold

## Payment policy
- Preferred: full payment before the clean starts using Stripe Payment Links.
- Early trust-building option: deposit to secure, balance due before contractor starts.
- Tide transfer/payment request is backup.
- Manual Stripe payment links first; later add secure automation and webhooks.
