"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { SemanticNode } from "@/lib/types";
import { Flame, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const lastDays = (n: number) =>
  Array.from({ length: n }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - k));
    return d;
  });

function streakOf(log: Set<string>): number {
  let s = 0;
  for (let k = 0; ; k++) {
    const d = new Date();
    d.setDate(d.getDate() - k);
    if (log.has(iso(d))) s++;
    else break;
  }
  return s;
}

/**
 * Habit Tracker — habits are nodes; this is the interactive grid: toggle days,
 * see streaks, completion %, and a 30-day trend. Lives alongside the canvas.
 */
export default function HabitsPage() {
  const nodes = useStore((s) => s.nodes);
  const addNode = useStore((s) => s.addNode);
  const toggleHabit = useStore((s) => s.toggleHabit);
  const select = useStore((s) => s.select);
  const router = useRouter();

  const habits = nodes.filter((n) => n.type === "habit");
  const days14 = lastDays(14);

  // Workspace completion % over the last 14 days.
  const totalSlots = habits.length * 14;
  const filled = habits.reduce((acc, h) => {
    const log = new Set(h.habitLog ?? []);
    return acc + days14.filter((d) => log.has(iso(d))).length;
  }, 0);
  const pct = totalSlots ? Math.round((filled / totalSlots) * 100) : 0;

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex flex-wrap items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <Flame size={16} className="text-ink-muted" />
        <h1 className="text-[15px] font-semibold text-ink">Habit Tracker</h1>
        <span className="text-[12px] text-ink-faint">
          {habits.length} habits · {pct}% last 14 days
        </span>
        <button
          onClick={() => {
            addNode({
              type: "habit",
              title: "New habit",
              cadence: "daily",
              habitLog: [],
            });
            router.push("/app");
          }}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          <Plus size={14} /> New habit
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        {habits.length === 0 ? (
          <p className="text-[13px] text-ink-faint">
            No habits yet. Add one to start tracking streaks.
          </p>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            {habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                days={days14}
                onToggle={(d) => toggleHabit(h.id, d)}
                onOpen={() => {
                  select(h.id);
                  router.push("/app");
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HabitRow({
  habit,
  days,
  onToggle,
  onOpen,
}: {
  habit: SemanticNode;
  days: Date[];
  onToggle: (date: string) => void;
  onOpen: () => void;
}) {
  const log = new Set(habit.habitLog ?? []);
  const streak = streakOf(log);
  const done = days.filter((d) => log.has(iso(d))).length;
  const pct = Math.round((done / days.length) * 100);

  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-panel p-3">
      <div className="mb-2 flex items-center gap-2">
        <button onClick={onOpen} className="text-[13px] font-medium text-ink hover:underline">
          {habit.title}
        </button>
        <span className="flex items-center gap-1 text-[11px] text-ink-faint">
          <Flame size={12} className="text-node-voice" /> {streak}
        </span>
        <span className="ml-auto text-[11px] text-ink-faint">{pct}%</span>
      </div>
      <div className="flex items-center gap-1">
        {days.map((d) => {
          const key = iso(d);
          const on = log.has(key);
          const isToday = key === iso(new Date());
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              title={d.toLocaleDateString()}
              className={cn(
                "flex h-7 flex-1 items-center justify-center rounded-md border text-[10px] transition",
                on
                  ? "border-transparent bg-node-voice/80 text-canvas-bg"
                  : "border-canvas-border text-ink-faint hover:border-accent-ring",
                isToday && !on && "ring-1 ring-accent-ring"
              )}
            >
              {on ? <Check size={12} /> : d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
