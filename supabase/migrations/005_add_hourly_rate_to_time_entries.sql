-- Add hourly_rate to time_entries so each entry carries its own billing rate
-- This allows editing the rate per entry independently of the task

alter table public.time_entries
  add column hourly_rate numeric(10,2);
