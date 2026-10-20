-- Run ONCE in Supabase -> SQL Editor (manual UPI payment + UTR flow). Safe to re-run.
alter table public.bookings add column if not exists utr text;
alter table public.bookings add column if not exists payment_submitted_at timestamptz;
create unique index if not exists bookings_utr_unique on public.bookings (utr) where utr is not null;

alter table public.bookings drop constraint if exists bookings_payment_status_check;
alter table public.bookings add constraint bookings_payment_status_check
  check (payment_status in ('unpaid', 'submitted', 'paid'));

-- consultation fee Rs 199 (paise)
update public.doctors set fee_paise = 19900;
alter table public.doctors alter column fee_paise set default 19900;
