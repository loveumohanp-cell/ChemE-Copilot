create or replace function match_chunks(query_embedding vector(1536), match_count integer default 6)
returns table (id uuid, document_id uuid, page_number integer, content text, similarity float)
language sql stable as $$
  select id, document_id, page_number, content, 1 - (embedding <=> query_embedding) as similarity
  from chunks
  order by embedding <=> query_embedding
  limit greatest(1, least(match_count, 20));
$$;
