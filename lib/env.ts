import { resolve } from "node:path";
import dotenv from "dotenv";

const envFiles = [".env", ".env.local"];

for (const envFile of envFiles) {
  dotenv.config({
    path: resolve(process.cwd(), envFile),
    override: false,
  });
}
