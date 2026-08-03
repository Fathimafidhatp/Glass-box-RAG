import "@/lib/env";

import { env, pipeline, type FeatureExtractionPipelineType } from "@xenova/transformers";

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
let extractorPromise: Promise<FeatureExtractionPipelineType> | null = null;

env.allowRemoteModels = true;

env.localModelPath = env.localModelPath;

async function getEmbeddingExtractor(): Promise<FeatureExtractionPipelineType> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", EMBEDDING_MODEL);
  }

  return extractorPromise;
}

function normalizeEmbedding(result: unknown): number[] {
  if (typeof result === "object" && result !== null && "data" in result) {
    const typedResult = result as { data?: Float32Array | number[] | number[][] };
    if (typedResult.data instanceof Float32Array) {
      return Array.from(typedResult.data);
    }

    if (Array.isArray(typedResult.data)) {
      if (typeof typedResult.data[0] === "number") {
        return typedResult.data as number[];
      }

      if (Array.isArray(typedResult.data[0])) {
        return (typedResult.data[0] as number[]) ?? [];
      }
    }
  }

  throw new Error("Unexpected embedding response format from the local transformer pipeline.");
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Embedding input text cannot be empty.");
  }

  try {
    const extractor = await getEmbeddingExtractor();
    const response = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    return normalizeEmbedding(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown embedding error";
    throw new Error(`Failed to generate embedding: ${message}`);
  }
}
