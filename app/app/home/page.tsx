"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META, type NodeType } from "@/lib/types";
import { timeAgo, cn } from "@/lib/utils";
import {
  FileText,
  CircleCheck,
  FolderKanban,
  Flame,
  Network,
  Layers,
  Search,
  Plus,
  Mic,
  Image as ImageIcon,
  Link2,
  Sparkles,
  Bell,
} from "lucide-react";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Tiny inline sparkline from a numeric series. */
function Spark({ data, color = "var(--text-muted)" }: { data: number[]; color?: string }) {
  const max = Math.max(1, ...data);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1 || 1)) * 100},${28 - (v / max) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" className="h-7 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export default function HomePage() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const boards = useStore((s) => s.boards);
  const userName = useStore((s) => s.userName);
  const addNode = useStore((s) => s.addNode);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const toggleHabit = useStore((s) => s.toggleHabit);
  const cycleTask = useStore((s) => s.cycleTask);
  const router = useRouter();

  const today = iso(new Date());
  const recent = [...nodes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const notes = recent.filter((n) => n.type === "note");
  const tasks = nodes.filter((n) => n.type === "task");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const dueToday = tasks.filter((t) => t.due?.slice(0, 10) === today && t.status !== "done");
  const projects = nodes.filter((n) => n.type === "project");
  const habits = nodes.filter((n) => n.type === "habit");
  const activeEdges = edges.filter((e) => e.status !== "dismissed");
  const suggested = edges.filter((e) => e.status === "suggested");

  // 7-day activity series (nodes touched per day).
  const series = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - k));
    const day = iso(d);
    return nodes.filter((n) => n.updatedAt.slice(0, 10) === day).length;
  });

  const last7 = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - k);
    return iso(d);
  });
  const habitPct = habits.length
    ? Math.round(
        (habits.reduce((a, h) => {
          const log = new Set(h.habitLog ?? []);
          return a + last7.filter((d) => log.has(d)).length;
        }, 0) /
          (habits.length * 7)) *
          100
      )
    : 0;

  const open = (id: string, boardId: string) => {
    selectBoard(boardId);
    select(id);
    router.push("/app");
  };
  const create = (type: NodeType) => {
    addNode({ type, title: `New ${type}` });
    router.push("/app");
  };

  const overdue = tasks.filter(
    (t) => t.due && t.due.slice(0, 10) < today && t.status !== "done"
  ).length;
  const linkless = notes.filter(
    (n) => !activeEdges.some((e) => e.source === n.id || e.target === n.id)
  ).length;
  const insights = [
    overdue > 0 && `${overdue} overdue task${overdue > 1 ? "s" : ""} need attention.`,
    suggested.length > 0 && `${suggested.length} AI-suggested connection${suggested.length > 1 ? "s" : ""} to review.`,
    linkless > 0 && `${linkless} note${linkless > 1 ? "s" : ""} have no links yet — consider connecting them.`,
    habits.length > 0 && `Your habit consistency is ${habitPct}% this week.`,
  ].filter(Boolean) as string[];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats: { label: string; value: string; sub: string; icon: NodeType | "knowledge" | "spaces"; color: string }[] = [
    { label: "Notes", value: String(notes.length), sub: "in workspace", icon: "note", color: NODE_TYPE_META.note.color },
    { label: "Tasks", value: String(openTasks.length), sub: `${dueToday.length} due today`, icon: "task", color: NODE_TYPE_META.task.color },
    { label: "Projects", value: String(projects.length), sub: "active", icon: "project", color: NODE_TYPE_META.project.color },
    { label: "Habits", value: `${habitPct}%`, sub: "this week", icon: "habit", color: NODE_TYPE_META.habit.color },
    { label: "Knowledge", value: String(activeEdges.length), sub: "connections", icon: "knowledge", color: "#b9a7ff" },
    { label: "Spaces", value: String(boards.length), sub: "workspaces", icon: "spaces", color: "#cfcfcf" },
  ];
  const StatIcon = (k: string) =>
    k === "note" ? FileText : k === "task" ? CircleCheck : k === "project" ? FolderKanban : k === "habit" ? Flame : k === "spaces" ? Layers : Network;

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-canvas-border px-5 py-3">
        <h1 className="text-[15px] font-semibold text-ink">Dashboard</h1>
        <button
          onClick={() => setCommandOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-lg border border-canvas-border bg-canvas-panel px-3 py-1.5 text-[12px] text-ink-faint hover:border-accent-ring"
        >
          <Search size={13} /> Search anything… <kbd className="ml-2 font-mono text-[10px]">⌘K</kbd>
        </button>
        <Bell size={16} className="text-ink-faint" />
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas-elevated text-[12px] text-ink">
          {userName.slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <h2 className="text-[20px] font-semibold text-ink">
            {greeting}, {userName} 👋
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-faint">Discipline today, freedom tomorrow.</p>

          {/* Stat cards */}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => {
              const Icon = StatIcon(s.icon);
              return (
                <div key={s.label} className="rounded-xl border border-canvas-border bg-canvas-panel p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] text-ink-faint">
                    <Icon size={13} /> {s.label}
                  </div>
                  <div className="text-[22px] font-semibold leading-none text-ink">{s.value}</div>
                  <div className="mt-0.5 text-[11px] text-ink-faint">{s.sub}</div>
                  <Spark data={series} color={s.color} />
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Today's plan */}
            <Panel title="Today's plan" actionLabel="View all" onAction={() => router.push("/app/tasks")}>
              {openTasks.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5">
                  <button onClick={() => cycleTask(t.id)} className="shrink-0">
                    <CircleCheck
                      size={15}
                      className={t.status === "done" ? "text-ink-muted" : "text-ink-faint"}
                    />
                  </button>
                  <button
                    onClick={() => open(t.id, t.boardId)}
                    className="flex-1 truncate text-left text-[13px] text-ink-muted hover:text-ink"
                  >
                    {t.title}
                  </button>
                  {t.priority && (
                    <span className="rounded bg-canvas-elevated px-1.5 py-0.5 text-[10px] uppercase text-ink-faint">
                      {t.priority}
                    </span>
                  )}
                </div>
              ))}
              {openTasks.length === 0 && <Empty>No open tasks. 🎉</Empty>}
            </Panel>

            {/* Habit tracker today */}
            <Panel title="Habit tracker (today)" actionLabel="Full tracker" onAction={() => router.push("/app/habits")}>
              {habits.slice(0, 6).map((h) => {
                const log = new Set(h.habitLog ?? []);
                const onToday = log.has(today);
                let streak = 0;
                for (let k = 0; ; k++) {
                  const d = new Date();
                  d.setDate(d.getDate() - k);
                  if (log.has(iso(d))) streak++;
                  else break;
                }
                return (
                  <div key={h.id} className="flex items-center gap-2 py-1.5">
                    <button
                      onClick={() => toggleHabit(h.id, today)}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border text-[10px]",
                        onToday
                          ? "border-transparent bg-node-voice/80 text-canvas-bg"
                          : "border-canvas-border text-ink-faint"
                      )}
                    >
                      {onToday ? "✓" : ""}
                    </button>
                    <span className="flex-1 truncate text-[13px] text-ink-muted">{h.title}</span>
                    <span className="flex items-center gap-1 text-[11px] text-ink-faint">
                      <Flame size={11} /> {streak}
                    </span>
                  </div>
                );
              })}
              {habits.length === 0 && <Empty>No habits yet.</Empty>}
            </Panel>

            {/* Active projects */}
            <Panel title="Active projects" actionLabel="All" onAction={() => router.push("/app/database")}>
              {projects.slice(0, 5).map((p) => {
                const pt = tasks.filter((t) => t.projectId === p.id);
                const done = pt.filter((t) => t.status === "done").length;
                const pct = pt.length ? Math.round((done / pt.length) * 100) : 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => open(p.id, p.boardId)}
                    className="block w-full py-1.5 text-left"
                  >
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="truncate text-ink-muted">{p.title}</span>
                      <span className="text-[11px] text-ink-faint">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas-elevated">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
              {projects.length === 0 && <Empty>No projects yet.</Empty>}
            </Panel>

            {/* Recent notes */}
            <Panel title="Recent notes" actionLabel="All notes" onAction={() => router.push("/app/database")}>
              {notes.slice(0, 6).map((n) => (
                <button
                  key={n.id}
                  onClick={() => open(n.id, n.boardId)}
                  className="flex w-full items-center gap-2 py-1.5 text-left"
                >
                  <FileText size={13} className="text-ink-faint" />
                  <span className="flex-1 truncate text-[13px] text-ink-muted hover:text-ink">{n.title}</span>
                  <span className="text-[11px] text-ink-faint">{timeAgo(n.updatedAt)}</span>
                </button>
              ))}
              {notes.length === 0 && <Empty>No notes yet.</Empty>}
            </Panel>
          </div>

          {/* AI insights */}
          <div className="mt-4 rounded-xl border border-canvas-border bg-canvas-panel p-4">
            <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
              <Sparkles size={13} /> AI insights
            </div>
            {insights.length === 0 ? (
              <Empty>Everything looks healthy.</Empty>
            ) : (
              <ul className="space-y-1.5">
                {insights.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-ink-muted">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Quick capture bar */}
      <div className="flex items-center justify-center gap-1.5 border-t border-canvas-border bg-canvas-surface/80 px-4 py-2.5 backdrop-blur">
        {(
          [
            ["note", "Note", FileText],
            ["task", "Task", CircleCheck],
            ["voice", "Voice", Mic],
            ["image", "Image", ImageIcon],
            ["link", "Link", Link2],
          ] as const
        ).map(([type, label, Icon]) => (
          <button
            key={type}
            onClick={() => create(type)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink"
          >
            <Icon size={14} /> {label}
          </button>
        ))}
        <button
          onClick={() => create("note")}
          className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:bg-accent-hover"
          title="Quick capture"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function Panel({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
      <div className="mb-2 flex items-center">
        <span className="text-[12px] font-medium uppercase tracking-wide text-ink-faint">{title}</span>
        {actionLabel && (
          <button onClick={onAction} className="ml-auto text-[11px] text-ink-faint hover:text-ink">
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-[12px] text-ink-faint">{children}</p>;
}
