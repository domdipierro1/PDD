# Job Completion Checklist Update

The public contractor job completion form now includes a room-by-room completion checklist.

Contractors must confirm:

- Kitchen checklist items
- Bathroom checklist items
- Bedrooms/living/hallway checklist items
- General finish and property security checklist items
- Optional add-ons completed, if they were booked
- Before photo link
- After photo link
- Any issues or incomplete/not-applicable items
- Contractor notes
- Final truthful completion confirmation

When submitted, the form still:

1. Creates a `job_completion_submissions` record.
2. Adds before/after photo links to `job_photos`.
3. Updates the linked job to `Completed - Awaiting QA`.
4. Sets `QA Status` to `Awaiting QA`.
5. Adds a payment hold if the contractor reports an issue.

The detailed checklist confirmations are stored inside the completion notes/additional notes, so no extra Supabase migration is required for this update.
