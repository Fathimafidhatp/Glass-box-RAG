import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { getRepositoryRoot } from "@/lib/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedPath = url.searchParams.get("path");

  if (!requestedPath) {
    return Response.json({ error: "Missing source path." }, { status: 400 });
  }

  try {
    const repositoryRoot = path.resolve(getRepositoryRoot());
    const normalizedRequestedPath = path.normalize(requestedPath);
    const resolvedFilePath = path.resolve(repositoryRoot, normalizedRequestedPath);
    const relativePath = path.relative(repositoryRoot, resolvedFilePath);

    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath) ||
      normalizedRequestedPath === ".." ||
      normalizedRequestedPath.startsWith(`..${path.sep}`)
    ) {
      return Response.json({ error: "Path traversal is not allowed." }, { status: 400 });
    }

    if (!existsSync(resolvedFilePath) || !statSync(resolvedFilePath).isFile()) {
      return Response.json({ error: "Unable to load source content." }, { status: 404 });
    }

    const content = readFileSync(resolvedFilePath, "utf8");

    return Response.json({ content });
  } catch {
    return Response.json({ error: "Unable to load source content." }, { status: 404 });
  }
}
