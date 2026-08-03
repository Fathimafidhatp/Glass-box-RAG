import { queryRepository } from "../lib/chroma";

async function runQuery() {
  const question = process.argv[2] ?? "Where is report generation implemented?";

  try {
    const results = await queryRepository(question, 5);

    console.log(`\nQuery: ${question}`);
    console.log("\nRetrieved chunks:");

    if (!results.length) {
      console.log("No matching chunks found.");
      return;
    }

    results.forEach((chunk, index) => {
      console.log(`\nChunk ${index + 1}:`);
      console.log(JSON.stringify(chunk, null, 2));
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown query error";
    console.error(`Query failed: ${message}`);
    process.exitCode = 1;
  }
}

void runQuery();
