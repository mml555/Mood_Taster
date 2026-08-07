-- Mood Taster: profiles + Taste DNA
-- Run in the Supabase SQL editor (Dashboard → SQL).
--
-- Safe to re-run against a database that already has some of this. Postgres has
-- no "create policy if not exists", so each policy is dropped first. Without
-- that, a second run aborts partway and leaves the newer objects unapplied.

-- Profiles (username + public display fields)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 32),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]+$'),
  constraint profiles_username_unique unique (username)
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Taste DNA JSON blob (client DnaProfile).
-- v2: { version: 2, prefs: {dim: {score,confidence,samples}}, experience: {...} }
-- v1 flat Record<dim, entry> still loads; app migrates in memory on read/save.
create table if not exists public.taste_dna (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.taste_dna enable row level security;

drop policy if exists "Taste DNA readable by owner" on public.taste_dna;
create policy "Taste DNA readable by owner"
  on public.taste_dna for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Taste DNA insertable by owner" on public.taste_dna;
create policy "Taste DNA insertable by owner"
  on public.taste_dna for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Taste DNA updatable by owner" on public.taste_dna;
create policy "Taste DNA updatable by owner"
  on public.taste_dna for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Saved food favorites (catalog ids, newest first)
create table if not exists public.favorites (
  user_id uuid primary key references auth.users (id) on delete cascade,
  food_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.favorites enable row level security;

drop policy if exists "Favorites readable by owner" on public.favorites;
create policy "Favorites readable by owner"
  on public.favorites for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Favorites insertable by owner" on public.favorites;
create policy "Favorites insertable by owner"
  on public.favorites for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Favorites updatable by owner" on public.favorites;
create policy "Favorites updatable by owner"
  on public.favorites for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Auto-create profile from signup metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Resolve username → email so username sign-in can find the account.
-- Service role only, and the result never leaves the server: /api/auth/login
-- calls this, signs in, and returns only success or failure. Nothing in the
-- response reveals the address or whether the username exists.
create or replace function public.email_for_username(lookup_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found_id uuid;
  found_email text;
begin
  select id into found_id
  from public.profiles
  where username = lower(lookup_username)
  limit 1;

  if found_id is null then
    return null;
  end if;

  select email into found_email
  from auth.users
  where id = found_id;

  return found_email;
end;
$$;

-- Revoking from PUBLIC is not enough. Supabase ships default privileges that
-- GRANT EXECUTE on new functions to anon and authenticated directly, and an
-- explicit grant survives a revoke aimed at PUBLIC. Leaving those in place lets
-- anyone holding the anon key (it is public, it ships to every browser) call
-- this over /rest/v1/rpc and read any account's email, which is exactly the
-- disclosure /api/auth/login was written to prevent. Name the roles.
revoke all on function public.email_for_username(text) from public, anon, authenticated;
grant execute on function public.email_for_username(text) to service_role;

-- ---------------------------------------------------------------------------
-- P1-1 · Recommendation history (append-only picks; owner-only RLS)
-- Safe to re-run: create if not exists + drop/create policies.
-- ---------------------------------------------------------------------------
create table if not exists public.recommendation_history (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id text not null,
  intent text not null,
  rating text,
  answers jsonb,
  place jsonb,
  created_at timestamptz not null default now(),
  constraint recommendation_history_intent_check
    check (intent in ('restaurant', 'recipe', 'snack', 'clue')),
  constraint recommendation_history_rating_check
    check (rating is null or rating in ('nailed', 'kinda', 'nope'))
);

create index if not exists recommendation_history_user_created_idx
  on public.recommendation_history (user_id, created_at desc);

alter table public.recommendation_history enable row level security;

drop policy if exists "History readable by owner" on public.recommendation_history;
create policy "History readable by owner"
  on public.recommendation_history for select
  using ((select auth.uid()) = user_id);

drop policy if exists "History insertable by owner" on public.recommendation_history;
create policy "History insertable by owner"
  on public.recommendation_history for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "History updatable by owner" on public.recommendation_history;
create policy "History updatable by owner"
  on public.recommendation_history for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "History deletable by owner" on public.recommendation_history;
create policy "History deletable by owner"
  on public.recommendation_history for delete
  using ((select auth.uid()) = user_id);

-- =============================================================================
-- P1-4 · Account preferences (dietary) — APPEND ONLY
-- Run after the base profiles / taste_dna / favorites section above.
-- Safe to re-run: add column if missing; no policy rewrites for unrelated tables.
-- =============================================================================

alter table public.profiles
  add column if not exists dietary jsonb not null
  default '{"diets":[],"allergens":[]}'::jsonb;

comment on column public.profiles.dietary is
  'Owner dietary hard constraints: { diets: string[], allergens: string[] }. Synced via /api/preferences.';

-- Follow-up: recommendation_history (P1-1 above) already cascades on auth
-- user delete. DELETE /api/account also wipes that table explicitly first.
