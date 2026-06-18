"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { useStore } from "@/lib/store";
import {
  Home,
  Search,
  FolderKanban,
  Clock,
  Share2,
  Settings,
  Plus,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/graph", label: "Knowledge Graph", icon: Share2 },
];

export function LeftRail() {
  const pathname = usePathname();
  const open = useStore((s) => s.leftRailOpen);
  const toggle = useStore((s) => s.toggleLeftRail);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const boards = ["Motor Design", "Research", "Reading List"];

  if (!open) {
    return (
      <div className="hidden w-14 flex-col items-center gap-3 border-r border-canvas-border bg-canvas-surface py-3 md:flex">
        <button
          onClick={() => toggle(true)}
          className="text-accent"
          title="Expand sidebar"
        >
          <Wordmark className="hidden" />
          <span className="block">
            <Home size={20} />
          </span>
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
        <button className="text-ink-faint hover:text-ink" title="New board">
          <Plus size={14} />
        </button>
      </div>
      <div className="px-2">
        {boards.map((b, i) => (
          <button
            key={b}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[13px] transition hover:bg-canvas-hover",
              i === 0 ? "text-ink" : "text-ink-muted"
            )}
          >
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: ["#7c6cf6", "#37b6ff", "#34d399"][i] }}
            />
            {b}
          </button>
        ))}
      </div>

      <div className="mt-auto border-t border-canvas-border p-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink">
          <Clock size={16} /> Recents
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-ink-muted transition hover:bg-canvas-hover hover:text-ink">
          <Settings size={16} /> Settings
        </button>
      </div>
    </aside>
  );
}
