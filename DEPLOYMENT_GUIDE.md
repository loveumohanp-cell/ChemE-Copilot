# Deployment guide

## Local prerequisites

- Node.js 20.9+
- A Google AI Studio Gemini API key
- A Supabase project with pgvector available

## Supabase

Run schema.sql, then the migration. Create a Storage bucket named pdfs. Keep it private; the supplied server routes read it with SUPABASE_SERVICE_ROLE_KEY. For a public production app, add Supabase Auth and RLS policies that scope documents and chunks to the authenticated user. Do not publish the service role key.

## Environment

Copy .env.example to .env.local. GOOGLE_GENERATIVE_AI_API_KEY is read automatically by @ai-sdk/google. The NEXT_PUBLIC variables are safe to expose; SUPABASE_SERVICE_ROLE_KEY is server-only.

## Vercel

Push this directory to a repository, import it in Vercel, and add the same variables in Project Settings > Environment Variables. Use Node 20+. Deploy after database setup. Upload a small text PDF and ask a grounded question as a smoke test.

## Operational checks

- Confirm /api/ingest returns 201 and a nonzero chunkCount.
- Confirm /api/chat returns streamed text and an X-ChemE-Sources response header.
- Confirm each embedding is 1536 dimensions.
- Add authentication, rate limiting, logging, retention rules, and malware scanning before allowing untrusted public uploads.
