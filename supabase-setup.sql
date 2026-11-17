-- MIYUU90 Digital Library: run this entire script in Supabase > SQL Editor.
create table if not exists public.books (
  book_key text primary key,
  title text not null,
  author text,
  status text not null default 'To read',
  pages integer not null default 0,
  genre text,
  isbn text,
  publisher text,
  language text,
  rating numeric,
  cover_url text,
  current_page integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.books enable row level security;
drop policy if exists "Public can view books" on public.books;
create policy "Public can view books" on public.books for select using (true);
drop policy if exists "Authenticated admins manage books" on public.books;
create policy "Authenticated admins manage books" on public.books for all to authenticated using (true) with check (true);

-- Optional: prevent public writes; only authenticated users can import/edit.
-- In Supabase Auth settings, turn OFF public sign-ups and create your own admin user manually.
