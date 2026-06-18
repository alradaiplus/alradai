"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { SemanticNode, TaskStatus } from "@/lib/types";
import { Circle, CircleDot, CircleCheck, Plus, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const COLUMNS: { status: TaskStatus; label: string; icon: React.ReactNode }[] = [
  { status: "todo", label: "To do", icon: <Circle size={14} /> },
  { status: "doing", label: "In progress", icon: <CircleDot size={14} /> },
  { status: "done", label: "Done", icon: <CircleCheck size={14} /> },
];

/**
 * Tasks board — a status kanban projected from task nodes on the current board.
 * Tasks live on the canvas; this is just another lens on the same nodes.
 */
export default function TasksPage() {
  const nodes = useStore((s) => s.nodes);
  const currentBoardId = useStore((s) => s.currentBoardId);
  const boards = useStore((s) => s.boards);
  const addNode = useStore((s) => s.addNode);
  const cycleTask = useStore((s) => s.cycleTask);
  const select = useStore((s) => s.select);
  const router = useRouter();

  const boardTitle = boards.find((b) => b.id === currentBoardId)?.title ?? "Board";
  const tasks = nodes.filter(
    (n) => n.type === "task" && n.boardId === currentBoardId
  );

  const open = (id: string) => {
    select(id);
    router.push("/app");
  };

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <h1 className="text-[15px] font-semibold text-ink">Tasks</h1>
        <span className="text-[12px] text-ink-faint">{boardTitle}</span>
        <button
          onClick={() => {
            addNode({ type: "task", title: "New task" });
            router.push("/app");
          }}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          <Plus size={14} /> New task
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-auto p-5 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => (t.status ?? "todo") === col.status);
          return (
            <div key={col.status} className="flex min-h-0 flex-col">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
                {col.icon} {col.label}
                <span className="ml-auto rounded-full bg-canvas-elevated px-2 py-0.5 text-[11px] text-ink-muted">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-canvas-border px-3 py-6 text-center text-[12px] text-ink-faint">
                    Nothing here.
                  </p>
                )}
                {items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={() => cycleTask(t.id)}
                    onOpen={() => open(t.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onToggle,
  onOpen,
}: {
  task: SemanticNode;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="group rounded-xl border border-canvas-border bg-canvas-panel p-3 transition hover:border-canvas-strong">
      <div className="flex items-start gap-2">
        <button onClick={onToggle} className="mt-0.5 shrink-0" title="Toggle status">
          {task.status === "done" ? (
            <CircleCheck size={16} className="text-ink-muted" />
          ) : task.status === "doing" ? (
            <CircleDot size={16} className="text-ink-muted" />
          ) : (
            <Circle size={16} className="text-ink-faint" />
          )}
        </button>
        <button onClick={onOpen} className="flex-1 text-left">
          <p
            className={cn(
              "text-[13px] font-medium text-ink",
              task.status === "done" && "text-ink-faint line-through"
            )}
          >
            {task.title}
          </p>
          {task.content && (
            <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-muted">
              {task.content}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2 text-[10px] text-ink-faint">
            {task.priority && (
              <span className="rounded bg-canvas-elevated px-1.5 py-0.5 uppercase">
                {task.priority}
              </span>
            )}
            {task.due && (
              <span className="flex items-center gap-1">
                <CalendarClock size={11} />
                {new Date(task.due).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
            {task.tags.slice(0, 2).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}
