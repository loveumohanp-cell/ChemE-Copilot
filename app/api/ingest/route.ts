import { embedMany } from "ai";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { embeddingModel, embeddingOptions } from "@/lib/ai/embeddings";
import { createServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
function splitText(text: string, size = 1400, overlap = 200) { const out: string[] = []; for (let start = 0; start < text.length; start += size - overlap) out.push(text.slice(start, start + size)); return out.filter((value) => value.trim().length > 80); }
export async function POST(request: Request) { try {
 const form = await request.formData(); const file = form.get("file");
 if (!(file instanceof File) || file.type !== "application/pdf") return Response.json({ error: "Upload a PDF file." }, { status: 400 });
 if (file.size > MAX_FILE_BYTES) return Response.json({ error: "PDF must be 10 MB or smaller." }, { status: 413 });
 const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()), disableWorker: true }).promise;
 const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => { const p = await pdf.getPage(index + 1); const c = await p.getTextContent(); return c.items.map((i) => "str" in i ? i.str : "").join(" "); }));
 const pieces = pages.flatMap((text, index) => splitText(text).map((content) => ({ pageNumber: index + 1, content })));
 if (!pieces.length) return Response.json({ error: "No extractable text was found in this PDF." }, { status: 422 });
 const { embeddings } = await embedMany({ model: embeddingModel, values: pieces.map((p) => p.content), providerOptions: embeddingOptions, maxParallelCalls: 2 });
 if (embeddings.some((item) => item.length !== 1536)) throw new Error("Gemini did not return 1536-dimensional embeddings.");
 const db = createServerClient(); const key = crypto.randomUUID() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
 const { error: uploadError } = await db.storage.from("pdfs").upload(key, file, { contentType: "application/pdf", upsert: false }); if (uploadError) throw uploadError;
 const { data: document, error: documentError } = await db.from("documents").insert({ name: file.name, file_path: key, page_count: pdf.numPages }).select("id").single();
 if (documentError) { await db.storage.from("pdfs").remove([key]); throw documentError; }
 const rows = pieces.map((p, i) => ({ document_id: document.id, page_number: p.pageNumber, content: p.content, embedding: "[" + embeddings[i].join(",") + "]" }));
 const { error: insertError } = await db.from("chunks").insert(rows); if (insertError) { await db.from("documents").delete().eq("id", document.id); throw insertError; }
 return Response.json({ documentId: document.id, pageCount: pdf.numPages, chunkCount: pieces.length }, { status: 201 });
} catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 500 }); } }
