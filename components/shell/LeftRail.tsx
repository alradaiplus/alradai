"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { useStore } from "@/lib/store";
import {
  Home,
  Search,
  FolderKanban,
  CheckSquare,
  Sparkles,
  Plus,
  ChevronLeft,
  Share2,
  Hash,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Canvas", icon: Home },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/app/journal", label: "Journal", icon: CalendarDays },
  { href: "/app/tags", label: "Tags", icon: Hash },
  { href: "/app/graph", label: "Knowledge Graph", icon: Share2 },
];

export function LeftRail() {
  const pathname = usePathname();
  const router = useRouter();
  const open = useStore((s) => s.leftRailOpen);
  const toggle = useStore((s) => s.toggleLeftRail);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const setTab = useStore((s) => s.setTab);
  const boards = useStore((s) => s.boards);
  const currentBoardId = useStore((s) => s.currentBoardId);
  const selectBoard = useStore((s) => s.selectBoard);
  const addBoard = useStore((s) => s.addBoard);
  const nodes = useStore((s) => s.nodes);

  if (!open) {
    return (
      <div className="hidden w-14 flex-col items-center gap-3 border-r border-canvas-border bg-canvas-surface py-3 md:flex">
        <button onClick={() => toggle(true)} className="text-accent" title="Expand sidebar">
          <Home size={20} />
        </button>
      </div>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-canvas-border bg-canvas-surface md:flex">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/">
          <Wordmark />
        </Link>
        <button
          onClick={() => toggle(false)}
          className="text-ink-faint hover:text-ink"
          title="Collapse"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <button
        onClick={() => setCommandOpen(true)}
        className="mx-3 mb-3 flex items-center gap-2 rounded-lg border border-canvas-border bg-canvas-panel px-3 py-2 text-[13px] text-ink-faint transition hover:border-accent-ring"
      >
        <Search size={15} />
        <span>Search…</span>
        <kbd className="ml-auto rounded bg-canvas-elevated px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
          ⌘K
        </kbd>
      </button>

      <nav className="px-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition",
                active
                  ? "bg-accent-soft text-accent-hover"
                  : "text-ink-muted hover:bg-canvas-hover hover:text-ink"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 flex items-center justify-between px-4 py-1">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          <FolderKanban size={13} /> Boards
        </span>
        <button
          onClick={() => {
            addBoard();
            router.push("/app");
          }}
          className="text-ink-faint hover:text-ink"
          title="New board"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2">
        {boards.map((b) => {
          const count = nodes.filter((n) => n.boardId === b.id).length;
          const active = b.id === currentBoardId;
          return (
            <button
              key={b.id}
              onClick={() => {
                selectBoard(b.id);
                router.push("/app");
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] transition hover:bg-canvas-hover",
                active ? "bg-canvas-hover text-ink" : "text-ink-muted"
              )}
            >
              <span
                className="h-2 w-2 rounded-sm"
                style={{ background: b.color ?? "#cfcfcf" }}
              />
              <span className="flex-1 truncate">{b.title}</span>
              <span className="text-[10px] text-ink-faint">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto border-t border-canvas-border p-2">
        <button
          onClick={() => {
            router.push("/app");
            setTab("ai");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink"
        >
          <Sparkles size={16} /> Workspace AI
        </button>
      </div>
    </aside>
  );
}
