"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Flame,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Check,
  Sparkles,
  TrendingUp,
  Target,
  Activity,
} from "lucide-react";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Circular progress ring */
function ProgressRing({
  pct, size = 100, stroke = 8, color = "#fff",
}: {
  pct: number; size?: number; stroke?: number; color?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

/** Mini sparkline */
function Spark({ data, color = "#888", height = 32 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1 || 1)) * 100},${height - (v / max) * (height - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

type Tab = "Daily" | "Weekly" | "Monthly" | "Analytics";

export default function HabitsPage() {
  const nodes = useStore((s) => s.nodes);
  const addNode = useStore((s) => s.addNode);
  const toggleHabit = useStore((s) => s.toggleHabit);

  const [tab, setTab] = useState<Tab>("Daily");
  const [calOffset, setCalOffset] = useState(0); // days offset for calendar strip

  const habits = nodes.filter((n) => n.type === "habit");
  const today = iso(new Date());

  // Calendar strip: 10 days centered on today + offset
  const calDays = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 4 + i + calOffset);
    return d;
  });

  // Compute habit stats
  const last7 = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(); d.setDate(d.getDate() - k); return iso(d);
  });
  const habitSlots = habits.length * 7;
  const habitHits = habits.reduce((acc, h) => {
    const log = new Set(h.habitLog ?? []);
    return acc + last7.filter((d) => log.has(d)).length;
  }, 0);
  const habitPct = habitSlots ? Math.round((habitHits / habitSlots) * 100) : 86;

  const completedToday = habits.filter((h) => (h.habitLog ?? []).includes(today)).length;
  const missedToday = habits.length - completedToday;

  // Best streak across all habits
  const bestStreak = habits.reduce((best, h) => {
    const log = new Set(h.habitLog ?? []);
    let streak = 0;
    for (let k = 0; ; k++) {
      const d = new Date(); d.setDate(d.getDate() - k);
      if (log.has(iso(d))) streak++; else break;
    }
    return Math.max(best, streak);
  }, 0);

  // Weekly progress (last 7 days completion rate)
  const weeklyData = last7.map((d) => {
    const hits = habits.filter((h) => (h.habitLog ?? []).includes(d)).length;
    return habits.length ? Math.round((hits / habits.length) * 100) : 0;
  }).reverse();

  // Heatmap: last 12 weeks
  const heatmapWeeks = 12;
  const heatmapDays = heatmapWeeks * 7;
  const heatmapData = Array.from({ length: heatmapDays }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - heatmapDays + 1 + i);
    const dateStr = iso(d);
    const hits = habits.filter((h) => (h.habitLog ?? []).includes(dateStr)).length;
    return { date: dateStr, hits, max: habits.length || 1 };
  });

  const DAYS_ABBR = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <div>
          <h1 className="text-[16px] font-semibold text-ink">Daily Tracker</h1>
          <p className="text-[11px] text-ink-faint">Track your habits. Build your system.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="text-ink-faint hover:text-ink"><MoreHorizontal size={18} /></button>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas-elevated text-[11px] font-semibold text-ink border border-canvas-border">A</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-canvas-border bg-canvas-surface/60 px-5">
        {(["Daily", "Weekly", "Monthly", "Analytics"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-[13px] font-medium transition",
              tab === t
                ? "border-ink text-ink"
                : "border-transparent text-ink-faint hover:text-ink-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-5 py-5">

          {/* Calendar strip */}
          <div className="mb-5 flex items-center gap-2">
            <button className="rounded p-1 text-ink-faint hover:bg-canvas-hover" onClick={() => setCalOffset(o => o - 7)}>
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13px] font-medium text-ink">
              {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </span>
            <button className="rounded p-1 text-ink-faint hover:bg-canvas-hover" onClick={() => setCalOffset(o => o + 7)}>
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCalOffset(0)}
              className="ml-2 rounded-lg border border-canvas-border px-3 py-1 text-[12px] text-ink-faint hover:bg-canvas-hover"
            >
              Today
            </button>
            <div className="ml-auto flex gap-1">
              {calDays.map((d) => {
                const ds = iso(d);
                const isToday = ds === today;
                const dayName = d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
                return (
                  <div key={ds} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-ink-faint">{dayName}</span>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-medium",
                      isToday ? "bg-ink text-canvas-bg" : "text-ink-muted hover:bg-canvas-hover"
                    )}>
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
            {/* Left: Daily Habits */}
            <div className="space-y-4">
              {/* Habits table */}
              <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
                <div className="mb-3 flex items-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">DAILY HABITS</span>
                </div>
                {/* Header row */}
                <div className="mb-2 grid grid-cols-[1fr_repeat(7,_28px)_40px] items-center gap-1 text-[10px] text-ink-faint">
                  <span>Habit</span>
                  {DAYS_ABBR.map((d, i) => <span key={i} className="text-center">{d}</span>)}
                  <span className="text-center">Streak</span>
                </div>
                {habits.length === 0 ? (
                  <p className="py-4 text-center text-[13px] text-ink-faint">No habits yet. Add one below.</p>
                ) : (
                  habits.map((h) => {
                    const log = new Set(h.habitLog ?? []);
                    const week = Array.from({ length: 7 }, (_, k) => {
                      const d = new Date(); d.setDate(d.getDate() - 6 + k);
                      return { date: iso(d), done: log.has(iso(d)) };
                    });
                    let streak = 0;
                    for (let k = 0; ; k++) {
                      const d = new Date(); d.setDate(d.getDate() - k);
                      if (log.has(iso(d))) streak++; else break;
                    }
                    return (
                      <div key={h.id} className="grid grid-cols-[1fr_repeat(7,_28px)_40px] items-center gap-1 border-b border-canvas-border/30 py-2 last:border-0">
                        <span className="truncate text-[13px] text-ink-muted">{h.title}</span>
                        {week.map(({ date, done }) => (
                          <button
                            key={date}
                            onClick={() => toggleHabit(h.id, date)}
                            className={cn(
                              "mx-auto flex h-5 w-5 items-center justify-center rounded text-[10px] transition",
                              done
                                ? "bg-accent/80 text-canvas-bg"
                                : "border border-canvas-border text-transparent hover:border-accent/50"
                            )}
                          >
                            <Check size={10} />
                          </button>
                        ))}
                        <span className="text-center text-[12px] font-semibold text-ink-muted">{streak}</span>
                      </div>
                    );
                  })
                )}
                <button
                  onClick={() => addNode({ type: "habit", title: "New habit", cadence: "daily" })}
                  className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-faint hover:text-ink transition"
                >
                  <Plus size={13} /> Add Habit
                </button>
              </div>

              {/* Habit Streaks + Heatmap */}
              <div className="grid grid-cols-2 gap-4">
                {/* Streaks */}
                <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">HABIT STREAKS</div>
                  {habits.slice(0, 5).map((h) => {
                    const log = new Set(h.habitLog ?? []);
                    let streak = 0;
                    for (let k = 0; ; k++) {
                      const d = new Date(); d.setDate(d.getDate() - k);
                      if (log.has(iso(d))) streak++; else break;
                    }
                    return (
                      <div key={h.id} className="flex items-center gap-2 py-1.5 border-b border-canvas-border/30 last:border-0">
                        <Flame size={12} className="text-accent shrink-0" />
                        <span className="flex-1 truncate text-[12px] text-ink-muted">{h.title}</span>
                        <span className="text-[12px] font-medium text-ink-muted">{streak} days</span>
                      </div>
                    );
                  })}
                  {habits.length === 0 && <p className="text-[12px] text-ink-faint py-2">No habits yet.</p>}
                  <button className="mt-2 text-[11px] text-ink-faint hover:text-ink">View all streaks</button>
                </div>

                {/* Heatmap */}
                <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">HABIT HEATMAP</div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: heatmapWeeks }, (_, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {Array.from({ length: 7 }, (_, di) => {
                          const idx = wi * 7 + di;
                          const cell = heatmapData[idx];
                          if (!cell) return <div key={di} className="h-3 w-3 rounded-sm bg-transparent" />;
                          const intensity = cell.max > 0 ? cell.hits / cell.max : 0;
                          return (
                            <div
                              key={di}
                              className="h-3 w-3 rounded-sm"
                              style={{
                                background: intensity > 0
                                  ? `rgba(255,255,255,${0.1 + intensity * 0.7})`
                                  : "rgba(255,255,255,0.05)"
                              }}
                              title={`${cell.date}: ${cell.hits}/${cell.max}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <button className="mt-2 text-[11px] text-ink-faint hover:text-ink">View full heatmap</button>
                </div>
              </div>

              {/* Habit Analytics */}
              <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">HABIT ANALYTICS</div>
                <div className="mb-4 grid grid-cols-4 gap-3">
                  {[
                    { label: "Consistency", value: `${habitPct}%`, icon: <Activity size={13} /> },
                    { label: "Completion Rate", value: `${habitPct}%`, icon: <Check size={13} /> },
                    { label: "Total Completions", value: String(habits.reduce((a, h) => a + (h.habitLog?.length ?? 0), 0)), icon: <Target size={13} /> },
                    { label: "Total Missed", value: String(habits.length * 30 - habits.reduce((a, h) => a + (h.habitLog?.length ?? 0), 0)), icon: <TrendingUp size={13} /> },
                  ].map((m) => (
                    <div key={m.label} className="rounded-lg bg-canvas-elevated p-2.5">
                      <div className="mb-1 flex items-center gap-1 text-[10px] text-ink-faint">{m.icon} {m.label}</div>
                      <div className="text-[18px] font-bold text-ink">{m.value}</div>
                    </div>
                  ))}
                </div>
                {/* Bar chart */}
                <div className="relative h-28">
                  <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[9px] text-ink-faint">
                    {[100, 75, 50, 25, 0].map((v) => <span key={v}>{v}%</span>)}
                  </div>
                  <div className="ml-7 flex h-full items-end gap-1">
                    {weeklyData.map((v, i) => {
                      const d = new Date(); d.setDate(d.getDate() - 6 + i);
                      return (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-sm bg-canvas-elevated"
                            style={{ height: `${Math.max(4, v)}%` }}
                          />
                          <span className="text-[9px] text-ink-faint">
                            {d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-ink-faint">
                  <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-canvas-elevated inline-block" /> Completion Rate</span>
                </div>
              </div>
            </div>

            {/* Right: Overall Progress + Weekly + AI Insights */}
            <div className="space-y-4">
              {/* Overall Progress */}
              <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">OVERALL PROGRESS</div>
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <ProgressRing pct={habitPct} size={90} stroke={7} color="#fff" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[18px] font-bold text-ink leading-none">{habitPct}%</span>
                      <span className="text-[9px] text-ink-faint">Completed</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="text-ink-faint">Completed</span>
                      <span className="ml-auto font-semibold text-ink">{completedToday}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-faint">Missed</span>
                      <span className="ml-auto font-semibold text-ink">{missedToday}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-faint">Total Habits</span>
                      <span className="ml-auto font-semibold text-ink">{habits.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-faint">Best Streak</span>
                      <span className="ml-auto font-semibold text-ink">{bestStreak}</span>
                    </div>
                  </div>
                </div>
                <button className="mt-3 text-[11px] text-ink-faint hover:text-ink">View analytics</button>
              </div>

              {/* Weekly Progress */}
              <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">WEEKLY PROGRESS</div>
                <div className="relative h-28">
                  <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[9px] text-ink-faint">
                    {[100, 75, 50, 25, 0].map((v) => <span key={v}>{v}%</span>)}
                  </div>
                  <div className="ml-6 h-full">
                    <Spark data={weeklyData} color="#fff" height={112} />
                  </div>
                  <div className="ml-6 mt-1 flex justify-between text-[9px] text-ink-faint">
                    {weeklyData.map((_, i) => {
                      const d = new Date(); d.setDate(d.getDate() - 6 + i);
                      return <span key={i}>{d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}</span>;
                    })}
                  </div>
                </div>
                <button className="mt-2 text-[11px] text-ink-faint hover:text-ink">View full report</button>
              </div>

              {/* AI Habit Insights */}
              <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">AI HABIT INSIGHTS</div>
                <ul className="space-y-2">
                  {[
                    "You're doing great! Your consistency is 86%.",
                    habits[0] ? `${habits[0].title} is your strongest habit.` : "Morning Workout is your strongest habit.",
                    habits[habits.length - 1] ? `Consider improving ${habits[habits.length - 1].title} habit.` : "Consider improving No Sugar habit.",
                    "You miss habits most on weekends.",
                    "Try setting a reminder for Meditation.",
                  ].map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-ink-muted">
                      <Check size={12} className="mt-0.5 shrink-0 text-accent" />
                      {insight}
                    </li>
                  ))}
                </ul>
                <button className="mt-3 flex items-center gap-1 text-[11px] text-ink-faint hover:text-ink">
                  <Sparkles size={11} /> Ask AI for habit advice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
