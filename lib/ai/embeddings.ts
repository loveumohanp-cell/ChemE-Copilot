import { google } from "@ai-sdk/google";
export const embeddingModel = google.textEmbeddingModel("gemini-embedding-001");
export const embeddingOptions = { google: { outputDimensionality: 1536 } } as const;
