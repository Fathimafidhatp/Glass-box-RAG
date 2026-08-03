import "@/lib/env";

import { queryRepository } from "../lib/chroma";

async function main() {
  try {
    const results = await queryRepository(
      "Where is the architecture report generated?"
    );

    console.log("\nTop Matches:\n");
    console.log(results);
  } catch (error) {
    console.error(error);
  }
}

main();