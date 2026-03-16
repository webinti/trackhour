-- Add is_paid flag to time_entries
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;

-- Index for filtering by payment status
CREATE INDEX IF NOT EXISTS idx_time_entries_is_paid ON time_entries(user_id, is_paid);
