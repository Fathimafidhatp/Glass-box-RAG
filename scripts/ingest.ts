import "@/lib/env";

import { indexRepository } from "../lib/chroma";
import { scanRepository } from "../lib/scanner";

async function main() {
  try {
    console.log("Repository scanned");
    const chunks = scanRepository("./repo");

    console.log("Generating embeddings...");
    const indexedCount = await indexRepository(chunks);

    console.log(`Indexed ${indexedCount} chunks.`);
    console.log("Completed successfully.");

    console.log("\nFirst five chunks:");

    chunks.slice(0, 5).forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1}:`);
      console.log(
        JSON.stringify(
          {
            id: chunk.id,
            filePath: chunk.filePath,
            language: chunk.language,
            startLine: chunk.startLine,
            endLine: chunk.endLine,
            content: chunk.content,
          },
          null,
          2,
        ),
      );
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error";
    console.error(`Ingestion failed: ${message}`);
    process.exitCode = 1;
  }
}

void main();
