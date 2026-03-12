alter table public.teams
  add column if not exists company_name text null,
  add column if not exists company_address text null,
  add column if not exists company_email text null;
