-- =====================================================================
-- AayuMarg database schema (Supabase / Postgres)
-- Run ONCE: Supabase dashboard -> SQL Editor -> New query -> paste -> Run
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).
-- =====================================================================

-- ---------- profiles (one per Clerk user) ----------
create table if not exists public.profiles (
  user_id        text primary key,               -- Clerk user id
  name           text not null default '',
  age            text not null default '',
  gender         text not null default '',
  phone          text not null default '',
  emergency      text not null default '',
  address        text not null default '',
  type           text not null default 'General Public'
                 check (type in ('Elderly', 'General Public')),
  caregiver_name  text not null default '',
  caregiver_phone text not null default '',
  updated_at     timestamptz not null default now()
);

-- ---------- vitals ----------
create table if not exists public.vitals (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  date       text not null default '',
  bp         text not null default '',
  hr         text not null default '',
  spo2       text not null default '',
  temp       text not null default '',
  sugar      text not null default '',
  weight     text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists vitals_user_created_idx on public.vitals (user_id, created_at desc);

-- ---------- documents (metadata; the file itself lives in Storage) ----------
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  name         text not null,
  size         bigint not null default 0,
  type         text not null default '',
  storage_path text not null,
  created_at   timestamptz not null default now()
);
create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);

-- ---------- doctors: ONE ROW PER CATEGORY ----------
-- The client edits this table in the Supabase "Table editor" (no code change needed):
--   whatsapp_number : doctor's WhatsApp number in +91XXXXXXXXXX format
--   fee_paise       : consultation fee in PAISE (19900 = Rs 199). 0 = free (no payment step)
--   active          : false hides the service
create table if not exists public.doctors (
  category        text primary key
                  check (category in ('elderly','second-opinion','mental-health','sexual-health','general')),
  doctor_name     text not null default '',
  whatsapp_number text,
  fee_paise       integer not null default 19900 check (fee_paise >= 0),
  active          boolean not null default true
);

insert into public.doctors (category, doctor_name, fee_paise) values
  ('elderly',        'Elderly Care Doctor',   19900),
  ('second-opinion', 'Second Opinion Doctor', 19900),
  ('mental-health',  'Mental Health Doctor',  19900),
  ('sexual-health',  'Sexual Health Doctor',  19900),
  ('general',        'General Physician',     19900)
on conflict (category) do nothing;

-- ---------- bookings ----------
create table if not exists public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  ref                 text not null unique,                 -- human code, e.g. AM-7K3Q9X
  user_id             text not null,
  category            text not null references public.doctors (category),
  service             text not null,
  booking_date        date not null,
  booking_time        time not null,
  reason              text not null default '',
  patient_id          text,
  patient_name        text,
  attachments         text[] not null default '{}',
  status              text not null default 'Awaiting payment',   -- 'Awaiting payment' | 'Confirmed'
  payment_status      text not null default 'unpaid' check (payment_status in ('unpaid', 'submitted', 'paid')),
  amount_paise        integer not null check (amount_paise >= 0),
  razorpay_order_id   text unique,
  razorpay_payment_id text,
  paid_at             timestamptz,
  utr                 text,                                 -- 12-digit UPI reference entered by the patient
  payment_submitted_at timestamptz,
  doctor_notified_at  timestamptz,                          -- set when the WhatsApp was sent
  notify_error        text,                                 -- last WhatsApp error (if any)
  created_at          timestamptz not null default now()
);
create unique index if not exists bookings_utr_unique on public.bookings (utr) where utr is not null;
create index if not exists bookings_user_created_idx on public.bookings (user_id, created_at desc);

-- ---------- SECURITY ----------
-- Row-level security ON with NO policies = the public (anon) key can read/write NOTHING.
-- Only our server (service-role key) touches these tables, always filtered by the Clerk user id.
alter table public.profiles  enable row level security;
alter table public.vitals    enable row level security;
alter table public.documents enable row level security;
alter table public.doctors   enable row level security;
alter table public.bookings  enable row level security;

-- ---------- private Storage bucket for medical files ----------
insert into storage.buckets (id, name, public)
values ('medical-docs', 'medical-docs', false)
on conflict (id) do nothing;
