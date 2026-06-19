"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/Logo";
import { useStore } from "@/lib/store";
import {
  Home,
  CheckSquare,
  Sparkles,
  Plus,
  ChevronLeft,
  Share2,
  Hash,
  CalendarDays,
  Table2,
  Settings,
  Flame,
  CalendarRange,
  Library,
  Telescope,
  Activity,
  FileText,
  Layers,
  Timer,
  HelpCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { href: "/app/home", label: "Home", icon: Home },
      { href: "/app", label: "Canvas", icon: Layers },
      { href: "/app/ai", label: "AI Assistant", icon: Sparkles },
    ],
  },
  {
    label: "KNOWLEDGE",
    items: [
      { href: "/app/notes", label: "Notes", icon: FileText },
      { href: "/app/graph", label: "Knowledge Graph", icon: Share2 },
      { href: "/app/tags", label: "Tags", icon: Hash },
      { href: "/app/journal", label: "Journal", icon: CalendarDays },
    ],
  },
  {
    label: "EXECUTION",
    items: [
      { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/app/habits", label: "Habits", icon: Flame },
      { href: "/app/calendar", label: "Calendar", icon: CalendarRange },
    ],
  },
  {
    label: "RESOURCES",
    items: [
      { href: "/app/database", label: "Databases", icon: Table2 },
      { href: "/app/media", label: "Files", icon: Library },
      { href: "/app/research", label: "Research", icon: Telescope },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { href: "/app/analytics", label: "Analytics", icon: Activity },
      { href: "/app/help", label: "How to use", icon: HelpCircle },
      { href: "/app/settings", label: "Settings", icon: Settings },
    ],
  },
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
  const removeBoard = useStore((s) => s.removeBoard);
  const nodes = useStore((s) => s.nodes);
  const userName = useStore((s) => s.userName);

  // Daily Focus: find the top-priority task due today
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = nodes.filter(
    (n) => n.type === "task" && n.status !== "done" && n.due?.slice(0, 10) === today
  );
  const focusTask = todayTasks.find((t) => t.priority === "high") ?? todayTasks[0];

  if (!open) {
    return (
      <div className="hidden w-14 shrink-0 flex-col items-center gap-3 border-r border-canvas-border bg-canvas-surface py-3 md:flex">
        <button onClick={() => toggle(true)} className="text-accent" title="Expand sidebar">
          <Home size={20} />
        </button>
      </div>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-canvas-border bg-canvas-surface md:flex">
      {/* Logo */}
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

      {/* Navigation */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {section.label && (
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-ink-faint/60">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/app/home" && item.href !== "/app" && pathname.startsWith(item.href.split("?")[0]));
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition",
                    active
                      ? "bg-canvas-hover text-ink"
                      : "text-ink-muted hover:bg-canvas-hover/60 hover:text-ink"
                  )}
                >
                  <Icon size={15} className={active ? "text-accent" : "text-ink-faint"} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Spaces */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint/60">
              SPACES
            </span>
            <button
              onClick={() => {
                const b = addBoard();
                selectBoard(b.id);
                router.push("/app");
              }}
              className="text-ink-faint hover:text-ink"
              title="New space"
            >
              <Plus size={13} />
            </button>
          </div>
          {boards.map((b) => (
            <div
              key={b.id}
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition",
                b.id === currentBoardId
                  ? "bg-canvas-hover text-ink"
                  : "text-ink-muted hover:bg-canvas-hover/60 hover:text-ink"
              )}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: b.color ?? "#888" }}
              />
              <button
                onClick={() => {
                  selectBoard(b.id);
                  router.push("/app");
                }}
                className="flex-1 truncate text-left"
              >
                {b.title}
              </button>
              {boards.length > 1 && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Delete space "${b.title}" and everything in it? This can't be undone.`
                      )
                    )
                      removeBoard(b.id);
                  }}
                  className="opacity-0 transition group-hover:opacity-100 text-ink-faint hover:text-danger"
                  title="Delete space"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => {
              const b = addBoard();
              selectBoard(b.id);
              router.push("/app");
            }}
            className="mt-1 flex w-full items-center gap-2 px-2.5 py-1 text-[12px] text-ink-faint hover:text-ink"
          >
            <Plus size={12} /> New Space
          </button>
        </div>
      </nav>

      {/* Daily Focus widget */}
      <div className="border-t border-canvas-border px-3 py-3">
        <div className="rounded-xl bg-canvas-elevated p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            <Timer size={11} /> Daily Focus
          </div>
          {focusTask ? (
            <>
              <div className="truncate text-[12px] font-medium text-ink">{focusTask.title}</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-canvas-border">
                  <div className="h-full w-[72%] rounded-full bg-accent" />
                </div>
                <span className="text-[10px] text-ink-faint">72%</span>
              </div>
            </>
          ) : (
            <div className="text-[12px] text-ink-faint">No focus task today</div>
          )}
        </div>
      </div>
    </aside>
  );
}
