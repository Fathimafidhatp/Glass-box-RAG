import type { CodeChunk } from "@/types/codeChunk";

const CHUNK_LINE_SIZE = 50;

export function chunkFileContent(
  filePath: string,
  content: string,
  language: string,
): CodeChunk[] {
  const lines = content.split(/\r?\n/);

  if (lines.length === 0) {
    return [];
  }

  const chunks: CodeChunk[] = [];

  for (let startIndex = 0; startIndex < lines.length; startIndex += CHUNK_LINE_SIZE) {
    const startLine = startIndex + 1;
    const endLine = Math.min(startIndex + CHUNK_LINE_SIZE, lines.length);
    const chunkContent = lines.slice(startIndex, endLine).join("\n");

    chunks.push({
      id: `${filePath}:${startLine}-${endLine}`,
      filePath,
      language,
      startLine,
      endLine,
      content: chunkContent,
    });
  }

  return chunks;
}
