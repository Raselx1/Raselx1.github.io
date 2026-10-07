create table posts(id bigint generated always as identity primary key, title text not null, body text not null, created_at timestamptz default now());
create table messages(id bigint generated always as identity primary key, name text not null check(char_length(name)<=100), email text not null check(char_length(email)<=200), message text not null check(char_length(message)<=3000), created_at timestamptz default now());
alter table posts enable row level security;
alter table messages enable row level security;
create policy "anyone reads posts" on posts for select using (true);
create policy "admin writes posts" on posts for all to authenticated using (true) with check (true);
create policy "anyone sends message" on messages for insert to anon, authenticated with check (true);
create policy "admin reads messages" on messages for select to authenticated using (true);
create policy "admin deletes messages" on messages for delete to authenticated using (true);
