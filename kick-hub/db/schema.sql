-- =====================================================================
-- Kick Hub — schema.sql
-- ---------------------------------------------------------------------
-- COMO USAR:
--   1. Painel do Supabase → SQL Editor → New query
--   2. Cole TODO este arquivo e clique em "Run"
--   3. Depois rode o seed.sql (dados iniciais)
--
-- Modelo de segurança (RLS rigoroso):
--   • RLS habilitado em todas as tabelas.
--   • Usuário ANÔNIMO (não logado) NÃO acessa NADA — nem leitura.
--   • Apenas usuários AUTENTICADOS leem e escrevem (hub pessoal).
--   • A chave service_role (usada aqui no SQL Editor) ignora o RLS, então
--     o seed funciona normalmente.
-- =====================================================================

-- ---------- Tabelas ----------
create table if not exists public.subjects (
  id          text primary key,
  title       text not null,
  description text,
  theme       text,
  order_index int  default 0,
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.modules (
  id          text primary key,
  subject_id  text not null references public.subjects(id) on delete cascade,
  title       text,
  subtitle    text,
  summary     text,
  key_points  jsonb default '[]'::jsonb,
  glossary    jsonb default '[]'::jsonb,
  concepts    jsonb default '[]'::jsonb,
  facts       jsonb default '[]'::jsonb,
  order_index int  default 0,
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.works (
  id          text primary key,
  title       text,
  subtitle    text,
  theme       text,
  icon        text,
  url         text,
  order_index int  default 0,
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table if not exists public.calendar_events (
  id          text primary key,
  date        date not null,
  subject_id  text references public.subjects(id) on delete set null,
  title       text,
  "time"      text,
  type        text,
  warnings    jsonb default '[]'::jsonb,
  order_index int  default 0,
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index if not exists idx_modules_subject on public.modules(subject_id);
create index if not exists idx_events_date     on public.calendar_events(date);

-- ---------- updated_at automático ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['subjects','modules','works','calendar_events'] loop
    execute format('drop trigger if exists trg_touch_%1$s on public.%1$s;', t);
    execute format(
      'create trigger trg_touch_%1$s before update on public.%1$s
         for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ---------- Row Level Security ----------
alter table public.subjects        enable row level security;
alter table public.modules         enable row level security;
alter table public.works           enable row level security;
alter table public.calendar_events enable row level security;

-- Recria as políticas de forma idempotente.
do $$
declare t text;
begin
  foreach t in array array['subjects','modules','works','calendar_events'] loop
    execute format('drop policy if exists "%1$s_authenticated_all" on public.%1$s;', t);
    -- Acesso TOTAL apenas para autenticados; anônimo é negado por padrão.
    execute format(
      'create policy "%1$s_authenticated_all" on public.%1$s
         for all
         to authenticated
         using (true)
         with check (true);', t);
  end loop;
end $$;

-- =====================================================================
-- OPCIONAL — Multiusuário (cada conta vê só os SEUS dados):
-- Se um dia quiser isolar por usuário, adicione em cada tabela:
--     owner uuid not null default auth.uid()
-- e troque o using/with check por:
--     using (owner = auth.uid()) with check (owner = auth.uid())
-- Para o hub pessoal atual (uma conta), o modelo acima já é seguro.
-- =====================================================================
