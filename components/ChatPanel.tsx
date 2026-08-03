"use client";

import { ArrowUp, MessageSquareText } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Citation = {
  path: string;
  startLine: number;
  endLine: number;
};

function parseCitationSegments(content: string) {
  const regex = /\[\[file:([^\]]+):([0-9]+)-([0-9]+)\]\]/g;
  const parts: Array<string | Citation> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    parts.push({
      path: match[1],
      startLine: Number(match[2]),
      endLine: Number(match[3]),
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

export function ChatPanel() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const publishCitation = (citation: Citation) => {
    window.dispatchEvent(
      new CustomEvent("glass-box-citation-click", {
        detail: citation,
      }),
    );
  };

  const sendQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    setQuestion("");
    setMessages((current) => [
      ...current,
      { role: "user", content: trimmedQuestion },
      { role: "assistant", content: "" },
    ]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(errorBody?.error ?? "Failed to get a response from the chat API.");
      }

      if (!response.body) {
        throw new Error("The chat API did not return a readable stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        assistantContent += decoder.decode(value, { stream: true });

        setMessages((current) => {
          const next = [...current];
          next[next.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };

          return next;
        });
      }

      assistantContent += decoder.decode();

      setMessages((current) => {
        const next = [...current];
        next[next.length - 1] = {
          role: "assistant",
          content: assistantContent,
        };

        return next;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong.";

      setMessages((current) => {
        const next = [...current];
        next[next.length - 1] = {
          role: "assistant",
          content: message,
        };

        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendQuestion();
    }
  };

  return (
    <section className="flex min-h-0 flex-col rounded-[28px] border border-white/10 bg-slate-950/80 p-4 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">Chat</p>
          <p className="text-xs text-slate-400">Ask questions about your repository context</p>
        </div>
        <div className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-300 ring-1 ring-cyan-400/30">
          Ready
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="flex min-h-[220px] flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/70 p-4">
          {messages.length === 0 ? (
            <div className="flex h-full min-h-[180px] items-center justify-center text-center">
              <div className="space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30">
                  <MessageSquareText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-100">No messages yet</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Start the conversation by asking about the current repository context.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto bg-cyan-400 text-slate-950"
                    : "border border-white/10 bg-slate-900 text-slate-100"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {message.role === "assistant" && message.content.length > 0
                    ? parseCitationSegments(message.content).map((part, partIndex) => {
                        if (typeof part === "string") {
                          return <span key={`text-${partIndex}`}>{part}</span>;
                        }

                        return (
                          <button
                            key={`citation-${part.path}-${part.startLine}-${part.endLine}-${partIndex}`}
                            type="button"
                            onClick={() => publishCitation(part)}
                            className="mx-1 inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/30 transition hover:bg-cyan-500/20"
                          >
                            {part.path}
                            <span className="ml-2 text-cyan-200/90">Lines {part.startLine}–{part.endLine}</span>
                          </button>
                        );
                      })
                    : message.content || (isLoading ? "..." : "")}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-2">
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the codebase..."
            className="flex-1 border-0 bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => {
              void sendQuestion();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-400/60"
          >
            <ArrowUp className="h-4 w-4" />
            Ask
          </button>
        </div>
      </div>
    </section>
  );
}
