-- Add work description and notes to time entries
ALTER TABLE time_entries
  ADD COLUMN work_description text,
  ADD COLUMN work_notes text;
