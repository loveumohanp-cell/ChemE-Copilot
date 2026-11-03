import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { z } from "zod";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { retrieveSources } from "@/lib/rag/retrieve";
const requestSchema = z.object({ messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(12000) })).min(1).max(30) });
export const runtime = "nodejs";
export async function POST(request: Request) {
 try { const { messages } = requestSchema.parse(await request.json()); const question = messages.filter((m) => m.role === "user").at(-1)?.content; if (!question) return Response.json({ error: "A user question is required." }, { status: 400 });
 const sources = await retrieveSources(question); const context = sources.map((s) => "[" + s.n + "] " + s.documentName + ", p. " + s.pageNumber + ": " + s.content).join("\n\n");
 const result = streamText({ model: google("gemini-2.5-flash"), system: SYSTEM_PROMPT + "\n\nRetrieved sources:\n" + (context || "No relevant sources were found."), messages, temperature: 0.2 });
 return result.toTextStreamResponse({ headers: { "X-ChemE-Sources": Buffer.from(JSON.stringify(sources)).toString("base64"), "Cache-Control": "no-store" } });
 } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unexpected server error" }, { status: 400 }); }
}
