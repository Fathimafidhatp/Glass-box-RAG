export interface CodeChunk {
  id: string;
  filePath: string;
  language: string;
  startLine: number;
  endLine: number;
  content: string;
}
