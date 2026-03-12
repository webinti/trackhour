-- Add pause support to time_entries
-- paused_at: timestamp of current pause start (null = not paused)
-- paused_duration: accumulated paused seconds from previous pauses

alter table public.time_entries
  add column paused_at timestamptz null,
  add column paused_duration integer not null default 0;
