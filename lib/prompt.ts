import type { queryRepository } from "@/lib/chroma";

export type RetrievalChunk = Awaited<ReturnType<typeof queryRepository>>[number];

export function buildRagPrompt(question: string, chunks: RetrievalChunk[]): string {
  const context = chunks
    .map((chunk) => {
      const citation = `[[file:${chunk.filePath}:${chunk.startLine}-${chunk.endLine}]]`;

      return [
        `Source: ${chunk.filePath}`,
        `Start line: ${chunk.startLine}`,
        `End line: ${chunk.endLine}`,
        `Code context:\n${chunk.content}`,
        `Citation tag: ${citation}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return [
    "You are a code-aware RAG assistant.",
    "Answer the user's question using the retrieved code snippets as the primary evidence.",
    "When referencing the source, include the citation tag in this exact format: [[file:path/to/file.tsx:10-25]].",
    "Do not invent file paths or line ranges.",
    "Base your answer strictly on the provided code context.",
    "If the answer is not present in the retrieved code, clearly say you cannot determine it from the repository. Never make up code, files, or functions.",
    "",
    `User question: ${question}`,
    "",
    "Retrieved code chunks:",
    context,
  ].join("\n");
}
