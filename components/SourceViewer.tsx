"use client";

import { useEffect, useState } from "react";

type Citation = {
  path: string;
  startLine: number;
  endLine: number;
};

const placeholderCode = `export async function resolveContext(query: string) {
  const snippet = await retrieveRelevantSnippets(query);
  const result = await summarize(snippet);

  return {
    answer: result.answer,
    references: result.references,
  };
}`;

export function SourceViewer() {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [sourceContent, setSourceContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCitationClick = (event: Event) => {
      const detail = (event as CustomEvent<Citation>).detail;

      if (detail) {
        setSelectedCitation(detail);
      }
    };

    window.addEventListener("glass-box-citation-click", handleCitationClick);

    return () => {
      window.removeEventListener("glass-box-citation-click", handleCitationClick);
    };
  }, []);

  useEffect(() => {
    if (!selectedCitation) {
      setSourceContent("");
      setError("");
      return;
    }

    let isCancelled = false;

    const loadSource = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/source?path=${encodeURIComponent(selectedCitation.path)}`);

        if (!response.ok) {
          throw new Error("Failed to load source file.");
        }

        const body = (await response.json()) as { content?: string };

        if (isCancelled) {
          return;
        }

        setSourceContent(body.content ?? "");
      } catch {
        if (!isCancelled) {
          setSourceContent("");
          setError("Unable to load the selected source file.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSource();

    return () => {
      isCancelled = true;
    };
  }, [selectedCitation]);

  useEffect(() => {
    if (!selectedCitation || !sourceContent) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const firstHighlightedLine = document.getElementById(`line-${selectedCitation.startLine}`);
      const lastHighlightedLine = document.getElementById(`line-${selectedCitation.endLine}`);

      if (firstHighlightedLine) {
        firstHighlightedLine.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      if (lastHighlightedLine && firstHighlightedLine !== lastHighlightedLine) {
        lastHighlightedLine.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [selectedCitation, sourceContent]);

  const codeLines = sourceContent.split(/\r?\n/);

  return (
    <section className="flex min-h-0 flex-col rounded-[28px] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">Source Viewer</p>
          <p className="text-xs text-slate-400">Inspect the retrieved context for grounding</p>
        </div>
        {selectedCitation ? (
          <div className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-300 ring-1 ring-cyan-400/30">
            {selectedCitation.path}
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        {isLoading ? (
          <div className="flex w-full items-center justify-center rounded-xl bg-slate-950/70 p-4 text-sm text-slate-300">
            Loading source file...
          </div>
        ) : error ? (
          <div className="flex w-full items-center justify-center rounded-xl bg-slate-950/70 p-4 text-sm text-rose-300">
            {error}
          </div>
        ) : sourceContent ? (
          <div className="w-full overflow-auto rounded-xl bg-slate-950/70 p-3 text-sm leading-7 text-slate-200">
            <div className="grid min-w-full grid-cols-[auto_1fr] gap-2">
              {codeLines.map((line, index) => {
                const lineNumber = index + 1;
                const isHighlighted =
                  selectedCitation &&
                  lineNumber >= selectedCitation.startLine &&
                  lineNumber <= selectedCitation.endLine;

                return (
                  <div key={`source-row-${lineNumber}`} className="contents">
                    <div
                      className={`select-none rounded px-2 text-right text-slate-500 ${
                        isHighlighted ? "bg-cyan-500/20 text-cyan-200" : ""
                      }`}
                    >
                      {lineNumber}
                    </div>
                    <div
                      id={`line-${lineNumber}`}
                      className={`rounded px-2 whitespace-pre ${
                        isHighlighted ? "bg-cyan-500/20 text-cyan-100" : ""
                      }`}
                    >
                      {line || " "}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <pre className="w-full overflow-auto rounded-xl bg-slate-950/70 p-4 text-sm leading-7 text-slate-200">
            <code>{placeholderCode}</code>
          </pre>
        )}
      </div>
    </section>
  );
}
