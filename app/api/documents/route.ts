import { createServerClient } from "@/lib/supabase/server";
export async function GET() { const db = createServerClient(); const { data, error } = await db.from("documents").select("id,name,page_count,created_at").order("created_at", { ascending: false }); return error ? Response.json({ error: error.message }, { status: 500 }) : Response.json(data); }
