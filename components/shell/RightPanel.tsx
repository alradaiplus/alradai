"use client";

import { useStore } from "@/lib/store";
import { Inspector } from "./Inspector";
import { AIChat } from "@/components/ai/AIChat";
import { cn } from "@/lib/utils";
import { PanelRightClose, Info, Sparkles } from "lucide-react";

/**
 * Right panel — a tabbed surface that is both the node inspector ("Details")
 * and the AI assistant, matching the dual-purpose panel in the screenshots.
 */
export function RightPanel() {
  const tab = useStore((s) => s.rightPanelTab);
  const setTab = useStore((s) => s.setTab);
  const open = useStore((s) => s.rightPanelOpen);
  const toggle = useStore((s) => s.toggleRightPanel);

  if (!open) return null;

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-canvas-border bg-canvas-surface md:flex">
      <div className="flex items-center gap-1 border-b border-canvas-border px-3 py-2">
        <Tab active={tab === "details"} onClick={() => setTab("details")} icon={<Info size={14} />}>
          Details
        </Tab>
        <Tab active={tab === "ai"} onClick={() => setTab("ai")} icon={<Sparkles size={14} />}>
          AI
        </Tab>
        <button
          onClick={() => toggle(false)}
          className="ml-auto text-ink-faint transition hover:text-ink"
          title="Close panel"
        >
          <PanelRightClose size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {tab === "details" ? <Inspector /> : <AIChat />}
      </div>
    </aside>
  );
}

function Tab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
        active
          ? "bg-accent-soft text-accent-hover"
          : "text-ink-muted hover:bg-canvas-hover hover:text-ink"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
