-- Rename daily_rate to hourly_rate in tasks table
-- Earnings are now calculated as: hours * hourly_rate (instead of (hours / 8) * daily_rate)

alter table public.tasks
  rename column daily_rate to hourly_rate;
