-- Per-entry choice to include work description / notes in the PDF report
ALTER TABLE time_entries
  ADD COLUMN show_work_description boolean NOT NULL DEFAULT false,
  ADD COLUMN show_work_notes boolean NOT NULL DEFAULT false;
