"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import type { NodeType } from "@/lib/types";
import {
  FileText,
  CircleCheck,
  FolderKanban,
  Flame,
  CalendarDays,
  Mic,
  Bookmark,
  Sparkles,
} from "lucide-react";

const iso = (d: Date) => d.toISOString().slice(0, 10);

type Kind =
  | { key: "journal"; label: "Journal"; icon: React.ReactNode }
  | { key: "ai"; label: "AI Chat"; icon: React.ReactNode }
  | { key: NodeType; label: string; icon: React.ReactNode };

const KINDS: Kind[] = [
  { key: "note", label: "Note", icon: <FileText size={16} /> },
  { key: "task", label: "Task", icon: <CircleCheck size={16} /> },
  { key: "project", label: "Project", icon: <FolderKanban size={16} /> },
  { key: "habit", label: "Habit", icon: <Flame size={16} /> },
  { key: "journal", label: "Journal", icon: <CalendarDays size={16} /> },
  { key: "voice", label: "Voice Note", icon: <Mic size={16} /> },
  { key: "bookmark", label: "Bookmark", icon: <Bookmark size={16} /> },
  { key: "ai", label: "AI Chat", icon: <Sparkles size={16} /> },
];

/**
 * Universal Quick Capture — one shortcut ("c") to drop any kind of object into
 * the workspace without leaving what you're doing.
 */
export function QuickCapture() {
  const open = useStore((s) => s.quickCaptureOpen);
  const setOpen = useStore((s) => s.setQuickCapture);
  const addNode = useStore((s) => s.addNode);
  const select = useStore((s) => s.select);
  const setTab = useStore((s) => s.setTab);
  const nodes = useStore((s) => s.nodes);
  const router = useRouter();
  const [text, setText] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);

  if (!open) return null;

  const close = () => {
    setText("");
    setOpen(false);
  };

  const capture = (kind: Kind["key"]) => {
    const title = text.trim();
    if (kind === "ai") {
      setTab("ai");
      router.push("/app");
      close();
      return;
    }
    if (kind === "journal") {
      const day = iso(new Date());
      const existing = nodes.find((n) => n.tags.includes("daily") && n.title === day);
      const id =
        existing?.id ??
        addNode({
          type: "note",
          title: day,
          content: `# ${day}\n\n## Wins\n\n## Lessons\n\n## Tomorrow\n`,
          tags: ["daily"],
        }).id;
      select(id);
      router.push("/app/journal");
      close();
      return;
    }
    const n = addNode({
      type: kind,
      title: title || `New ${kind}`,
      content: kind === "note" && title ? "" : "",
      tags: [],
      ...(kind === "habit" ? { habitLog: [], cadence: "daily", category: "Personal" } : {}),
      ...(kind === "bookmark" ? { src: "https://" } : {}),
    });
    select(n.id);
    router.push("/app");
    close();
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-start justify-center bg-black/60 p-4 pt-[16vh]"
      onClick={close}
    >
      <div
        className="w-full max-w-lg animate-fade-in overflow-hidden rounded-2xl border border-canvas-border bg-canvas-panel shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") capture("note");
          }}
          placeholder="Capture anything… (Enter = note)"
          className="w-full border-b border-canvas-border bg-transparent px-4 py-3.5 text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
        <div className="grid grid-cols-4 gap-1 p-2">
          {KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => capture(k.key)}
              className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-[12px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink"
            >
              <span className="text-ink-faint">{k.icon}</span>
              {k.label}
            </button>
          ))}
        </div>
        <div className="border-t border-canvas-border px-3 py-2 text-[11px] text-ink-faint">
          Press <span className="font-mono text-ink-muted">c</span> anywhere to capture · Esc to close
        </div>
      </div>
    </div>
  );
}
