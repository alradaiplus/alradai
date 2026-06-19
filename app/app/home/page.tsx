"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META, type NodeType } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import {
  FileText,
  CircleCheck,
  FolderKanban,
  Mic,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  Activity,
} from "lucide-react";

/**
 * Home dashboard — a fast overview of the workspace: quick create, recent
 * notes / projects / tasks, AI suggestions, and an activity feed. Everything is
 * derived from the same node store that powers the canvas.
 */
export default function HomePage() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const userName = useStore((s) => s.userName);
  const addNode = useStore((s) => s.addNode);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const discoverLinks = useStore((s) => s.discoverLinks);
  const router = useRouter();

  const recent = [...nodes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const notes = recent.filter((n) => n.type === "note").slice(0, 5);
  const projects = recent.filter((n) => n.type === "project").slice(0, 5);
  const tasks = recent
    .filter((n) => n.type === "task" && n.status !== "done")
    .slice(0, 5);
  const suggested = edges.filter((e) => e.status === "suggested").length;

  const open = (id: string, boardId: string) => {
    selectBoard(boardId);
    select(id);
    router.push("/app");
  };
  const create = (type: NodeType) => {
    addNode({ type, title: `New ${type}`, content: type === "note" ? "" : "" });
    router.push("/app");
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="h-full overflow-y-auto bg-canvas-bg">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-[22px] font-semibold text-ink">
          {greeting}, {userName} 👋
        </h1>
        <p className="mt-1 text-[13px] text-ink-faint">
          {nodes.length} nodes · {tasks.length} open tasks · {suggested} AI suggestions
        </p>

        {/* Quick create */}
        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["note", "Note", FileText],
              ["task", "Task", CircleCheck],
              ["project", "Project", FolderKanban],
              ["voice", "Voice", Mic],
              ["image", "Image", ImageIcon],
            ] as const
          ).map(([type, label, Icon]) => (
            <button
              key={type}
              onClick={() => create(type)}
              className="flex items-center gap-1.5 rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-[13px] text-ink-muted transition hover:border-accent-ring hover:text-ink"
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Column title="Recent notes" items={notes} onOpen={open} />
          <Column title="Projects" items={projects} onOpen={open} />
          <Column title="Open tasks" items={tasks} onOpen={open} />
        </div>

        {/* AI suggestions */}
        <div className="mt-6 rounded-xl border border-canvas-border bg-canvas-panel p-4">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
            <Sparkles size={13} /> AI suggestions
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
            <span>
              {suggested > 0
                ? `${suggested} suggested connection${suggested > 1 ? "s" : ""} waiting.`
                : "No pending suggestions."}
            </span>
            <button
              onClick={() => {
                const n = discoverLinks();
                setTimeout(
                  () =>
                    alert(
                      n
                        ? `Found ${n} new connection${n > 1 ? "s" : ""}. Open a node to review.`
                        : "No new connections found."
                    ),
                  30
                );
              }}
              className="flex items-center gap-1.5 rounded-lg border border-canvas-border px-2.5 py-1 text-[12px] transition hover:border-accent-ring hover:text-ink"
            >
              <Wand2 size={12} /> Discover links
            </button>
          </div>
        </div>

        {/* Activity feed */}
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
            <Activity size={13} /> Activity
          </div>
          <div className="space-y-1">
            {recent.slice(0, 10).map((n) => (
              <button
                key={n.id}
                onClick={() => open(n.id, n.boardId)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: NODE_TYPE_META[n.type].color }}
                />
                <span className="flex-1 truncate">{n.title}</span>
                <span className="text-[11px] text-ink-faint">edited {timeAgo(n.updatedAt)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: { id: string; title: string; boardId: string; content: string }[];
  onOpen: (id: string, boardId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-panel p-3">
      <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="px-1 py-2 text-[12px] text-ink-faint">Nothing yet.</p>
      ) : (
        items.map((n) => (
          <button
            key={n.id}
            onClick={() => onOpen(n.id, n.boardId)}
            className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-[13px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink"
          >
            {n.title}
          </button>
        ))
      )}
    </div>
  );
}
