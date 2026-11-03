import { embed } from "ai";
import { embeddingModel, embeddingOptions } from "@/lib/ai/embeddings";
import { createServerClient } from "@/lib/supabase/server";
import type { Source } from "@/lib/rag/types";
export async function retrieveSources(query: string): Promise<Source[]> {
  const { embedding } = await embed({ model: embeddingModel, value: query, providerOptions: embeddingOptions });
  if (embedding.length !== 1536) throw new Error("Embedding dimension mismatch: expected 1536, received " + embedding.length);
  const db = createServerClient();
  const { data, error } = await db.rpc("match_chunks", { query_embedding: "[" + embedding.join(",") + "]", match_count: 6 });
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((row) => row.document_id))];
  const { data: docs, error: docsError } = ids.length ? await db.from("documents").select("id,name").in("id", ids) : { data: [], error: null };
  if (docsError) throw docsError;
  const names = new Map((docs ?? []).map((doc) => [doc.id, doc.name]));
  return (data ?? []).map((row, i) => ({ n: i + 1, documentId: row.document_id, documentName: names.get(row.document_id) ?? "Unknown document", pageNumber: row.page_number, content: row.content, similarity: row.similarity }));
}
