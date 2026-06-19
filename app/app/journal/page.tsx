"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { CalendarDays, Plus } from "lucide-react";

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Daily notes / journal. "Today" opens (or creates) a date-titled note tagged
 * #daily on the current board; existing daily notes are listed newest-first.
 */
export default function JournalPage() {
  const nodes = useStore((s) => s.nodes);
  const addNode = useStore((s) => s.addNode);
  const select = useStore((s) => s.select);
  const router = useRouter();

  const daily = nodes
    .filter((n) => n.tags.includes("daily"))
    .sort((a, b) => b.title.localeCompare(a.title));

  const openDay = (date: string) => {
    const existing = nodes.find(
      (n) => n.tags.includes("daily") && n.title === date
    );
    const id =
      existing?.id ??
      addNode({
        type: "note",
        title: date,
        content: `# ${date}\n\n`,
        tags: ["daily"],
      }).id;
    select(id);
    router.push("/app");
  };

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <CalendarDays size={16} className="text-ink-muted" />
        <h1 className="text-[15px] font-semibold text-ink">Journal</h1>
        <span className="text-[12px] text-ink-faint">{daily.length} daily notes</span>
        <button
          onClick={() => openDay(iso(new Date()))}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground transition hover:bg-accent-hover"
        >
          <Plus size={14} /> Today
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {daily.length === 0 ? (
          <p className="text-[13px] text-ink-faint">
            No daily notes yet. Hit <span className="text-ink">Today</span> to start journaling.
          </p>
        ) : (
          <div className="mx-auto max-w-2xl space-y-2">
            {daily.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  select(n.id);
                  router.push("/app");
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-canvas-border bg-canvas-panel p-3 text-left transition hover:border-canvas-strong"
              >
                <CalendarDays size={15} className="text-ink-faint" />
                <span className="text-[13px] font-medium text-ink">{n.title}</span>
                <span className="ml-auto line-clamp-1 max-w-[60%] text-[12px] text-ink-faint">
                  {n.content.replace(/[#*`>\[\]]/g, "").trim().slice(0, 80)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
