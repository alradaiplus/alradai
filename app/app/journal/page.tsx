"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { streamOpenRouterClient } from "@/lib/ai/openrouter-client";
import { CalendarDays, Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const MOODS = ["😞", "😐", "🙂", "😄", "🔥"];
const TEMPLATE = (day: string) =>
  `# ${day}\n\n## Wins\n- \n\n## Lessons\n- \n\n## Tomorrow\n- \n`;

/**
 * Daily Journal — mood, structured entry (wins / lessons / tomorrow) and an AI
 * reflection. Entries are notes tagged "daily", titled by date.
 */
export default function JournalPage() {
  const nodes = useStore((s) => s.nodes);
  const addNode = useStore((s) => s.addNode);
  const update = useStore((s) => s.updateNode);
  const remove = useStore((s) => s.removeNode);
  const aiKey = useStore((s) => s.aiKey);
  const aiModel = useStore((s) => s.aiModel);

  const entries = nodes
    .filter((n) => n.tags.includes("daily"))
    .sort((a, b) => b.title.localeCompare(a.title));
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const active = entries.find((e) => e.id === activeId) ?? null;

  const openDay = (day: string) => {
    const existing = entries.find((n) => n.title === day);
    const id =
      existing?.id ??
      addNode({ type: "note", title: day, content: TEMPLATE(day), tags: ["daily"] }).id;
    setActiveId(id);
  };

  const reflect = async () => {
    if (!active || !aiKey || busy) return;
    setBusy(true);
    try {
      let acc = "";
      for await (const d of streamOpenRouterClient({
        apiKey: aiKey,
        model: aiModel,
        maxTokens: 280,
        messages: [
          { role: "system", content: "You are a thoughtful journaling companion. Be warm and brief." },
          {
            role: "user",
            content: `Reflect on today's journal entry. Offer one insight and one gentle suggestion.\n\n${active.content}`,
          },
        ],
      })) {
        acc += d;
      }
      update(active.id, {
        content: `${active.content}\n\n## AI reflection\n${acc}\n`,
      });
    } catch (e) {
      alert(`AI error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full bg-canvas-bg">
      {/* Entry list */}
      <div className="flex w-60 shrink-0 flex-col border-r border-canvas-border">
        <div className="flex items-center gap-2 border-b border-canvas-border px-3 py-2.5">
          <CalendarDays size={15} className="text-ink-muted" />
          <span className="text-[14px] font-semibold text-ink">Journal</span>
          <button
            onClick={() => openDay(iso(new Date()))}
            className="ml-auto flex items-center gap-1 rounded-lg bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground hover:bg-accent-hover"
          >
            <Plus size={12} /> Today
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {entries.length === 0 && (
            <p className="px-2 py-6 text-center text-[12px] text-ink-faint">
              No entries. Hit Today to start.
            </p>
          )}
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => setActiveId(e.id)}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition",
                activeId === e.id ? "bg-canvas-hover" : "hover:bg-canvas-hover/60"
              )}
            >
              <span className="text-[15px]">{e.mood ?? "📝"}</span>
              <span className="text-[13px] text-ink">{e.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center text-ink-faint">
            <CalendarDays size={26} className="mb-2 opacity-50" />
            <p className="text-[13px]">Select an entry, or start today&apos;s.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl px-6 py-6">
            <div className="mb-3 flex items-center gap-2">
              <h1 className="text-[24px] font-bold text-ink">{active.title}</h1>
              <button
                onClick={() => {
                  remove(active.id);
                  setActiveId(null);
                }}
                className="ml-auto text-ink-faint hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Mood */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[12px] text-ink-faint">Mood</span>
              {MOODS.map((m) => (
                <button
                  key={m}
                  onClick={() => update(active.id, { mood: m })}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-[16px] transition",
                    active.mood === m ? "bg-canvas-hover ring-1 ring-accent-ring" : "hover:bg-canvas-hover"
                  )}
                >
                  {m}
                </button>
              ))}
              <button
                onClick={reflect}
                disabled={!aiKey || busy}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-canvas-border px-2.5 py-1.5 text-[12px] text-ink-muted hover:text-ink disabled:opacity-40"
              >
                <Sparkles size={12} /> AI reflection
              </button>
            </div>

            <BlockEditor
              value={active.content}
              onChange={(v) => update(active.id, { content: v })}
              placeholder="How was today? Wins, lessons, plan for tomorrow…"
            />
          </div>
        )}
      </div>
    </div>
  );
}
