-- Egna tabeller för admin. Better Auths tabeller (user, session, account, verification)
-- skapas separat med `npx @better-auth/cli migrate --config lib/auth.mjs`.

create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  type          text not null default 'contact',   -- offert | jour | contact | hire | area
  name          text not null,
  email         text,
  phone         text not null,
  service       text,
  message       text,
  address       text,
  postal_code   text,
  city          text,
  area          text,
  attachments   jsonb not null default '[]'::jsonb, -- [{ filename, url }]
  status        text not null default 'ny' check (status in ('ny', 'hanterad', 'arkiverad')),
  notes         text,
  handled_by    text references "user"(id) on delete set null,
  handled_at    timestamptz
);
create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);

create table if not exists activity_log (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     text references "user"(id) on delete set null,
  action      text not null,   -- lead.created | lead.status | user.invited | user.removed | login ...
  subject     text,            -- läsbar beskrivning, t.ex. namnet på leadet
  meta        jsonb not null default '{}'::jsonb
);
create index if not exists activity_log_created_at_idx on activity_log (created_at desc);
