-- ============================================================
-- Update CLIENTS table - Add contact details
-- ============================================================

-- Drop the old color column and add new fields
ALTER TABLE public.clients
  DROP COLUMN IF EXISTS color,
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN company_name text,
  ADD COLUMN address text,
  ADD COLUMN email text,
  ADD COLUMN phone text; -- International format

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
