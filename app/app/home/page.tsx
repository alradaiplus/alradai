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
  Clock,
  CalendarDays,
  ChevronRight,
  Circle,
  CircleDot,
  Timer,
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

/** Mini bar chart for weekly progress */
function MiniBar({ data, color = "#888" }: { data: number[]; color?: string }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex h-8 items-end gap-0.5">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{ height: `${(v / max) * 100}%`, background: color, opacity: 0.7 + (i / data.length) * 0.3 }}
        />
      ))}
    </div>
  );
}

/** Circular progress ring */
function ProgressRing({ pct, size = 80, stroke = 6, color = "#fff" }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
      />
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
  const notes = nodes
    .filter((n) => n.type === "note")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const tasks = nodes.filter((n) => n.type === "task");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const dueToday = tasks.filter((t) => t.due?.slice(0, 10) === today && t.status !== "done");
  const projects = nodes.filter((n) => n.type === "project");
  const habits = nodes.filter((n) => n.type === "habit");
  const events = nodes
    .filter((n) => n.type === "event" && n.due?.slice(0, 10) === today)
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""));

  const activeEdges = edges.filter((e) => e.status !== "dismissed");
  const suggested = edges.filter((e) => e.status === "suggested");

  const last7 = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(); d.setDate(d.getDate() - k); return iso(d);
  });
  const habitSlots = habits.length * 7;
  const habitHits = habits.reduce((acc, h) => {
    const log = new Set(h.habitLog ?? []);
    return acc + last7.filter((d) => log.has(d)).length;
  }, 0);
  const habitPct = habitSlots ? Math.round((habitHits / habitSlots) * 100) : 0;

  const overdue = tasks.filter(
    (t) => t.due && t.due.slice(0, 10) < today && t.status !== "done"
  ).length;
  const linkless = nodes.filter(
    (n) => !activeEdges.some((e) => e.source === n.id || e.target === n.id)
  ).length;
  const insights = [
    overdue > 0 && `You have ${overdue} overdue task${overdue > 1 ? "s" : ""} that need attention.`,
    `Your productivity is highest in the morning (82%).`,
    suggested.length > 0 && `Consider reviewing ${suggested.length} unlinked notes.`,
    habits.length > 0 && `You're on a ${(() => {
      const h = habits[0];
      const log = new Set(h?.habitLog ?? []);
      let streak = 0;
      for (let k = 0; ; k++) {
        const d = new Date(); d.setDate(d.getDate() - k);
        if (log.has(iso(d))) streak++; else break;
      }
      return streak;
    })()}-day streak with your habits!`,
  ].filter(Boolean) as string[];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Sparkline series (last 7 days activity)
  const series = last7.map((d) =>
    nodes.filter((n) => n.updatedAt.slice(0, 10) === d).length
  ).reverse();

  const stats: { label: string; value: string; sub: string; icon: NodeType | "knowledge" | "spaces" | "focus"; color: string }[] = [
    { label: "Notes", value: String(notes.length), sub: "+18 this week", icon: "note", color: NODE_TYPE_META.note.color },
    { label: "Tasks", value: String(openTasks.length), sub: `${dueToday.length} due today`, icon: "task", color: NODE_TYPE_META.task.color },
    { label: "Projects", value: String(projects.length), sub: "2 at risk", icon: "project", color: NODE_TYPE_META.project.color },
    { label: "Habits", value: `${habitPct}%`, sub: "+12% this week", icon: "habit", color: NODE_TYPE_META.habit.color },
    { label: "Focus Time", value: "4h 32m", sub: "+1h 15m", icon: "focus", color: "#b9a7ff" },
    { label: "Knowledge", value: String(activeEdges.length), sub: `+${suggested.length} connections`, icon: "knowledge", color: "#8fb6e0" },
  ];

  const StatIcon = (k: string) =>
    k === "note" ? FileText
    : k === "task" ? CircleCheck
    : k === "project" ? FolderKanban
    : k === "habit" ? Flame
    : k === "focus" ? Timer
    : k === "spaces" ? Layers
    : Network;

  const open = (id: string, boardId: string) => {
    selectBoard(boardId);
    select(id);
    router.push("/app");
  };

  const create = (type: NodeType) => {
    const n = addNode({ type });
    select(n.id);
    router.push("/app");
  };

  const formatEventTime = (due: string) => {
    const d = new Date(due);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  // Graph preview nodes (top 6 by degree)
  const degree: Record<string, number> = {};
  activeEdges.forEach((e) => {
    degree[e.source] = (degree[e.source] || 0) + 1;
    degree[e.target] = (degree[e.target] || 0) + 1;
  });
  const graphNodes = nodes
    .filter((n) => n.boardId === boards[0]?.id)
    .sort((a, b) => (degree[b.id] || 0) - (degree[a.id] || 0))
    .slice(0, 8);

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <h1 className="text-[15px] font-semibold text-ink">Dashboard</h1>
        <button
          onClick={() => setCommandOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-lg border border-canvas-border bg-canvas-panel px-3 py-1.5 text-[12px] text-ink-faint hover:border-accent-ring transition"
        >
          <Search size={13} /> Search anything… <kbd className="ml-2 font-mono text-[10px] text-ink-faint/60">⌘K</kbd>
        </button>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-canvas-hover transition">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas-elevated text-[12px] font-semibold text-ink border border-canvas-border">
          {userName.slice(0, 1).toUpperCase()}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 py-6">
          {/* Greeting */}
          <h2 className="text-[22px] font-semibold text-ink">
            {greeting}, {userName} 🌟
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-faint italic">&ldquo;Discipline today, freedom tomorrow.&rdquo;</p>

          {/* Stat cards */}
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {stats.map((s) => {
              const Icon = StatIcon(s.icon);
              return (
                <div key={s.label} className="rounded-xl border border-canvas-border bg-canvas-panel p-3 transition hover:border-canvas-border/80 hover:bg-canvas-elevated/50">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] text-ink-faint">
                    <Icon size={13} /> {s.label}
                  </div>
                  <div className="text-[22px] font-bold leading-none text-ink">{s.value}</div>
                  <div className="mt-0.5 text-[11px] text-ink-faint">{s.sub}</div>
                  <Spark data={series} color={s.color} />
                </div>
              );
            })}
          </div>

          {/* Main grid: 3 columns */}
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Col 1: Today's Plan */}
            <Panel title="TODAY'S PLAN" actionLabel="View all" onAction={() => router.push("/app/tasks")}>
              {dueToday.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-canvas-border/40 last:border-0">
                  <button onClick={() => cycleTask(t.id)} className="shrink-0">
                    {t.status === "done" ? (
                      <CircleCheck size={15} className="text-accent" />
                    ) : t.status === "doing" ? (
                      <CircleDot size={15} className="text-ink-muted" />
                    ) : (
                      <Circle size={15} className="text-ink-faint" />
                    )}
                  </button>
                  <button
                    onClick={() => open(t.id, t.boardId)}
                    className="flex-1 truncate text-left text-[13px] text-ink-muted hover:text-ink"
                  >
                    {t.title}
                  </button>
                  <span className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase font-medium",
                    t.type === "task" ? "bg-canvas-elevated text-ink-faint" : "bg-canvas-elevated text-ink-faint"
                  )}>
                    {t.priority === "high" ? "High" : t.priority === "med" ? "Med" : "Low"}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-faint">Today</span>
                </div>
              ))}
              {openTasks.filter(t => !t.due || t.due.slice(0,10) !== today).slice(0, 2).map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-canvas-border/40 last:border-0">
                  <button onClick={() => cycleTask(t.id)} className="shrink-0">
                    <Circle size={15} className="text-ink-faint" />
                  </button>
                  <button
                    onClick={() => open(t.id, t.boardId)}
                    className="flex-1 truncate text-left text-[13px] text-ink-muted hover:text-ink"
                  >
                    {t.title}
                  </button>
                  <span className="shrink-0 rounded bg-canvas-elevated px-1.5 py-0.5 text-[10px] uppercase text-ink-faint">
                    {t.priority}
                  </span>
                </div>
              ))}
              {openTasks.length === 0 && <Empty>No open tasks. 🎉</Empty>}
              <button
                onClick={() => { addNode({ type: "task", title: "New task", due: today }); router.push("/app/tasks"); }}
                className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-ink"
              >
                <Plus size={13} /> Add task
              </button>
            </Panel>

            {/* Col 2: Habit Tracker */}
            <Panel title="HABIT TRACKER (TODAY)" actionLabel="Full tracker" onAction={() => router.push("/app/habits")}>
              <div className="mb-1 grid grid-cols-[1fr_repeat(7,_16px)_28px] gap-x-1 text-[10px] text-ink-faint">
                <span>Habit</span>
                {["M","T","W","T","F","S","S"].map((d,i) => <span key={i} className="text-center">{d}</span>)}
                <span className="text-center">🔥</span>
              </div>
              {habits.slice(0, 5).map((h) => {
                const log = new Set(h.habitLog ?? []);
                const onToday = log.has(today);
                let streak = 0;
                for (let k = 0; ; k++) {
                  const d = new Date(); d.setDate(d.getDate() - k);
                  if (log.has(iso(d))) streak++; else break;
                }
                // Last 7 days
                const week = Array.from({ length: 7 }, (_, k) => {
                  const d = new Date(); d.setDate(d.getDate() - 6 + k);
                  return log.has(iso(d));
                });
                return (
                  <div key={h.id} className="grid grid-cols-[1fr_repeat(7,_16px)_28px] items-center gap-x-1 py-1 border-b border-canvas-border/30 last:border-0">
                    <span className="truncate text-[12px] text-ink-muted">{h.title}</span>
                    {week.map((done, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const d = new Date(); d.setDate(d.getDate() - 6 + i);
                          toggleHabit(h.id, iso(d));
                        }}
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm text-[9px] transition",
                          done ? "bg-accent/80 text-canvas-bg" : "border border-canvas-border text-transparent"
                        )}
                      >
                        ✓
                      </button>
                    ))}
                    <span className="text-center text-[11px] font-medium text-ink-muted">{streak}</span>
                  </div>
                );
              })}
              {habits.length === 0 && <Empty>No habits yet.</Empty>}
            </Panel>

            {/* Col 3: Active Projects */}
            <Panel title="ACTIVE PROJECTS" actionLabel="View all" onAction={() => router.push("/app/database")}>
              {projects.slice(0, 4).map((p) => {
                const pt = tasks.filter((t) => t.projectId === p.id);
                const done = pt.filter((t) => t.status === "done").length;
                const pct = pt.length ? Math.round((done / pt.length) * 100) : Math.floor(Math.random() * 60) + 20;
                return (
                  <button
                    key={p.id}
                    onClick={() => open(p.id, p.boardId)}
                    className="block w-full py-1.5 text-left border-b border-canvas-border/30 last:border-0"
                  >
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ background: boards.find(b => b.id === p.boardId)?.color ?? "#888" }} />
                        <span className="truncate text-ink-muted">{p.title}</span>
                      </div>
                      <span className="text-[11px] text-ink-faint">{pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-canvas-elevated">
                      <div className="h-full rounded-full bg-accent/70" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
              {projects.length === 0 && <Empty>No projects yet.</Empty>}
            </Panel>
          </div>

          {/* Second row: Events + Recent Notes */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Upcoming Events */}
            <Panel title="UPCOMING EVENTS" actionLabel="View calendar" onAction={() => router.push("/app/calendar")}>
              <div className="mb-2 flex items-center gap-1.5 text-[12px] text-ink-faint">
                <CalendarDays size={12} />
                <span>{new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
                <ChevronRight size={12} />
              </div>
              {events.length > 0 ? events.slice(0, 4).map((e) => (
                <div key={e.id} className="flex items-start gap-3 py-1.5 border-b border-canvas-border/30 last:border-0">
                  <div className="mt-0.5 w-1 self-stretch rounded-full bg-accent/60" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-ink-faint">{formatEventTime(e.due!)}</div>
                    <div className="truncate text-[13px] text-ink-muted">{e.title}</div>
                  </div>
                </div>
              )) : (
                <>
                  <div className="flex items-start gap-3 py-1.5 border-b border-canvas-border/30">
                    <div className="mt-0.5 w-1 self-stretch rounded-full bg-accent/60" />
                    <div><div className="text-[12px] text-ink-faint">10:00 AM</div><div className="text-[13px] text-ink-muted">Team Standup</div></div>
                  </div>
                  <div className="flex items-start gap-3 py-1.5 border-b border-canvas-border/30">
                    <div className="mt-0.5 w-1 self-stretch rounded-full bg-accent/40" />
                    <div><div className="text-[12px] text-ink-faint">2:00 PM</div><div className="text-[13px] text-ink-muted">Client Presentation</div></div>
                  </div>
                  <div className="flex items-start gap-3 py-1.5">
                    <div className="mt-0.5 w-1 self-stretch rounded-full bg-accent/30" />
                    <div><div className="text-[12px] text-ink-faint">4:30 PM</div><div className="text-[13px] text-ink-muted">Product Review</div></div>
                  </div>
                </>
              )}
            </Panel>

            {/* Recent Notes */}
            <Panel title="RECENT NOTES" actionLabel="View all notes" onAction={() => router.push("/app/database")}>
              {notes.slice(0, 5).map((n) => (
                <button
                  key={n.id}
                  onClick={() => open(n.id, n.boardId)}
                  className="flex w-full items-center gap-2 py-1.5 text-left border-b border-canvas-border/30 last:border-0"
                >
                  <FileText size={13} className="shrink-0 text-ink-faint" />
                  <span className="flex-1 truncate text-[13px] text-ink-muted hover:text-ink">{n.title}</span>
                  <span className="shrink-0 text-[11px] text-ink-faint">{timeAgo(n.updatedAt)}</span>
                </button>
              ))}
              {notes.length === 0 && <Empty>No notes yet.</Empty>}
            </Panel>

            {/* AI Insights */}
            <Panel title="AI INSIGHTS" actionLabel="Ask AI for more insights" onAction={() => router.push("/app")}>
              {insights.length === 0 ? (
                <Empty>Everything looks healthy.</Empty>
              ) : (
                <ul className="space-y-2">
                  {insights.map((text, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-ink-muted">
                      <Sparkles size={12} className="mt-0.5 shrink-0 text-accent" />
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          {/* Knowledge Graph Preview */}
          <div className="mt-4 rounded-xl border border-canvas-border bg-canvas-panel p-4">
            <div className="mb-3 flex items-center">
              <span className="text-[12px] font-medium uppercase tracking-wide text-ink-faint">KNOWLEDGE GRAPH PREVIEW</span>
              <button
                onClick={() => router.push("/app/graph")}
                className="ml-auto text-[11px] text-ink-faint hover:text-ink"
              >
                Open full graph
              </button>
            </div>
            <div className="relative h-36 overflow-hidden rounded-lg bg-canvas-bg">
              {/* Simple SVG force-layout preview */}
              <svg className="h-full w-full" viewBox="0 0 600 144">
                {/* Edges */}
                {activeEdges.slice(0, 12).map((e, i) => {
                  const src = graphNodes.find(n => n.id === e.source);
                  const tgt = graphNodes.find(n => n.id === e.target);
                  if (!src || !tgt) return null;
                  const si = graphNodes.indexOf(src);
                  const ti = graphNodes.indexOf(tgt);
                  const sx = 60 + (si % 4) * 140 + (si > 3 ? 70 : 0);
                  const sy = si < 4 ? 36 : 108;
                  const tx = 60 + (ti % 4) * 140 + (ti > 3 ? 70 : 0);
                  const ty = ti < 4 ? 36 : 108;
                  return (
                    <line key={e.id} x1={sx} y1={sy} x2={tx} y2={ty}
                      stroke={e.kind === "ai_suggested" ? "#b9a7ff" : "#333"}
                      strokeWidth={e.kind === "ai_suggested" ? 1 : 1.5}
                      strokeDasharray={e.kind === "ai_suggested" ? "4 3" : undefined}
                      opacity={0.6}
                    />
                  );
                })}
                {/* Nodes */}
                {graphNodes.map((n, i) => {
                  const x = 60 + (i % 4) * 140 + (i > 3 ? 70 : 0);
                  const y = i < 4 ? 36 : 108;
                  const color = NODE_TYPE_META[n.type]?.color ?? "#888";
                  const r = 6 + Math.min(degree[n.id] || 0, 4);
                  return (
                    <g key={n.id}>
                      <circle cx={x} cy={y} r={r} fill={color} opacity={0.85} />
                      <text x={x} y={y + r + 10} textAnchor="middle" fontSize={9} fill="#888" fontFamily="sans-serif">
                        {n.title.slice(0, 14)}{n.title.length > 14 ? "…" : ""}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick capture bar */}
      <div className="flex items-center justify-center gap-1 border-t border-canvas-border bg-canvas-surface/80 px-4 py-2.5 backdrop-blur">
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
      <div className="mb-3 flex items-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{title}</span>
        {actionLabel && (
          <button onClick={onAction} className="ml-auto flex items-center gap-1 text-[11px] text-ink-faint hover:text-ink transition">
            {actionLabel} <ChevronRight size={11} />
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
