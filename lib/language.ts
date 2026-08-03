const extensionToLanguage: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescriptreact",
  ".js": "javascript",
  ".jsx": "javascriptreact",
  ".py": "python",
  ".java": "java",
  ".go": "go",
  ".rs": "rust",
  ".md": "markdown",
};

export function detectLanguageFromPath(filePath: string): string {
  const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();

  return extensionToLanguage[extension] ?? "unknown";
}
