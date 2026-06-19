"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { FileText, Plus, Search, Trash2, Maximize2, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Notes — a focused, Notion-style two-pane writer: a searchable list of note
 * nodes on the left, a full block editor on the right. Notes are the same nodes
 * that live on the canvas, so edits sync everywhere.
 */
export default function NotesPage() {
  const nodes = useStore((s) => s.nodes);
  const update = useStore((s) => s.updateNode);
  const remove = useStore((s) => s.removeNode);
  const addNode = useStore((s) => s.addNode);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const router = useRouter();

  const notes = nodes
    .filter((n) => n.type === "note")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null);
  const [q, setQ] = useState("");

  const active = notes.find((n) => n.id === activeId) ?? null;
  const filtered = q
    ? notes.filter((n) =>
        `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())
      )
    : notes;

  const newNote = () => {
    const n = addNode({ type: "note", title: "Untitled", content: "" });
    setActiveId(n.id);
  };

  return (
    <div className="flex h-full bg-canvas-bg">
      {/* List */}
      <div className="flex w-72 shrink-0 flex-col border-r border-canvas-border">
        <div className="flex items-center gap-2 border-b border-canvas-border px-3 py-2.5">
          <FileText size={15} className="text-ink-muted" />
          <span className="text-[14px] font-semibold text-ink">Notes</span>
          <button
            onClick={newNote}
            className="ml-auto rounded-lg p-1 text-ink-muted hover:bg-canvas-hover hover:text-ink"
            title="New note"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 border-b border-canvas-border px-3 py-2">
          <Search size={13} className="text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes…"
            className="w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-2 py-6 text-center text-[12px] text-ink-faint">
              No notes. Click + to create one.
            </p>
          )}
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => setActiveId(n.id)}
              className={cn(
                "mb-0.5 block w-full rounded-lg px-2.5 py-2 text-left transition",
                activeId === n.id ? "bg-canvas-hover" : "hover:bg-canvas-hover/60"
              )}
            >
              <div className="truncate text-[13px] font-medium text-ink">{n.title || "Untitled"}</div>
              <div className="truncate text-[11px] text-ink-faint">
                {n.content.replace(/[#*`>\[\]]/g, "").trim().slice(0, 50) || "Empty note"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center text-ink-faint">
            <FileText size={26} className="mb-2 opacity-50" />
            <p className="text-[13px]">Select a note, or create a new one.</p>
            <button
              onClick={newNote}
              className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-accent-foreground hover:bg-accent-hover"
            >
              New note
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl px-6 py-6">
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => {
                  selectBoard(active.boardId);
                  select(active.id);
                  router.push("/app");
                }}
                className="flex items-center gap-1 text-[11px] text-ink-faint hover:text-ink"
                title="Open on canvas"
              >
                <Maximize2 size={12} /> Open on canvas
              </button>
              <button
                onClick={() => {
                  remove(active.id);
                  setActiveId(null);
                }}
                className="ml-auto flex items-center gap-1 text-[11px] text-ink-faint hover:text-danger"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>

            <input
              value={active.title}
              onChange={(e) => update(active.id, { title: e.target.value })}
              placeholder="Untitled"
              className="mb-3 w-full bg-transparent text-[26px] font-bold text-ink outline-none placeholder:text-ink-faint"
            />

            <BlockEditor
              value={active.content}
              onChange={(v) => update(active.id, { content: v })}
              placeholder="Start writing… type / for blocks, [[ to link, ![[ to embed."
            />

            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <Hash size={12} className="text-ink-faint" />
              {active.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-full bg-canvas-elevated px-2 py-0.5 text-[11px] text-ink-muted"
                >
                  {t}
                  <button
                    onClick={() => update(active.id, { tags: active.tags.filter((x) => x !== t) })}
                    className="text-ink-faint hover:text-ink"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                placeholder="+ tag"
                className="w-16 bg-transparent text-[11px] text-ink-muted outline-none placeholder:text-ink-faint"
                onKeyDown={(e) => {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (e.key === "Enter" && v) {
                    update(active.id, { tags: [...active.tags, v.replace(/^#/, "")] });
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
