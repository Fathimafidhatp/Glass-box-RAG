import "@/lib/env";

import { ChromaClient, type Collection, type IncludeEnum } from "chromadb";

import { generateEmbedding } from "@/lib/embeddings";
import type { CodeChunk } from "@/types/codeChunk";

const CHROMA_COLLECTION_NAME = "glass-box-rag-chunks";

function getClient(): ChromaClient {
  const chromaUrl = process.env.CHROMA_URL ?? "http://localhost:8000";

  return new ChromaClient({
    path: chromaUrl,
  });
}

async function getOrCreateCollection(): Promise<Collection> {
  const client = getClient();

  try {
    return await client.getOrCreateCollection({
      name: CHROMA_COLLECTION_NAME,
      metadata: {
        description: "Code chunks for semantic retrieval in Glass Box RAG",
      },
      embeddingFunction: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Chroma collection error";
    throw new Error(`Failed to initialize Chroma collection: ${message}`);
  }
}

function toChunkMetadata(chunk: CodeChunk) {
  return {
    filePath: chunk.filePath,
    startLine: chunk.startLine,
    endLine: chunk.endLine,
    language: chunk.language,
  };
}

export async function indexRepository(chunks: CodeChunk[]): Promise<number> {
  if (!chunks.length) {
    console.log("Indexed 0 chunks.");
    return 0;
  }

  const collection = await getOrCreateCollection();

  try {
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content);

      await collection.upsert({
        ids: [chunk.id],
        embeddings: [embedding],
        documents: [chunk.content],
        metadatas: [toChunkMetadata(chunk)],
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown indexing error";
    throw new Error(`Failed to index repository chunks: ${message}`);
  }

  console.log(`Indexed ${chunks.length} chunks.`);
  return chunks.length;
}

export async function queryRepository(question: string, topK = 5) {
  if (!question.trim()) {
    throw new Error("Question text cannot be empty.");
  }

  const collection = await getOrCreateCollection();

  try {
    const embedding = await generateEmbedding(question);
    const queryResult = await collection.query({
      queryEmbeddings: [embedding],
      nResults: topK,
      include: ["documents", "metadatas", "distances"] as IncludeEnum[],
    });

    const matches = queryResult.ids?.[0] ?? [];
    const documents = queryResult.documents?.[0] ?? [];
    const metadatas = queryResult.metadatas?.[0] ?? [];
    const distances = queryResult.distances?.[0] ?? [];

    return matches.map((_, index) => ({
      content: documents[index] ?? "",
      filePath: metadatas[index]?.filePath ?? "",
      startLine: metadatas[index]?.startLine ?? 0,
      endLine: metadatas[index]?.endLine ?? 0,
      similarity: Number((1 - (distances[index] ?? 0)).toFixed(6)),
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown query error";
    throw new Error(`Failed to query repository: ${message}`);
  }
}
