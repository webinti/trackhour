-- Add currency preference to teams (default EUR)
ALTER TABLE teams
  ADD COLUMN currency text NOT NULL DEFAULT 'EUR'
  CHECK (currency IN ('EUR', 'USD', 'AUD', 'CAD', 'GBP'));

-- Add description and notes to tasks
ALTER TABLE tasks
  ADD COLUMN description text,
  ADD COLUMN notes text;
