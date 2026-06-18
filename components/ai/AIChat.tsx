"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { Sparkles, ArrowUp, FileText } from "lucide-react";
import { nanoid } from "nanoid";

/**
 * AI assistant grounded in the current board. Streams answers from the
 * /api/ai/chat route (OpenRouter → Claude) with context built from the user's
 * nodes, and surfaces citations that deep-link back to canvas nodes.
 */
export function AIChat() {
  const nodes = useStore((s) => s.nodes);
  const select = useStore((s) => s.select);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const userMsg: ChatMessage = { id: nanoid(), role: "user", content: q };
    const assistantId = nanoid();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          context: nodes.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            tags: n.tags,
          })),
        }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "AI request failed" }));
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: err.error || "AI is not configured. Add OpenRouter keys to .env.local." }
              : msg
          )
        );
        return;
      }

      // Citations are returned via a response header (node ids).
      const citeHeader = res.headers.get("x-citations");
      const citations = citeHeader
        ? (JSON.parse(citeHeader) as { nodeId: string; title: string; score: number }[])
        : undefined;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content: acc, citations } : msg
          )
        );
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }
    } catch {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: "Something went wrong reaching the AI service." }
            : msg
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    "Summarize this board",
    "What connects the motor notes?",
    "What am I missing?",
  ];

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-10 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Sparkles size={20} />
            </div>
            <p className="text-[14px] font-medium text-ink">AI that understands you</p>
            <p className="mt-1 max-w-[220px] text-[12px] text-ink-faint">
              Ask anything about your canvas. Answers are grounded in your notes.
            </p>
            <div className="mt-4 flex w-full flex-col gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-left text-[12px] text-ink-muted transition hover:border-accent-ring hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-[13px] text-white"
                    : "max-w-full text-[13px] leading-relaxed text-ink-muted"
                }
              >
                {m.content || (
                  <span className="inline-flex gap-1">
                    <Dot /> <Dot /> <Dot />
                  </span>
                )}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.citations.map((c) => (
                      <button
                        key={c.nodeId}
                        onClick={() => select(c.nodeId)}
                        className="flex items-center gap-1 rounded-md bg-canvas-elevated px-1.5 py-0.5 text-[11px] text-accent-hover hover:bg-canvas-hover"
                      >
                        <FileText size={11} /> {c.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-canvas-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-canvas-border bg-canvas-panel px-3 py-2 focus-within:border-accent-ring">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask your second brain…"
            className="max-h-28 flex-1 resize-none bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            onClick={() => send(input)}
            disabled={busy || !input.trim()}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white transition hover:bg-accent-hover disabled:opacity-40"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint" />
  );
}
