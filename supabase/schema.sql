create extension if not exists vector;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_path text not null unique,
  page_count integer not null check (page_count > 0),
  created_at timestamptz not null default now()
);

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  content text not null check (char_length(content) > 0),
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);
create index if not exists chunks_embedding_hnsw on chunks using hnsw (embedding vector_cosine_ops);
create index if not exists chunks_document_page on chunks(document_id, page_number);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table documents enable row level security;
alter table chunks enable row level security;
alter table messages enable row level security;
-- This starter uses the server-only service role. Add authenticated-user policies before public deployment.
