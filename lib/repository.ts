import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const REPO_DIRECTORY = path.resolve(process.cwd(), "repo");

export function getRepositoryRoot(): string {
  if (!existsSync(REPO_DIRECTORY)) {
    return REPO_DIRECTORY;
  }

  const entries = readdirSync(REPO_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  if (entries.length === 0) {
    return REPO_DIRECTORY;
  }

  return path.join(REPO_DIRECTORY, entries[0]);
}

export function getRepositoryName(): string {
  const repositoryRoot = getRepositoryRoot();

  if (!existsSync(repositoryRoot)) {
    return "Unknown";
  }

  return path.basename(repositoryRoot) || "Unknown";
}
