"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { SemanticNode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { streamOpenRouterClient } from "@/lib/ai/openrouter-client";
import {
  Flame,
  Plus,
  Check,
  Sparkles,
  Trash2,
  Target,
  Trophy,
  CalendarCheck,
  Activity,
  Loader2,
} from "lucide-react";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const CATEGORIES = ["Health", "Learning", "Business", "Personal", "Fitness"] as const;
const CAT_FILTERS = ["All", ...CATEGORIES] as const;

type Tab = "Daily" | "Weekly" | "Monthly" | "Analytics";

function currentStreak(log: Set<string>): number {
  let s = 0;
  const start = log.has(iso(new Date())) ? 0 : 1;
  for (let k = start; ; k++) {
    if (log.has(iso(addDays(-k)))) s++;
    else break;
  }
  return s;
}
function longestStreak(log: Set<string>): number {
  const days = [...log].sort();
  let best = 0,
    run = 0,
    prev: number | null = null;
  for (const d of days) {
    const t = new Date(d).getTime();
    if (prev !== null && t - prev === 864e5) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}
function rateLast(log: Set<string>, days: number): number {
  let hits = 0;
  for (let k = 0; k < days; k++) if (log.has(iso(addDays(-k)))) hits++;
  return Math.round((hits / days) * 100);
}

/** Monochrome heatmap colour: dark → chrome → white. */
function heatColor(ratio: number): string {
  if (ratio <= 0) return "var(--bg-elevated)";
  const lum = Math.round(40 + ratio * 200); // 40..240
  return `rgb(${lum},${lum},${lum})`;
}

export default function HabitsPage() {
  const nodes = useStore((s) => s.nodes);
  const addNode = useStore((s) => s.addNode);
  const updateNode = useStore((s) => s.updateNode);
  const removeNode = useStore((s) => s.removeNode);
  const toggleHabit = useStore((s) => s.toggleHabit);
  const aiKey = useStore((s) => s.aiKey);
  const aiModel = useStore((s) => s.aiModel);

  const [tab, setTab] = useState<Tab>("Daily");
  const [cat, setCat] = useState<(typeof CAT_FILTERS)[number]>("All");
  const [selId, setSelId] = useState<string | null>(null);
  const [coach, setCoach] = useState<string | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);

  const today = iso(new Date());
  const allHabits = nodes.filter((n) => n.type === "habit");
  const habits = allHabits.filter((h) => cat === "All" || (h.category ?? "Personal") === cat);
  const selected = allHabits.find((h) => h.id === selId) ?? null;

  const logOf = (h: SemanticNode) => new Set(h.habitLog ?? []);

  // ---- aggregate analytics ----
  const stats = useMemo(() => {
    const completionRate =
      habits.length === 0
        ? 0
        : Math.round(
            habits.reduce((a, h) => a + rateLast(logOf(h), 30), 0) / habits.length
          );
    const totalCompletions = habits.reduce((a, h) => a + (h.habitLog?.length ?? 0), 0);
    const best = habits.reduce((m, h) => Math.max(m, currentStreak(logOf(h))), 0);
    const longest = habits.reduce((m, h) => Math.max(m, longestStreak(logOf(h))), 0);
    const consistency =
      habits.length === 0
        ? 0
        : Math.round(
            habits.reduce((a, h) => a + rateLast(logOf(h), 14), 0) / habits.length
          );
    return { completionRate, totalCompletions, best, longest, consistency };
  }, [habits]);

  const addHabit = () =>
    setSelId(
      addNode({
        type: "habit",
        title: "New habit",
        habitLog: [],
        cadence: "daily",
        category: cat === "All" ? "Personal" : cat,
      }).id
    );

  const runCoach = async (scope: "weekly" | "monthly") => {
    if (!aiKey || coachBusy) return;
    setCoachBusy(true);
    setCoach("Reviewing your habits…");
    const data = allHabits
      .map((h) => {
        const log = logOf(h);
        return `- ${h.title} [${h.category ?? "Personal"}]: streak ${currentStreak(
          log
        )}d, last 30d ${rateLast(log, 30)}%`;
      })
      .join("\n");
    try {
      let acc = "";
      for await (const d of streamOpenRouterClient({
        apiKey: aiKey,
        model: aiModel,
        maxTokens: 500,
        messages: [
          { role: "system", content: "You are a concise, encouraging habit coach." },
          {
            role: "user",
            content: `Give a ${scope} review of these habits: call out the strongest, the most at-risk, and 2–3 specific improvements. Be terse.\n\n${data}`,
          },
        ],
      })) {
        acc += d;
        setCoach(acc);
      }
    } catch (e) {
      setCoach(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCoachBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <div>
          <h1 className="text-[16px] font-semibold text-ink">Habits</h1>
          <p className="text-[11px] text-ink-faint">Track your habits. Build your system.</p>
        </div>
        <button
          onClick={addHabit}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          <Plus size={14} /> New habit
        </button>
      </div>

      {/* Tabs + category filter */}
      <div className="flex flex-wrap items-center gap-1 border-b border-canvas-border bg-canvas-surface/60 px-5">
        {(["Daily", "Weekly", "Monthly", "Analytics"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-[13px] font-medium transition",
              tab === t ? "border-ink text-ink" : "border-transparent text-ink-faint hover:text-ink-muted"
            )}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto flex gap-1 py-1.5">
          {CAT_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] transition",
                cat === c ? "bg-canvas-hover text-ink" : "text-ink-faint hover:text-ink"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 py-5">
          {habits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-canvas-border py-16 text-center text-[13px] text-ink-faint">
              No habits{cat !== "All" ? ` in ${cat}` : ""} yet — click{" "}
              <span className="text-ink">New habit</span> to start.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
              <div className="space-y-5">
                {tab === "Daily" && <DailyView habits={habits} onToggle={toggleHabit} onSelect={setSelId} />}
                {tab === "Weekly" && <WeeklyView habits={habits} onToggle={toggleHabit} />}
                {tab === "Monthly" && <MonthlyView habits={habits} onToggle={toggleHabit} />}
                {tab === "Analytics" && <Analytics habits={habits} stats={stats} />}
                <Heatmap habits={habits} />
              </div>

              {/* Right: overview + details / coach */}
              <div className="space-y-4">
                <Overview habits={habits} today={today} stats={stats} />
                {selected ? (
                  <Details
                    key={selected.id}
                    habit={selected}
                    onUpdate={(p) => updateNode(selected.id, p)}
                    onDelete={() => {
                      removeNode(selected.id);
                      setSelId(null);
                    }}
                    aiKey={aiKey}
                    aiModel={aiModel}
                  />
                ) : (
                  <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4 text-[12px] text-ink-faint">
                    Select a habit (Daily view) to see details & AI suggestions.
                  </div>
                )}

                {/* AI Coach */}
                <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
                    <Sparkles size={13} /> AI habit coach
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => runCoach("weekly")}
                      disabled={!aiKey || coachBusy}
                      className="flex-1 rounded-lg border border-canvas-border px-2 py-1.5 text-[12px] text-ink-muted hover:text-ink disabled:opacity-40"
                    >
                      Weekly review
                    </button>
                    <button
                      onClick={() => runCoach("monthly")}
                      disabled={!aiKey || coachBusy}
                      className="flex-1 rounded-lg border border-canvas-border px-2 py-1.5 text-[12px] text-ink-muted hover:text-ink disabled:opacity-40"
                    >
                      Monthly review
                    </button>
                  </div>
                  {!aiKey && (
                    <p className="mt-1.5 text-[10px] text-ink-faint">Connect OpenRouter in Settings.</p>
                  )}
                  {coach && (
                    <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-muted">
                      {coachBusy && <Loader2 size={11} className="mr-1 inline animate-spin" />}
                      {coach}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Overview (right top) ---------------- */
function Overview({
  habits,
  today,
  stats,
}: {
  habits: SemanticNode[];
  today: string;
  stats: { completionRate: number; best: number };
}) {
  const done = habits.filter((h) => (h.habitLog ?? []).includes(today)).length;
  const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;
  const r = 34,
    circ = 2 * Math.PI * r,
    off = circ - (pct / 100) * circ;
  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
        Today
      </div>
      <div className="flex items-center gap-4">
        <svg width={84} height={84} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={42} cy={42} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
          <circle
            cx={42}
            cy={42}
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={8}
            strokeDasharray={circ}
            strokeDashoffset={off}
            strokeLinecap="round"
          />
        </svg>
        <div>
          <div className="text-[22px] font-semibold text-ink">{pct}%</div>
          <div className="text-[11px] text-ink-faint">
            {done}/{habits.length} done
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg bg-canvas-elevated p-2">
          <div className="text-[16px] font-semibold text-ink">{stats.best}</div>
          <div className="text-[10px] text-ink-faint">best streak</div>
        </div>
        <div className="rounded-lg bg-canvas-elevated p-2">
          <div className="text-[16px] font-semibold text-ink">{stats.completionRate}%</div>
          <div className="text-[10px] text-ink-faint">30-day rate</div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Daily ---------------- */
function DailyView({
  habits,
  onToggle,
  onSelect,
}: {
  habits: SemanticNode[];
  onToggle: (id: string, date: string) => void;
  onSelect: (id: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, k) => addDays(-6 + k));
  return (
    <div className="overflow-x-auto rounded-xl border border-canvas-border bg-canvas-panel p-4">
      <div className="mb-2 flex items-center text-[11px] text-ink-faint">
        <span className="w-40">Habit</span>
        <div className="flex flex-1 justify-between">
          {days.map((d) => (
            <span key={iso(d)} className="w-9 text-center">
              {d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}
            </span>
          ))}
          <span className="w-12 text-right">Streak</span>
        </div>
      </div>
      {habits.map((h) => {
        const log = new Set(h.habitLog ?? []);
        return (
          <div key={h.id} className="flex items-center border-t border-canvas-border/50 py-2">
            <button
              onClick={() => onSelect(h.id)}
              className="w-40 truncate pr-2 text-left text-[13px] text-ink hover:text-accent-hover"
            >
              {h.title}
            </button>
            <div className="flex flex-1 items-center justify-between">
              {days.map((d) => {
                const k = iso(d);
                const on = log.has(k);
                return (
                  <button
                    key={k}
                    onClick={() => onToggle(h.id, k)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-md border transition",
                      on
                        ? "border-transparent bg-ink text-canvas-bg"
                        : "border-canvas-border text-ink-faint hover:border-accent-ring"
                    )}
                  >
                    {on && <Check size={13} />}
                  </button>
                );
              })}
              <span className="flex w-12 items-center justify-end gap-1 text-[12px] text-ink-muted">
                <Flame size={11} className="text-node-voice" />
                {currentStreak(log)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Weekly ---------------- */
function WeeklyView({
  habits,
  onToggle,
}: {
  habits: SemanticNode[];
  onToggle: (id: string, date: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, k) => addDays(-6 + k));
  const ranked = habits
    .map((h) => ({ h, rate: rateLast(new Set(h.habitLog ?? []), 7) }))
    .sort((a, b) => b.rate - a.rate);
  const weekScore = ranked.length
    ? Math.round(ranked.reduce((a, r) => a + r.rate, 0) / ranked.length)
    : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Weekly score" value={`${weekScore}%`} icon={<Activity size={14} />} />
        <Stat label="Best habit" value={ranked[0]?.h.title ?? "—"} icon={<Trophy size={14} />} small />
        <Stat
          label="Needs work"
          value={ranked[ranked.length - 1]?.h.title ?? "—"}
          icon={<Target size={14} />}
          small
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-canvas-border bg-canvas-panel p-4">
        <div className="mb-2 flex items-center text-[11px] text-ink-faint">
          <span className="w-40">Habit</span>
          <div className="flex flex-1 justify-between">
            {days.map((d) => (
              <span key={iso(d)} className="w-9 text-center">
                {d.getDate()}
              </span>
            ))}
            <span className="w-12 text-right">%</span>
          </div>
        </div>
        {habits.map((h) => {
          const log = new Set(h.habitLog ?? []);
          return (
            <div key={h.id} className="flex items-center border-t border-canvas-border/50 py-2">
              <span className="w-40 truncate pr-2 text-[13px] text-ink">{h.title}</span>
              <div className="flex flex-1 items-center justify-between">
                {days.map((d) => {
                  const k = iso(d);
                  const on = log.has(k);
                  return (
                    <button
                      key={k}
                      onClick={() => onToggle(h.id, k)}
                      className={cn(
                        "h-6 w-6 rounded",
                        on ? "bg-ink" : "bg-canvas-elevated hover:ring-1 hover:ring-accent-ring"
                      )}
                    />
                  );
                })}
                <span className="w-12 text-right text-[12px] text-ink-muted">
                  {rateLast(log, 7)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Monthly ---------------- */
function MonthlyView({
  habits,
  onToggle,
}: {
  habits: SemanticNode[];
  onToggle: (id: string, date: string) => void;
}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  return (
    <div className="overflow-x-auto rounded-xl border border-canvas-border bg-canvas-panel p-4">
      <div className="mb-2 text-[12px] font-medium text-ink">
        {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
      </div>
      <div className="min-w-[640px]">
        <div className="flex items-center text-[10px] text-ink-faint">
          <span className="w-36 shrink-0">Habit</span>
          {days.map((d) => (
            <span key={d.getDate()} className="w-5 text-center">
              {d.getDate()}
            </span>
          ))}
          <span className="w-10 shrink-0 text-right">%</span>
        </div>
        {habits.map((h) => {
          const log = new Set(h.habitLog ?? []);
          const hits = days.filter((d) => log.has(iso(d))).length;
          return (
            <div key={h.id} className="flex items-center border-t border-canvas-border/40 py-1">
              <span className="w-36 shrink-0 truncate pr-2 text-[12px] text-ink">{h.title}</span>
              {days.map((d) => {
                const k = iso(d);
                const on = log.has(k);
                return (
                  <button
                    key={k}
                    onClick={() => onToggle(h.id, k)}
                    title={k}
                    className="flex w-5 justify-center"
                  >
                    <span
                      className={cn("h-3.5 w-3.5 rounded-sm", on ? "bg-ink" : "bg-canvas-elevated")}
                    />
                  </button>
                );
              })}
              <span className="w-10 shrink-0 text-right text-[11px] text-ink-muted">
                {Math.round((hits / daysInMonth) * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Analytics ---------------- */
function Analytics({
  habits,
  stats,
}: {
  habits: SemanticNode[];
  stats: { completionRate: number; totalCompletions: number; best: number; longest: number; consistency: number };
}) {
  const ranking = habits
    .map((h) => ({ h, streak: currentStreak(new Set(h.habitLog ?? [])), rate: rateLast(new Set(h.habitLog ?? []), 30) }))
    .sort((a, b) => b.rate - a.rate || b.streak - a.streak);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Completion (30d)" value={`${stats.completionRate}%`} icon={<CalendarCheck size={14} />} />
        <Stat label="Current best streak" value={`${stats.best}d`} icon={<Flame size={14} />} />
        <Stat label="Longest streak" value={`${stats.longest}d`} icon={<Trophy size={14} />} />
        <Stat label="Total completions" value={String(stats.totalCompletions)} icon={<Check size={14} />} />
        <Stat label="Consistency (14d)" value={`${stats.consistency}%`} icon={<Activity size={14} />} />
        <Stat label="Active habits" value={String(habits.length)} icon={<Target size={14} />} />
      </div>
      <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
        <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
          Habit ranking
        </div>
        {ranking.map((r, i) => (
          <div key={r.h.id} className="flex items-center gap-3 border-t border-canvas-border/50 py-2 text-[13px]">
            <span className="w-5 text-ink-faint">{i + 1}</span>
            <span className="flex-1 truncate text-ink">{r.h.title}</span>
            <span className="text-[11px] text-ink-faint">{r.streak}d</span>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-canvas-elevated">
              <div className="h-full rounded-full bg-accent" style={{ width: `${r.rate}%` }} />
            </div>
            <span className="w-9 text-right text-[11px] text-ink-muted">{r.rate}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Heatmap ---------------- */
function Heatmap({ habits }: { habits: SemanticNode[] }) {
  const weeks = 16;
  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = addDays(-(weeks * 7 - 1) + i);
    const k = iso(d);
    const hits = habits.filter((h) => (h.habitLog ?? []).includes(k)).length;
    return { k, ratio: habits.length ? hits / habits.length : 0 };
  });
  // group into columns of 7 (weeks)
  const cols: { k: string; ratio: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-wide text-ink-faint">
        Consistency heatmap
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((c) => (
              <span
                key={c.k}
                title={`${c.k}: ${Math.round(c.ratio * 100)}%`}
                className="h-3 w-3 rounded-sm"
                style={{ background: heatColor(c.ratio) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-ink-faint">
        Less
        {[0, 0.34, 0.67, 1].map((r) => (
          <span key={r} className="h-2.5 w-2.5 rounded-sm" style={{ background: heatColor(r) }} />
        ))}
        More
      </div>
    </div>
  );
}

/* ---------------- Details ---------------- */
function Details({
  habit,
  onUpdate,
  onDelete,
  aiKey,
  aiModel,
}: {
  habit: SemanticNode;
  onUpdate: (p: Partial<SemanticNode>) => void;
  onDelete: () => void;
  aiKey: string | null;
  aiModel: string;
}) {
  const log = new Set(habit.habitLog ?? []);
  const [tip, setTip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const suggest = async () => {
    if (!aiKey || busy) return;
    setBusy(true);
    setTip("Thinking…");
    try {
      let acc = "";
      for await (const d of streamOpenRouterClient({
        apiKey: aiKey,
        model: aiModel,
        maxTokens: 220,
        messages: [
          { role: "system", content: "You are a concise habit coach." },
          {
            role: "user",
            content: `Habit "${habit.title}" (${habit.category ?? "Personal"}). Current streak ${currentStreak(
              log
            )} days, 30-day rate ${rateLast(log, 30)}%. Give one specific, actionable tip to improve it.`,
          },
        ],
      })) {
        acc += d;
        setTip(acc);
      }
    } catch (e) {
      setTip(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[12px] font-medium uppercase tracking-wide text-ink-faint">Details</span>
        <button onClick={onDelete} className="ml-auto text-ink-faint hover:text-danger" title="Delete habit">
          <Trash2 size={14} />
        </button>
      </div>
      <input
        value={habit.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        className="mb-2 w-full bg-transparent text-[15px] font-semibold text-ink outline-none"
      />
      <select
        value={habit.category ?? "Personal"}
        onChange={(e) => onUpdate({ category: e.target.value })}
        className="mb-2 w-full rounded-lg border border-canvas-border bg-canvas-bg px-2 py-1.5 text-[12px] text-ink-muted outline-none"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        value={habit.goal ?? ""}
        onChange={(e) => onUpdate({ goal: e.target.value })}
        placeholder="Goal (e.g. every day)"
        className="mb-2 w-full rounded-lg border border-canvas-border bg-canvas-bg px-2 py-1.5 text-[12px] text-ink-muted outline-none focus:border-accent-ring"
      />
      <textarea
        value={habit.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="Notes / description…"
        className="mb-3 min-h-[60px] w-full resize-y rounded-lg border border-canvas-border bg-canvas-bg px-2 py-1.5 text-[12px] text-ink-muted outline-none focus:border-accent-ring"
      />
      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniStat v={`${currentStreak(log)}`} l="streak" />
        <MiniStat v={`${longestStreak(log)}`} l="longest" />
        <MiniStat v={`${rateLast(log, 30)}%`} l="30d" />
      </div>
      <button
        onClick={suggest}
        disabled={!aiKey || busy}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-canvas-border px-2 py-1.5 text-[12px] text-ink-muted hover:text-ink disabled:opacity-40"
      >
        <Sparkles size={12} /> AI suggestion
      </button>
      {tip && <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-muted">{tip}</p>}
    </div>
  );
}

function MiniStat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-lg bg-canvas-elevated p-2">
      <div className="text-[15px] font-semibold text-ink">{v}</div>
      <div className="text-[10px] text-ink-faint">{l}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  small,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-panel p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-ink-faint">
        {icon} {label}
      </div>
      <div className={cn("font-semibold text-ink", small ? "truncate text-[14px]" : "text-[20px]")}>
        {value}
      </div>
    </div>
  );
}
