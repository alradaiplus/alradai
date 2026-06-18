"use client";

import { useStore } from "@/lib/store";
import { NODE_TYPE_META } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Link2, Sparkles, Trash2, CornerUpLeft } from "lucide-react";

/**
 * Node inspector — title, type, tags, properties, backlinks and AI-suggested
 * links for the currently selected node. Mirrors the "Motor Design" detail
 * panel from the product screenshots.
 */
export function Inspector() {
  const selectedId = useStore((s) => s.selectedId);
  const node = useStore((s) => s.nodes.find((n) => n.id === selectedId));
  const edges = useStore((s) => s.edges);
  const update = useStore((s) => s.updateNode);
  const remove = useStore((s) => s.removeNode);
  const select = useStore((s) => s.select);
  const backlinks = useStore((s) => s.backlinks);
  const accept = useStore((s) => s.acceptSuggestedEdge);
  const dismiss = useStore((s) => s.dismissSuggestedEdge);
  const nodes = useStore((s) => s.nodes);

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-ink-faint">
        <Sparkles size={22} className="mb-2 opacity-50" />
        <p className="text-[13px]">Select a node to see its details, tags, and backlinks.</p>
      </div>
    );
  }

  const meta = NODE_TYPE_META[node.type];
  const links = backlinks(node.id);
  const suggestions = edges.filter(
    (e) => e.status === "suggested" && (e.source === node.id || e.target === node.id)
  );
  const nameOf = (id: string) => nodes.find((n) => n.id === id)?.title ?? "node";

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
          className="ml-auto text-ink-faint transition hover:text-red-400"
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

      <textarea
        value={node.content}
        onChange={(e) => update(node.id, { content: e.target.value })}
        className="min-h-[120px] w-full resize-y rounded-lg border border-canvas-border bg-canvas-panel p-3 text-[13px] leading-relaxed text-ink-muted outline-none focus:border-accent-ring"
        placeholder="Write in markdown. Use [[Title]] to link notes."
      />

      <div className="mt-4">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          Tags
        </div>
        <div className="flex flex-wrap gap-1.5">
          {node.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-canvas-elevated px-2 py-0.5 text-[11px] text-ink-muted"
            >
              #{t}
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

      {suggestions.length > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-node-embed">
            <Sparkles size={12} /> AI suggested links
          </div>
          {suggestions.map((e) => {
            const otherId = e.source === node.id ? e.target : e.source;
            return (
              <div
                key={e.id}
                className="mb-1.5 flex items-center gap-2 rounded-lg border border-node-embed/30 bg-node-embed/5 px-2.5 py-1.5"
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
                  className="rounded bg-node-embed/20 px-2 py-0.5 text-[11px] text-node-embed hover:bg-node-embed/30"
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

      <div className="mt-5">
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          <CornerUpLeft size={12} /> Backlinks ({links.length})
        </div>
        {links.length === 0 ? (
          <p className="text-[12px] text-ink-faint">No backlinks yet.</p>
        ) : (
          links.map((l) => (
            <button
              key={l.id}
              onClick={() => select(l.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink"
            >
              <Link2 size={13} className="text-accent" />
              {l.title}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
