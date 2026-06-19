"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { ChatMessage } from "@/lib/types";
import { Sparkles, ArrowUp, FileText, KeyRound, Check, X } from "lucide-react";
import { nanoid } from "nanoid";
import {
  retrieve,
  citationsOf,
  fallbackAnswer,
  contextBlock,
} from "@/lib/ai/demo";
import {
  streamOpenRouterClient,
  looksLikeOpenRouterKey,
  type ClientChatMessage,
} from "@/lib/ai/openrouter-client";

/**
 * In a static export (e.g. GitHub Pages) there is no server route, so the
 * assistant talks to OpenRouter directly from the browser using the user's own
 * key (stored only in their browser). Without a key it falls back to grounded
 * demo answers. On a server host it uses the secure /api/ai/chat route.
 */
const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

const SYSTEM = (ctx: string) =>
  `You are Notes Canvas, the user's visual second brain. Answer using the context from their canvas below when relevant, and cite note titles inline. Be concise and helpful. If the context is insufficient, say so.\n\nCONTEXT:\n${ctx || "(no matching notes)"}`;

export function AIChat() {
  const allNodes = useStore((s) => s.nodes);
  const currentBoardId = useStore((s) => s.currentBoardId);
  const select = useStore((s) => s.select);
  const aiKey = useStore((s) => s.aiKey);
  const setAiKey = useStore((s) => s.setAiKey);
  const aiModel = useStore((s) => s.aiModel);
  const memories = useStore((s) => s.memories);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nodes = allNodes.filter((n) => n.boardId === currentBoardId);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const userMsg: ChatMessage = { id: nanoid(), role: "user", content: q };
    const assistantId = nanoid();
    const history = messages.slice(-6);
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setBusy(true);

    const ctx = nodes.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      tags: n.tags,
    }));
    const hits = retrieve(q, ctx);
    const citations = citationsOf(hits);
    const setAssistant = (content: string, withCites = true) =>
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content, citations: withCites ? citations : undefined }
            : msg
        )
      );
    const scroll = () =>
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });

    // ---- Static export path: talk to OpenRouter from the browser ----------
    if (STATIC_EXPORT) {
      try {
        if (aiKey) {
          const memBlock = memories.length
            ? `\n\nWORKSPACE MEMORY (always honor):\n${memories
                .map((m) => `- ${m.text}`)
                .join("\n")}`
            : "";
          const chat: ClientChatMessage[] = [
            { role: "system", content: SYSTEM(contextBlock(hits)) + memBlock },
            ...history.map((h) => ({ role: h.role, content: h.content })),
            { role: "user", content: q },
          ];
          let acc = "";
          for await (const delta of streamOpenRouterClient({
            apiKey: aiKey,
            model: aiModel,
            messages: chat,
          })) {
            acc += delta;
            setAssistant(acc);
            scroll();
          }
          if (!acc) setAssistant("(No response from the model.)");
        } else {
          // No key yet — grounded local answer, streamed word by word.
          const full = fallbackAnswer(hits);
          let acc = "";
          for (const w of full.split(/(\s+)/)) {
            acc += w;
            setAssistant(acc);
            scroll();
            await new Promise((r) => setTimeout(r, 10));
          }
        }
      } catch (e) {
        setAssistant(
          `AI error: ${
            e instanceof Error ? e.message : String(e)
          }. Check your OpenRouter key has credit, then try again.`,
          false
        );
      } finally {
        setBusy(false);
      }
      return;
    }

    // ---- Server path (Vercel / node host): secure /api/ai/chat ------------
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, context: ctx }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "AI request failed" }));
        setAssistant(err.error || "AI is not configured.", false);
        return;
      }
      const citeHeader = res.headers.get("x-citations");
      const cites = citeHeader
        ? (JSON.parse(citeHeader) as ChatMessage["citations"])
        : citations;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId ? { ...msg, content: acc, citations: cites } : msg
          )
        );
        scroll();
      }
    } catch {
      setAssistant("Something went wrong reaching the AI service.", false);
    } finally {
      setBusy(false);
    }
  };

  const suggestions = [
    "Summarize this board",
    "What connects these notes?",
    "What am I missing?",
  ];

  return (
    <div className="flex h-full flex-col">
      {STATIC_EXPORT && <KeyBar aiKey={aiKey} setAiKey={setAiKey} />}

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-10 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Sparkles size={20} />
            </div>
            <p className="text-[14px] font-medium text-ink">AI that understands you</p>
            <p className="mt-1 max-w-[220px] text-[12px] text-ink-faint">
              {aiKey || !STATIC_EXPORT
                ? "Ask anything about your canvas. Answers are grounded in your notes."
                : "Connect your OpenRouter key above for full AI, or ask now for grounded answers."}
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
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-[13px] text-accent-foreground"
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
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Connect / manage the OpenRouter key (browser-only) for the static build. */
function KeyBar({
  aiKey,
  setAiKey,
}: {
  aiKey: string | null;
  setAiKey: (k: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  if (aiKey && !editing) {
    return (
      <div className="flex items-center gap-2 border-b border-canvas-border bg-canvas-panel px-3 py-1.5 text-[11px] text-ink-muted">
        <Check size={12} className="text-success" />
        <span>OpenRouter connected</span>
        <button
          onClick={() => {
            setEditing(true);
            setVal("");
          }}
          className="ml-auto text-ink-faint hover:text-ink"
        >
          Change
        </button>
        <button
          onClick={() => setAiKey(null)}
          className="text-ink-faint hover:text-danger"
          title="Disconnect"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="border-b border-canvas-border bg-canvas-panel px-3 py-2">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
        <KeyRound size={12} /> Connect OpenRouter for full AI
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="password"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="sk-or-v1-…"
          className="flex-1 rounded-lg border border-canvas-border bg-canvas-bg px-2 py-1.5 text-[12px] text-ink outline-none focus:border-accent-ring"
        />
        <button
          onClick={() => {
            if (looksLikeOpenRouterKey(val)) {
              setAiKey(val);
              setEditing(false);
            }
          }}
          disabled={!looksLikeOpenRouterKey(val)}
          className="rounded-lg bg-accent px-2.5 py-1.5 text-[12px] font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-40"
        >
          Save
        </button>
      </div>
      <p className="mt-1 text-[10px] text-ink-faint">
        Stored only in your browser. Get a key at openrouter.ai/keys.
      </p>
    </div>
  );
}

function Dot() {
  return (
    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ink-faint" />
  );
}
