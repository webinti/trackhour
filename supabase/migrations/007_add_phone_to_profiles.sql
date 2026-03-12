-- Add phone_number to profiles for contact info in settings
alter table public.profiles
  add column phone_number text null;
