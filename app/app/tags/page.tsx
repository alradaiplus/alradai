"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META } from "@/lib/types";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tag pages — tags are first-class. Pick a tag to see every node carrying it,
 * across all boards; clicking a node opens it on its board.
 */
export default function TagsPage() {
  const nodes = useStore((s) => s.nodes);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);

  const tagCounts = useMemo(() => {
    const m = new Map<string, number>();
    nodes.forEach((n) => n.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [nodes]);

  const current = active ?? tagCounts[0]?.[0] ?? null;
  const tagged = current ? nodes.filter((n) => n.tags.includes(current)) : [];

  const open = (id: string, boardId: string) => {
    selectBoard(boardId);
    select(id);
    router.push("/app");
  };

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <Hash size={16} className="text-ink-muted" />
        <h1 className="text-[15px] font-semibold text-ink">Tags</h1>
        <span className="text-[12px] text-ink-faint">{tagCounts.length} tags</span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[240px_1fr]">
        <div className="min-h-0 overflow-y-auto border-b border-canvas-border p-3 md:border-b-0 md:border-r">
          {tagCounts.length === 0 && (
            <p className="px-2 text-[12px] text-ink-faint">No tags yet.</p>
          )}
          {tagCounts.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setActive(tag)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] transition hover:bg-canvas-hover",
                current === tag ? "bg-canvas-hover text-ink" : "text-ink-muted"
              )}
            >
              <Hash size={12} className="text-ink-faint" />
              <span className="flex-1 truncate">{tag}</span>
              <span className="text-[10px] text-ink-faint">{count}</span>
            </button>
          ))}
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          {current && (
            <h2 className="mb-3 flex items-center gap-1.5 text-[14px] font-semibold text-ink">
              <Hash size={14} /> {current}
            </h2>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tagged.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n.id, n.boardId)}
                className="rounded-xl border border-canvas-border bg-canvas-panel p-3 text-left transition hover:border-canvas-strong"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: NODE_TYPE_META[n.type].color }}
                  />
                  <span className="truncate text-[13px] font-medium text-ink">
                    {n.title}
                  </span>
                </div>
                <p className="line-clamp-2 text-[12px] text-ink-muted">{n.content}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
