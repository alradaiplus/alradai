"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META, type NodeType } from "@/lib/types";
import { timeAgo, cn } from "@/lib/utils";
import { Table2, Search } from "lucide-react";

type SortKey = "title" | "type" | "board" | "updatedAt";

/**
 * Database — a table view over every node in the workspace (the Notion "all
 * database" lens). Sortable columns, type/text filters; rows open on the canvas.
 */
export default function DatabasePage() {
  const nodes = useStore((s) => s.nodes);
  const boards = useStore((s) => s.boards);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const router = useRouter();

  const [q, setQ] = useState("");
  const [type, setType] = useState<NodeType | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: "updatedAt",
    dir: -1,
  });

  const boardName = (id: string) => boards.find((b) => b.id === id)?.title ?? "—";

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    const filtered = nodes.filter(
      (n) =>
        (type === "all" || n.type === type) &&
        (!needle ||
          `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase().includes(needle))
    );
    const val = (n: (typeof nodes)[number]) =>
      sort.key === "board"
        ? boardName(n.boardId)
        : sort.key === "type"
        ? n.type
        : sort.key === "title"
        ? n.title.toLowerCase()
        : n.updatedAt;
    return [...filtered].sort((a, b) =>
      val(a) < val(b) ? -sort.dir : val(a) > val(b) ? sort.dir : 0
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, q, type, sort, boards]);

  const open = (id: string, boardId: string) => {
    selectBoard(boardId);
    select(id);
    router.push("/app");
  };

  const th = (key: SortKey, label: string) => (
    <button
      onClick={() =>
        setSort((s) => ({ key, dir: s.key === key && s.dir === 1 ? -1 : 1 }))
      }
      className="flex items-center gap-1 text-left hover:text-ink"
    >
      {label}
      {sort.key === key && <span className="text-ink-faint">{sort.dir === 1 ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex flex-wrap items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <Table2 size={16} className="text-ink-muted" />
        <h1 className="text-[15px] font-semibold text-ink">Database</h1>
        <span className="text-[12px] text-ink-faint">{rows.length} rows</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-canvas-border bg-canvas-panel px-2 py-1">
            <Search size={13} className="text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter…"
              className="w-32 bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-faint"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NodeType | "all")}
            className="rounded-lg border border-canvas-border bg-canvas-panel px-2 py-1.5 text-[12px] text-ink-muted outline-none"
          >
            <option value="all">All types</option>
            {Object.entries(NODE_TYPE_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead className="sticky top-0 bg-canvas-surface text-[11px] uppercase tracking-wide text-ink-faint">
            <tr className="border-b border-canvas-border">
              <th className="px-5 py-2 text-left font-medium">{th("title", "Title")}</th>
              <th className="px-3 py-2 text-left font-medium">{th("type", "Type")}</th>
              <th className="px-3 py-2 text-left font-medium">{th("board", "Board")}</th>
              <th className="px-3 py-2 text-left font-medium">Tags</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-5 py-2 text-left font-medium">{th("updatedAt", "Updated")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr
                key={n.id}
                onClick={() => open(n.id, n.boardId)}
                className="cursor-pointer border-b border-canvas-border/60 hover:bg-canvas-hover"
              >
                <td className="max-w-[280px] truncate px-5 py-2 text-ink">{n.title}</td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5 text-ink-muted">
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{ background: NODE_TYPE_META[n.type].color }}
                    />
                    {NODE_TYPE_META[n.type].label}
                  </span>
                </td>
                <td className="px-3 py-2 text-ink-muted">{boardName(n.boardId)}</td>
                <td className="max-w-[180px] truncate px-3 py-2 text-ink-faint">
                  {n.tags.map((t) => `#${t}`).join(" ")}
                </td>
                <td className="px-3 py-2">
                  {n.type === "task" && n.status ? (
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[11px] capitalize",
                        n.status === "done"
                          ? "bg-canvas-elevated text-ink-faint"
                          : "bg-canvas-elevated text-ink-muted"
                      )}
                    >
                      {n.status}
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
                <td className="px-5 py-2 text-ink-faint">{timeAgo(n.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-5 py-8 text-center text-[13px] text-ink-faint">No matching nodes.</p>
        )}
      </div>
    </div>
  );
}
