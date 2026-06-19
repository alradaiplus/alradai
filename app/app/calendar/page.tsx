"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META } from "@/lib/types";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Calendar — a month view of everything dated: task due dates and event nodes.
 * Click an item to open it on the canvas.
 */
export default function CalendarPage() {
  const nodes = useStore((s) => s.nodes);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const addNode = useStore((s) => s.addNode);
  const router = useRouter();

  const addEvent = (dayIso: string) => {
    const title = prompt("New event title");
    if (!title || !title.trim()) return;
    addNode({
      type: "event",
      title: title.trim(),
      due: new Date(`${dayIso}T09:00:00`).toISOString(),
    });
  };
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Unified: dated nodes (tasks/events) + journal entries (daily notes).
  const byDay = new Map<string, typeof nodes>();
  const push = (k: string, n: (typeof nodes)[number]) =>
    byDay.set(k, [...(byDay.get(k) ?? []), n]);
  nodes.forEach((n) => {
    if (n.due) push(n.due.slice(0, 10), n);
    else if (n.tags.includes("daily") && /^\d{4}-\d{2}-\d{2}$/.test(n.title)) push(n.title, n);
  });

  // Habit completion ratio per day (for the day's intensity dot).
  const habits = nodes.filter((n) => n.type === "habit");
  const habitRatio = (k: string) =>
    habits.length
      ? habits.filter((h) => (h.habitLog ?? []).includes(k)).length / habits.length
      : 0;

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  const open = (id: string, boardId: string) => {
    selectBoard(boardId);
    select(id);
    router.push("/app");
  };

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <CalendarDays size={16} className="text-ink-muted" />
        <h1 className="text-[15px] font-semibold text-ink">Calendar</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="rounded-lg p-1 text-ink-muted hover:bg-canvas-hover"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[140px] text-center text-[13px] font-medium text-ink">
            {month.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="rounded-lg p-1 text-ink-muted hover:bg-canvas-hover"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-canvas-border text-[11px] uppercase tracking-wide text-ink-faint">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-1.5">{d}</div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 overflow-auto">
        {cells.map((d, i) => {
          const key = d ? iso(d) : `pad-${i}`;
          const items = d ? byDay.get(iso(d)) ?? [] : [];
          const isToday = d && iso(d) === iso(new Date());
          return (
            <div
              key={key}
              className={cn(
                "group min-h-[88px] border-b border-r border-canvas-border/60 p-1.5",
                !d && "bg-canvas-surface/30"
              )}
            >
              {d && (
                <>
                  <div className="mb-1 flex items-center">
                    <span
                      className={cn(
                        "text-[11px]",
                        isToday ? "font-semibold text-ink" : "text-ink-faint"
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {habitRatio(iso(d)) > 0 && (
                      <span
                        className="ml-1.5 h-2 w-2 rounded-full"
                        title="Habit completion"
                        style={{
                          background: `rgb(${40 + habitRatio(iso(d)) * 200},${
                            40 + habitRatio(iso(d)) * 200
                          },${40 + habitRatio(iso(d)) * 200})`,
                        }}
                      />
                    )}
                    <button
                      onClick={() => addEvent(iso(d))}
                      className="ml-auto opacity-0 transition group-hover:opacity-100 text-ink-faint hover:text-ink"
                      title="Add event"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 4).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => open(n.id, n.boardId)}
                        className="flex w-full items-center gap-1 truncate rounded bg-canvas-elevated px-1 py-0.5 text-left text-[10px] text-ink-muted hover:text-ink"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-sm"
                          style={{ background: NODE_TYPE_META[n.type].color }}
                        />
                        <span className="truncate">{n.title}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
