"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Inspector } from "./Inspector";
import { AIChat } from "@/components/ai/AIChat";
import { LogoMark } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { Search, Sparkles, Info, X, Share2 } from "lucide-react";
import Link from "next/link";

/**
 * Mobile chrome: a top bar plus a draggable bottom sheet that collapses the
 * desktop right panel (Details / AI) into a single touch surface.
 */
export function MobilePanels() {
  const [sheet, setSheet] = useState<null | "details" | "ai">(null);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const selectedId = useStore((s) => s.selectedId);

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-[250] flex items-center justify-between border-b border-canvas-border bg-canvas-surface/90 px-3 py-2 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 text-accent">
          <LogoMark size={26} />
          <span className="text-[14px] font-semibold text-ink">Notes Canvas</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas-hover"
          >
            <Search size={18} />
          </button>
          <Link
            href="/app/graph"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas-hover"
          >
            <Share2 size={18} />
          </Link>
        </div>
      </div>

      {/* Floating action buttons */}
      <div className="absolute bottom-20 right-4 z-[250] flex flex-col gap-2">
        <button
          onClick={() => setSheet("ai")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-panel"
        >
          <Sparkles size={20} />
        </button>
        {selectedId && (
          <button
            onClick={() => setSheet("details")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas-elevated text-ink shadow-panel"
          >
            <Info size={20} />
          </button>
        )}
      </div>

      {/* Bottom sheet */}
      {sheet && (
        <>
          <div
            className="fixed inset-0 z-[400] bg-black/50"
            onClick={() => setSheet(null)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[401] flex h-[78vh] animate-slide-up flex-col rounded-t-2xl border-t border-canvas-border bg-canvas-surface">
            <div className="flex items-center gap-1 border-b border-canvas-border px-3 py-2">
              <button
                onClick={() => setSheet("details")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium",
                  sheet === "details"
                    ? "bg-accent-soft text-accent-hover"
                    : "text-ink-muted"
                )}
              >
                <Info size={14} /> Details
              </button>
              <button
                onClick={() => setSheet("ai")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium",
                  sheet === "ai" ? "bg-accent-soft text-accent-hover" : "text-ink-muted"
                )}
              >
                <Sparkles size={14} /> AI
              </button>
              <button
                onClick={() => setSheet(null)}
                className="ml-auto text-ink-faint hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {sheet === "details" ? <Inspector /> : <AIChat />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
