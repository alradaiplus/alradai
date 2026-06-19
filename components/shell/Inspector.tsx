"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META, type TaskPriority, type TaskStatus } from "@/lib/types";
import { timeAgo, cn } from "@/lib/utils";
import { streamOpenRouterClient } from "@/lib/ai/openrouter-client";
import { BlockEditor } from "@/components/editor/BlockEditor";
import {
  Link2,
  Sparkles,
  Trash2,
  CornerUpLeft,
  CornerDownRight,
  Spline,
  Wand2,
  Expand,
  ScanSearch,
} from "lucide-react";

const STATUSES: TaskStatus[] = ["todo", "doing", "done"];
const PRIORITIES: TaskPriority[] = ["low", "med", "high"];

/**
 * Node inspector — title, type-specific properties, content, tags, AI summary,
 * connections (backlinks/outgoing + AI suggestions) for the selected node.
 */
export function Inspector() {
  const selectedId = useStore((s) => s.selectedId);
  const node = useStore((s) => s.nodes.find((n) => n.id === selectedId));
  const edges = useStore((s) => s.edges);
  const nodes = useStore((s) => s.nodes);
  const update = useStore((s) => s.updateNode);
  const remove = useStore((s) => s.removeNode);
  const select = useStore((s) => s.select);
  const backlinks = useStore((s) => s.backlinks);
  const outgoing = useStore((s) => s.outgoing);
  const unlinkedMentions = useStore((s) => s.unlinkedMentions);
  const accept = useStore((s) => s.acceptSuggestedEdge);
  const dismiss = useStore((s) => s.dismissSuggestedEdge);
  const addEdge = useStore((s) => s.addEdge);
  const startConnect = useStore((s) => s.startConnect);
  const connectSourceId = useStore((s) => s.connectSourceId);
  const summarize = useStore((s) => s.summarizeNode);
  const aiKey = useStore((s) => s.aiKey);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiOut, setAiOut] = useState<{ kind: "extend" | "critique"; text: string } | null>(
    null
  );

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-ink-faint">
        <Sparkles size={22} className="mb-2 opacity-50" />
        <p className="text-[13px]">
          Select a node to see its details, properties, and connections.
        </p>
      </div>
    );
  }

  const meta = NODE_TYPE_META[node.type];
  const links = backlinks(node.id);
  const out = outgoing(node.id);
  const mentions = unlinkedMentions(node.id);
  const suggestions = edges.filter(
    (e) =>
      e.status === "suggested" && (e.source === node.id || e.target === node.id)
  );
  const nameOf = (id: string) => nodes.find((n) => n.id === id)?.title ?? "node";
  const linkTargets = nodes.filter(
    (n) =>
      n.id !== node.id &&
      n.boardId === node.boardId &&
      !out.some((o) => o.id === n.id)
  );

  const runAction = async (kind: "extend" | "critique") => {
    if (!aiKey || aiBusy) return;
    const instruction =
      kind === "extend"
        ? "Extend and develop this note with additional, non-redundant detail in the same voice. Return only the continuation — no preamble."
        : "Critique this note: list its key gaps, weak points, and 2–3 concrete improvements. Be terse and specific.";
    setAiBusy(true);
    setAiOut({ kind, text: "" });
    try {
      let acc = "";
      for await (const d of streamOpenRouterClient({
        apiKey: aiKey,
        maxTokens: 600,
        messages: [
          { role: "system", content: "You are Notes Canvas, the user's writing copilot." },
          {
            role: "user",
            content: `${instruction}\n\nTITLE: ${node.title}\n\nNOTE:\n${node.content}`,
          },
        ],
      })) {
        acc += d;
        setAiOut({ kind, text: acc });
      }
      if (!acc) setAiOut({ kind, text: "(No response.)" });
    } catch (e) {
      setAiOut({ kind, text: `Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="rounded-md px-2 py-0.5 text-[11px] font-medium"
          style={{ background: `${meta.color}22`, color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-[11px] text-ink-faint">
          edited {timeAgo(node.updatedAt)}
        </span>
        <button
          onClick={() => remove(node.id)}
          className="ml-auto text-ink-faint transition hover:text-danger"
          title="Delete node"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <input
        value={node.title}
        onChange={(e) => update(node.id, { title: e.target.value })}
        className="mb-3 w-full bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-ink-faint"
        placeholder="Untitled"
      />

      {/* Task properties */}
      {node.type === "task" && (
        <div className="mb-3 space-y-2 rounded-lg border border-canvas-border bg-canvas-panel p-3">
          <div className="flex items-center gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => update(node.id, { status: s })}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-[11px] font-medium capitalize transition",
                  node.status === s
                    ? "bg-accent text-accent-foreground"
                    : "bg-canvas-elevated text-ink-muted hover:text-ink"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-faint">Priority</span>
            <div className="flex flex-1 gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => update(node.id, { priority: p })}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1 text-[11px] uppercase transition",
                    node.priority === p
                      ? "bg-canvas-strong text-ink"
                      : "bg-canvas-elevated text-ink-faint hover:text-ink"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-faint">Due</span>
            <input
              type="date"
              value={node.due ? node.due.slice(0, 10) : ""}
              onChange={(e) =>
                update(node.id, {
                  due: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : undefined,
                })
              }
              className="flex-1 rounded-md border border-canvas-border bg-canvas-elevated px-2 py-1 text-[12px] text-ink-muted outline-none focus:border-accent-ring"
            />
          </div>
        </div>
      )}

      {/* Media source */}
      {(node.type === "link" ||
        node.type === "image" ||
        node.type === "pdf" ||
        node.type === "video" ||
        node.type === "bookmark" ||
        node.type === "embed") && (
        <input
          value={node.src ?? ""}
          onChange={(e) => update(node.id, { src: e.target.value })}
          placeholder="https://…"
          className="mb-3 w-full rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-[12px] text-ink-muted outline-none focus:border-accent-ring"
        />
      )}

      <BlockEditor
        value={node.content}
        onChange={(v) => update(node.id, { content: v })}
        placeholder="Write here. Type / for blocks, [[Title]] to link."
      />

      {/* Per-node AI actions */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => summarize(node.id)}
          className="flex items-center gap-1.5 rounded-lg border border-canvas-border px-2.5 py-1 text-[12px] text-ink-muted transition hover:border-accent-ring hover:text-ink"
        >
          <Wand2 size={12} /> Summarize
        </button>
        <button
          onClick={() => runAction("extend")}
          disabled={!aiKey || aiBusy}
          title={aiKey ? "Extend with AI" : "Connect OpenRouter in the AI tab"}
          className="flex items-center gap-1.5 rounded-lg border border-canvas-border px-2.5 py-1 text-[12px] text-ink-muted transition hover:border-accent-ring hover:text-ink disabled:opacity-40"
        >
          <Expand size={12} /> Extend
        </button>
        <button
          onClick={() => runAction("critique")}
          disabled={!aiKey || aiBusy}
          title={aiKey ? "Critique with AI" : "Connect OpenRouter in the AI tab"}
          className="flex items-center gap-1.5 rounded-lg border border-canvas-border px-2.5 py-1 text-[12px] text-ink-muted transition hover:border-accent-ring hover:text-ink disabled:opacity-40"
        >
          <ScanSearch size={12} /> Critique
        </button>
        {!aiKey && (
          <span className="text-[10px] text-ink-faint">Connect a key in the AI tab</span>
        )}
      </div>

      {aiOut && (
        <div className="mt-2 rounded-lg border border-node-ai/30 bg-node-ai/5 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-node-ai">
            <Sparkles size={12} /> {aiOut.kind === "extend" ? "Extension" : "Critique"}
            {aiBusy && " …"}
          </div>
          <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink-muted">
            {aiOut.text}
          </p>
          {!aiBusy && (
            <div className="mt-2 flex gap-2">
              {aiOut.kind === "extend" && (
                <button
                  onClick={() => {
                    update(node.id, { content: `${node.content}\n\n${aiOut.text}` });
                    setAiOut(null);
                  }}
                  className="rounded bg-node-ai/20 px-2 py-0.5 text-[11px] text-node-ai hover:bg-node-ai/30"
                >
                  Append to note
                </button>
              )}
              <button
                onClick={() => setAiOut(null)}
                className="text-[11px] text-ink-faint hover:text-ink"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {node.summary && (
        <div className="mt-3 rounded-lg border border-canvas-border bg-canvas-panel p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            <Sparkles size={12} /> AI summary
          </div>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            {node.summary}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Tags
        </div>
        <div className="flex flex-wrap gap-1.5">
          {node.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full bg-canvas-elevated px-2 py-0.5 text-[11px] text-ink-muted"
            >
              #{tag}
              <button
                onClick={() =>
                  update(node.id, { tags: node.tags.filter((x) => x !== tag) })
                }
                className="text-ink-faint hover:text-ink"
              >
                ×
              </button>
            </span>
          ))}
          <input
            placeholder="+ tag"
            className="w-16 bg-transparent text-[11px] text-ink-muted outline-none placeholder:text-ink-faint"
            onKeyDown={(e) => {
              const v = (e.target as HTMLInputElement).value.trim();
              if (e.key === "Enter" && v) {
                update(node.id, { tags: [...node.tags, v.replace(/^#/, "")] });
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
        </div>
      </div>

      {/* Connections */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          <Spline size={12} /> Connect
        </div>
        <div className="flex items-center gap-2">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) addEdge(node.id, e.target.value, "reference");
            }}
            className="flex-1 rounded-lg border border-canvas-border bg-canvas-panel px-2 py-1.5 text-[12px] text-ink-muted outline-none focus:border-accent-ring"
          >
            <option value="">Link to a node…</option>
            {linkTargets.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => startConnect(node.id)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[12px] transition",
              connectSourceId === node.id
                ? "border-accent-ring text-accent-hover"
                : "border-canvas-border text-ink-muted hover:text-ink"
            )}
            title="Then click another node on the canvas"
          >
            On canvas
          </button>
        </div>
        {connectSourceId === node.id && (
          <p className="mt-1.5 text-[11px] text-accent-hover">
            Now click another node on the canvas to connect.
          </p>
        )}
      </div>

      {/* AI suggested links */}
      {suggestions.length > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-node-ai">
            <Sparkles size={12} /> AI suggested links
          </div>
          {suggestions.map((e) => {
            const otherId = e.source === node.id ? e.target : e.source;
            return (
              <div
                key={e.id}
                className="mb-1.5 flex items-center gap-2 rounded-lg border border-node-ai/30 bg-node-ai/5 px-2.5 py-1.5"
              >
                <span className="flex-1 truncate text-[12px] text-ink">
                  {nameOf(otherId)}
                  {e.confidence && (
                    <span className="ml-1.5 text-[10px] text-ink-faint">
                      {Math.round(e.confidence * 100)}%
                    </span>
                  )}
                </span>
                <button
                  onClick={() => accept(e.id)}
                  className="rounded bg-node-ai/20 px-2 py-0.5 text-[11px] text-node-ai hover:bg-node-ai/30"
                >
                  Link
                </button>
                <button
                  onClick={() => dismiss(e.id)}
                  className="text-[11px] text-ink-faint hover:text-ink"
                >
                  Dismiss
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Outgoing */}
      <LinkList
        icon={<CornerDownRight size={12} />}
        label={`Links to (${out.length})`}
        items={out}
        onSelect={select}
        empty="No outgoing links."
      />

      {/* Backlinks */}
      <LinkList
        icon={<CornerUpLeft size={12} />}
        label={`Backlinks (${links.length})`}
        items={links}
        onSelect={select}
        empty="No backlinks yet."
      />

      {/* Unlinked mentions */}
      {mentions.length > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            <Sparkles size={12} /> Unlinked mentions ({mentions.length})
          </div>
          {mentions.map((m) => (
            <div
              key={m.id}
              className="mb-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-ink-muted transition hover:bg-canvas-hover"
            >
              <button
                onClick={() => select(m.id)}
                className="flex-1 truncate text-left hover:text-ink"
              >
                {m.title}
              </button>
              <button
                onClick={() => addEdge(m.id, node.id, "reference")}
                className="rounded bg-canvas-elevated px-2 py-0.5 text-[11px] text-ink-muted hover:text-ink"
              >
                Link
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LinkList({
  icon,
  label,
  items,
  onSelect,
  empty,
}: {
  icon: React.ReactNode;
  label: string;
  items: { id: string; title: string }[];
  onSelect: (id: string) => void;
  empty: string;
}) {
  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        {icon} {label}
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-ink-faint">{empty}</p>
      ) : (
        items.map((l) => (
          <button
            key={l.id}
            onClick={() => onSelect(l.id)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink"
          >
            <Link2 size={13} className="text-ink-faint" />
            {l.title}
          </button>
        ))
      )}
    </div>
  );
}
