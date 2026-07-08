# PDD Operator Portal v4 — Contractor Rate Pipeline

This version adds a practical contractor pricing and fulfilment workflow.

## New page

`/contractor-pricing`

Use this page to compare quoted cleaner rates against PDD target rates and tag contractors as:

- Core
- Premium Backup
- Reserve
- Too Expensive

## New contractor fields

Run migration `003_contractor_rate_pipeline.sql` before using the new rate fields.

New contractor fields:

- rate_tier
- fulfilment_priority
- rate_discovery_status
- reliability_score
- quality_score
- rate_notes
- last_contacted_at

## How to use

1. Message cleaners without leading with your full rate card.
2. Ask their usual rates by property size.
3. Add the cleaner in Contractors.
4. Record their quoted rates.
5. Use the Contractor Rates page to compare them against target rates.
6. Tag as Core, Premium Backup or Reserve.
7. Only mark Active after docs, agreement, rate card and trial/live trial are complete.

## Job dispatch improvement

Each job page now has:

- selected contractor tier/priority
- suggested contractor cost from the contractor's saved rate card
- apply suggested cost button
- copy contractor dispatch message button
- job-specific completion form link

## Practical rule

A cleaner asking £20 more per end-of-tenancy job can still be worth onboarding as Premium Backup if customer pricing supports the margin. Do not rely only on the cheapest cleaner.
