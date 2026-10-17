-- ==============================================================================
-- Rizq Luxurious Villa — Direct Booking, Availability & Operations Schema
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- 1. ROOM TYPES TABLE
create table if not exists public.room_types (
  id text primary key, -- e.g. 'premium-single-capsule'
  slug text unique not null,
  name text not null,
  units_total int not null check (units_total > 0),
  base_rate_aed numeric(10, 2) not null check (base_rate_aed > 0),
  max_guests int not null check (max_guests > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. BOOKINGS TABLE
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  room_type_id text not null references public.room_types(id) on delete restrict,
  check_in date not null,
  check_out date not null,
  adults int not null default 1 check (adults >= 1),
  children int not null default 0 check (children >= 0),
  guest_name text not null,
  guest_phone text not null,
  guest_email text null,
  notes text not null default '',
  promo_code text not null default '',
  estimated_total_aed numeric(10, 2) not null default 0,
  addons jsonb not null default '[]'::jsonb,
  status text not null check (status in ('pending', 'confirmed', 'declined', 'expired', 'cancelled')),
  hold_expires_at timestamptz null,
  source text not null default 'website',
  decline_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_dates check (check_out > check_in)
);

create index if not exists idx_bookings_dates on public.bookings(room_type_id, check_in, check_out, status);
create index if not exists idx_bookings_ref on public.bookings(ref);
create index if not exists idx_bookings_status on public.bookings(status);

-- 3. BLOCKS TABLE (Manual calendar blocks + imported iCal blocks)
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  room_type_id text not null references public.room_types(id) on delete cascade,
  start_date date not null,
  end_date date not null, -- exclusive end date
  units int not null default 1 check (units > 0),
  reason text not null default '',
  source text not null default 'manual', -- 'manual', 'Airbnb iCal', etc.
  created_at timestamptz not null default now(),
  constraint check_block_dates check (end_date > start_date)
);

create index if not exists idx_blocks_dates on public.blocks(room_type_id, start_date, end_date);

-- 4. ICAL FEEDS TABLE (Inbound sync feeds from external platforms)
create table if not exists public.ical_feeds (
  id uuid primary key default gen_random_uuid(),
  room_type_id text not null references public.room_types(id) on delete cascade,
  url text not null,
  label text not null,
  last_synced_at timestamptz null,
  last_status text null,
  created_at timestamptz not null default now()
);

-- 5. AUDIT LOG TABLE (Actor-based audit trail for compliance and operations)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid null references public.bookings(id) on delete set null,
  actor text not null, -- 'guest', 'owner', 'telegram-bot', 'cron', 'system'
  action text not null, -- 'created', 'confirmed', 'declined', 'hold_expired', etc.
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_booking on public.audit_log(booking_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
alter table public.room_types enable row level security;
alter table public.bookings enable row level security;
alter table public.blocks enable row level security;
alter table public.ical_feeds enable row level security;
alter table public.audit_log enable row level security;

-- Public can read room types
create policy "Public can read room_types" on public.room_types
  for select using (true);

-- Service role has full access to all tables
create policy "Service role full access on room_types" on public.room_types
  for all using (auth.role() = 'service_role');

create policy "Service role full access on bookings" on public.bookings
  for all using (auth.role() = 'service_role');

create policy "Service role full access on blocks" on public.blocks
  for all using (auth.role() = 'service_role');

create policy "Service role full access on ical_feeds" on public.ical_feeds
  for all using (auth.role() = 'service_role');

create policy "Service role full access on audit_log" on public.audit_log
  for all using (auth.role() = 'service_role');

-- ==============================================================================
-- RACE-SAFE ADVISORY LOCK BOOKING RPC FUNCTION
-- ==============================================================================
create or replace function public.create_booking_request(
  p_ref text,
  p_room_type_id text,
  p_check_in date,
  p_check_out date,
  p_adults int,
  p_children int,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text,
  p_notes text,
  p_promo_code text,
  p_estimated_total_aed numeric,
  p_addons jsonb,
  p_hold_hours int default 12,
  p_source text default 'website'
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock_key bigint;
  v_units_total int;
  v_curr_date date;
  v_occupied int;
  v_booking public.bookings;
  v_hold_expires timestamptz;
begin
  -- 1. Take transaction-level advisory lock per room type (guarantees race-safety)
  v_lock_key := ('x' || substr(md5(p_room_type_id), 1, 15))::bit(64)::bigint;
  perform pg_advisory_xact_lock(v_lock_key);

  -- 2. Fetch room type total units
  select units_total into v_units_total
  from public.room_types
  where id = p_room_type_id;

  if not found then
    raise exception 'Room type % does not exist', p_room_type_id;
  end if;

  if p_check_out <= p_check_in then
    raise exception 'Check-out date must be strictly after check-in date';
  end if;

  -- 3. Check availability for each night [check_in, check_out)
  v_curr_date := p_check_in;
  while v_curr_date < p_check_out loop
    -- Confirmed bookings + active pending holds for this night
    select count(*) into v_occupied
    from public.bookings
    where room_type_id = p_room_type_id
      and check_in <= v_curr_date
      and check_out > v_curr_date
      and (
        status = 'confirmed'
        or (status = 'pending' and hold_expires_at > now())
      );

    -- Add manual and iCal blocks for this night
    v_occupied := v_occupied + coalesce(
      (
        select sum(units)
        from public.blocks
        where room_type_id = p_room_type_id
          and start_date <= v_curr_date
          and end_date > v_curr_date
      ),
      0
    );

    if (v_units_total - v_occupied) < 1 then
      raise exception 'Room type is sold out for night %', v_curr_date using errcode = 'P0001';
    end if;

    v_curr_date := v_curr_date + interval '1 day';
  end loop;

  -- 4. Calculate hold expiration
  v_hold_expires := now() + (p_hold_hours || ' hours')::interval;

  -- 5. Insert pending booking
  insert into public.bookings (
    ref,
    room_type_id,
    check_in,
    check_out,
    adults,
    children,
    guest_name,
    guest_phone,
    guest_email,
    notes,
    promo_code,
    estimated_total_aed,
    addons,
    status,
    hold_expires_at,
    source,
    created_at,
    updated_at
  ) values (
    p_ref,
    p_room_type_id,
    p_check_in,
    p_check_out,
    p_adults,
    p_children,
    p_guest_name,
    p_guest_phone,
    p_guest_email,
    p_notes,
    p_promo_code,
    p_estimated_total_aed,
    coalesce(p_addons, '[]'::jsonb),
    'pending',
    v_hold_expires,
    p_source,
    now(),
    now()
  )
  returning * into v_booking;

  -- 6. Record audit log entry
  insert into public.audit_log (
    booking_id,
    actor,
    action,
    meta,
    created_at
  ) values (
    v_booking.id,
    'guest',
    'created_pending_hold',
    jsonb_build_object(
      'ref', v_booking.ref,
      'hold_expires_at', v_hold_expires,
      'source', p_source
    ),
    now()
  );

  return v_booking;
end;
$$;
