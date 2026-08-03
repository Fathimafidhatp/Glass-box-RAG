import { Database } from "lucide-react";

import { getRepositoryName } from "@/lib/repository";

export function TopBar() {
  const repositoryName = getRepositoryName();

  return (
    <header className="border-b border-white/10 bg-slate-950/80 px-5 py-4 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30">
            <span className="text-sm font-semibold">GB</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Glass Box RAG</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
          <Database className="h-4 w-4 text-cyan-300" />
          <span>{repositoryName === "Unknown" ? "No Repository Loaded" : `Repository: ${repositoryName}`}</span>
        </div>
      </div>
    </header>
  );
}
