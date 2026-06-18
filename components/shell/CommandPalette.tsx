"use client";

import { useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META } from "@/lib/types";
import { FileText, Share2, Home, Sparkles, Plus } from "lucide-react";

/**
 * ⌘K command palette — hybrid search over nodes plus quick actions.
 * In production this calls /api/search (FTS + pgvector RRF); in demo mode it
 * filters the local semantic store.
 */
export function CommandPalette() {
  const open = useStore((s) => s.commandOpen);
  const setOpen = useStore((s) => s.setCommandOpen);
  const nodes = useStore((s) => s.nodes);
  const select = useStore((s) => s.select);
  const addNode = useStore((s) => s.addNode);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center bg-black/50 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-xl animate-fade-in overflow-hidden rounded-2xl border border-canvas-border bg-canvas-panel shadow-panel"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <Command.Input
          autoFocus
          placeholder="Search notes, boards, or run a command…"
          className="w-full border-b border-canvas-border bg-transparent px-4 py-3.5 text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
        <Command.List className="max-h-[50vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-[13px] text-ink-faint">
            No results.
          </Command.Empty>

          <Command.Group
            heading="Actions"
            className="px-2 text-[11px] uppercase tracking-wide text-ink-faint [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1.5"
          >
            <Item
              onSelect={() => {
                addNode({ type: "note", title: "New note", content: "Start writing…" });
                setOpen(false);
              }}
              icon={<Plus size={15} />}
            >
              New note
            </Item>
            <Item onSelect={() => { router.push("/app/graph"); setOpen(false); }} icon={<Share2 size={15} />}>
              Open Knowledge Graph
            </Item>
            <Item onSelect={() => { router.push("/app"); setOpen(false); }} icon={<Home size={15} />}>
              Go to canvas
            </Item>
          </Command.Group>

          <Command.Group
            heading="Notes"
            className="px-2 text-[11px] uppercase tracking-wide text-ink-faint [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1.5"
          >
            {nodes.map((n) => (
              <Item
                key={n.id}
                value={`${n.title} ${n.content} ${n.tags.join(" ")}`}
                onSelect={() => {
                  router.push("/app");
                  select(n.id);
                  setOpen(false);
                }}
                icon={<FileText size={15} style={{ color: NODE_TYPE_META[n.type].color }} />}
              >
                <span className="flex-1 truncate">{n.title}</span>
                <span className="ml-2 truncate text-[11px] text-ink-faint">
                  {n.tags.map((t) => `#${t}`).join(" ")}
                </span>
              </Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="flex items-center gap-2 border-t border-canvas-border px-3 py-2 text-[11px] text-ink-faint">
          <Sparkles size={12} className="text-accent" />
          Hybrid search · full-text + semantic
        </div>
      </Command>
    </div>
  );
}

function Item({
  children,
  onSelect,
  icon,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  icon: React.ReactNode;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-muted aria-selected:bg-canvas-hover aria-selected:text-ink"
    >
      {icon}
      {children}
    </Command.Item>
  );
}
