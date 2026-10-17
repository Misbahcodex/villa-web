-- ==============================================================================
-- RIZQ LUXURIOUS VILLA - DIRECT BOOKING PLATFORM
-- Supabase Postgres Database Schema
-- Table: inquiries
-- ==============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create inquiries table
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc'::text, now()),
  guest_name text not null,
  guest_email text,
  guest_phone text,
  room_id text not null,
  check_in date not null,
  check_out date not null,
  nights integer not null check (nights > 0),
  guests integer not null check (guests > 0),
  estimated_total_aed numeric not null check (estimated_total_aed >= 0),
  promo_code text not null default 'RIZQDIRECT',
  special_requests text,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Confirmed', 'Lost')),
  internal_notes text
);

-- Performance Indexes
create index if not exists idx_inquiries_created_at on public.inquiries(created_at desc);
create index if not exists idx_inquiries_status on public.inquiries(status);
create index if not exists idx_inquiries_check_in on public.inquiries(check_in);

-- Enable Row Level Security (RLS)
alter table public.inquiries enable row level security;

-- Policies:
-- 1. Service role (used by Next.js Route Handlers) has full administrative access
create policy "Service role has full CRUD on inquiries"
  on public.inquiries
  for all
  to service_role
  using (true)
  with check (true);

-- 2. Optional: Public anon can insert inquiries (only if client-side direct inserts are desired;
--    our platform routes inquiries safely through /api/inquiries with rate-limiting and validation)
create policy "Public insert only via server handler"
  on public.inquiries
  for insert
  to anon
  with check (true);
