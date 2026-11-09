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

-- Klick på telefonnummer/mejladress på sajten (api/track.mjs). Anonymt: inga cookies, IP eller ID:n sparas.
create table if not exists click_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('phone', 'email')),
  page        text,
  placement   text
);
create index if not exists click_events_created_at_idx on click_events (created_at desc);
create index if not exists click_events_kind_created_at_idx on click_events (kind, created_at);

-- Vilken sida ett formulär skickades från.
alter table leads add column if not exists page text;

-- Första sidan besökaren landade på och varifrån de kom (google, direkt, annan sajt).
alter table leads add column if not exists landing_page text;
alter table leads add column if not exists source text;

-- Kundomdömen (Google-recensioner). Visas i omdömesmodalen via /api/reviews; kan döljas utan att raderas.
create table if not exists reviews (
  id          serial primary key,
  author      text not null,
  body        text not null,
  rating      smallint not null default 5 check (rating between 1 and 5),
  source      text not null default 'google',
  published   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists reviews_published_idx on reviews (published, sort_order, id);

-- Startdata: de 15 recensioner som tidigare låg i src/data/reviews.ts. Körs bara om tabellen är tom.
insert into reviews (author, body, sort_order)
select v.author, v.body, v.sort_order from (values
  ('Marie Chenik', 'Jag är mycket nöjd med installationen av blandaren i mitt badrum av en duktig och vänlig hantverkare.', 10),
  ('Melina Sandström', 'Kom i tid. Gjorde ett mkt bra jobb.', 20),
  ('Michael Bärlin', 'Great service!', 30),
  ('Thomas Durrani', 'Helped us with installation of faucet. Very professional! The job was very well done! Can strongly recommend!', 40),
  ('Gisela Fondberg', 'Verkligen bra service. Lyhörd och trevlig personal, snabba åtgärder och bra information. Montering av badrumsutrustning gjordes utomordentligt noggrant och med perfekt resultat.', 50),
  ('Staffan Karlsson', 'Bra arbete av trevlig och hjälpsam installatör.', 60),
  ('Daniel Hermansson', 'Ringde PRM Montage och fick snabb hjälp — proffsigt utfört arbete.', 70),
  ('Magnus Påhlsson', 'Riktigt bra bemötande och kompetent hantverkare. Rekommenderas!', 80),
  ('Fredrik Österholm', 'Snabbt, tydligt och prisvärt utfört. Mycket nöjd.', 90),
  ('Margaretha Lindh', 'Professionellt bemötande — kom snabbt och gjorde ett bra jobb.', 100),
  ('Johanna S', 'Bra kommunikation genom hela projektet. Rekommenderas!', 110),
  ('Daniel Skötlund', 'Löste jobbet snabbt med ett väldigt trevligt bemötande.', 120),
  ('Georgia B', 'Snabb och professionell installation, prydligt utfört.', 130),
  ('Cecilia Lind', 'Riktigt bra hantverkare som höll vad de lovade.', 140),
  ('Tomas Paulsson', 'Mycket bra installation, effektivt och prydligt.', 150)
) as v(author, body, sort_order)
where not exists (select 1 from reviews);

-- Import av alla Google-recensioner (scripts/import-reviews.mjs): källa-id för dubblettskydd, datum och ägarsvar.
alter table reviews add column if not exists external_id text;
alter table reviews add column if not exists reviewed_at timestamptz;
alter table reviews add column if not exists owner_reply text;
create unique index if not exists reviews_external_id_key on reviews (external_id);
