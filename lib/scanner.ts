import { existsSync, readdirSync, readFileSync } from "node:fs";
import * as path from "node:path";

import { chunkFileContent } from "@/lib/chunker";
import { detectLanguageFromPath } from "@/lib/language";
import type { CodeChunk } from "@/types/codeChunk";

const EXCLUDED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".md",
]);

function shouldIgnoreDirectory(name: string): boolean {
  return EXCLUDED_DIRECTORIES.has(name);
}

function shouldReadFile(filePath: string): boolean {
  return ALLOWED_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function resolveRepositoryBasePath(repositoryPath: string): string {
  const entries = readdirSync(repositoryPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !shouldIgnoreDirectory(entry.name));

  if (entries.length === 1) {
    return path.join(repositoryPath, entries[0].name);
  }

  return repositoryPath;
}

function walkRepository(
  currentPath: string,
  chunks: CodeChunk[],
  filesScanned: { count: number },
  repositoryBasePath: string,
) {
  const entries = readdirSync(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (shouldIgnoreDirectory(entry.name)) {
        continue;
      }

      walkRepository(path.join(currentPath, entry.name), chunks, filesScanned, repositoryBasePath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const resolvedFilePath = path.join(currentPath, entry.name);

    if (!shouldReadFile(resolvedFilePath)) {
      continue;
    }

    filesScanned.count += 1;

    const content = readFileSync(resolvedFilePath, "utf8");
    const language = detectLanguageFromPath(resolvedFilePath);
    const relativeFilePath = path
      .relative(repositoryBasePath, resolvedFilePath)
      .split(path.sep)
      .join("/");
    const fileChunks = chunkFileContent(relativeFilePath, content, language);

    chunks.push(...fileChunks);
  }
}

export function scanRepository(repositoryPath: string): CodeChunk[] {
  const startedAt = Date.now();
  const resolvedPath = path.resolve(repositoryPath);
  const repositoryBasePath = resolveRepositoryBasePath(resolvedPath);
  const chunks: CodeChunk[] = [];
  const filesScanned = { count: 0 };

  if (!existsSync(resolvedPath)) {
    console.log("Files scanned: 0");
    console.log("Chunks generated: 0");
    console.log(`Execution time: ${Date.now() - startedAt}ms`);

    return chunks;
  }

  walkRepository(resolvedPath, chunks, filesScanned, repositoryBasePath);

  const executionTime = Date.now() - startedAt;

  console.log(`Files scanned: ${filesScanned.count}`);
  console.log(`Chunks generated: ${chunks.length}`);
  console.log(`Execution time: ${executionTime}ms`);

  return chunks;
}
