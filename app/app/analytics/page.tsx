"use client";

import { useStore } from "@/lib/store";
import { NODE_TYPE_META, type NodeType } from "@/lib/types";
import { Activity, TrendingUp, Network, CheckCircle2, Flame } from "lucide-react";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Analytics — workspace health score and growth metrics, computed live from the
 * node/edge store. Health blends task completion, habit consistency, graph
 * connectedness, and recent activity.
 */
export default function AnalyticsPage() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);

  const counts = nodes.reduce<Record<string, number>>((m, n) => {
    m[n.type] = (m[n.type] ?? 0) + 1;
    return m;
  }, {});

  const tasks = nodes.filter((n) => n.type === "task");
  const tasksDone = tasks.filter((t) => t.status === "done").length;
  const taskPct = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0;

  const habits = nodes.filter((n) => n.type === "habit");
  const last7 = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - k);
    return iso(d);
  });
  const habitSlots = habits.length * 7;
  const habitHits = habits.reduce((acc, h) => {
    const log = new Set(h.habitLog ?? []);
    return acc + last7.filter((d) => log.has(d)).length;
  }, 0);
  const habitPct = habitSlots ? Math.round((habitHits / habitSlots) * 100) : 0;

  const activeEdges = edges.filter((e) => e.status !== "dismissed").length;
  const connectedness = nodes.length
    ? Math.min(100, Math.round((activeEdges / nodes.length) * 100))
    : 0;

  const recent = nodes.filter((n) => {
    const days = (Date.now() - new Date(n.updatedAt).getTime()) / 864e5;
    return days <= 7;
  }).length;
  const activity = nodes.length ? Math.round((recent / nodes.length) * 100) : 0;

  const health = Math.round(
    taskPct * 0.3 + habitPct * 0.25 + connectedness * 0.25 + activity * 0.2
  );

  const topTypes = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...topTypes.map(([, c]) => c));

  return (
    <div className="h-full overflow-y-auto bg-canvas-bg">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-1 flex items-center gap-2 text-[20px] font-semibold text-ink">
          <Activity size={18} /> Analytics
        </h1>
        <p className="mb-6 text-[13px] text-ink-faint">Live workspace metrics.</p>

        <div className="mb-6 rounded-2xl border border-canvas-border bg-canvas-panel p-5">
          <div className="text-[12px] uppercase tracking-wide text-ink-faint">
            Workspace Health Score
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-[44px] font-bold leading-none text-ink">{health}</span>
            <span className="mb-1 text-[14px] text-ink-faint">/ 100</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-canvas-elevated">
            <div className="h-full rounded-full bg-accent" style={{ width: `${health}%` }} />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric icon={<CheckCircle2 size={15} />} label="Tasks done" value={`${taskPct}%`} />
          <Metric icon={<Flame size={15} />} label="Habits (7d)" value={`${habitPct}%`} />
          <Metric icon={<Network size={15} />} label="Connectedness" value={`${connectedness}%`} />
          <Metric icon={<TrendingUp size={15} />} label="Active (7d)" value={`${activity}%`} />
        </div>

        <div className="rounded-2xl border border-canvas-border bg-canvas-panel p-5">
          <div className="mb-3 text-[12px] uppercase tracking-wide text-ink-faint">
            Nodes by type ({nodes.length} total · {activeEdges} connections)
          </div>
          <div className="space-y-2">
            {topTypes.map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="w-20 text-[12px] text-ink-muted">
                  {NODE_TYPE_META[type as NodeType]?.label ?? type}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas-elevated">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: NODE_TYPE_META[type as NodeType]?.color ?? "#888",
                    }}
                  />
                </div>
                <span className="w-6 text-right text-[11px] text-ink-faint">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-panel p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-ink-faint">
        {icon} {label}
      </div>
      <div className="text-[20px] font-semibold text-ink">{value}</div>
    </div>
  );
}
