"use client";

import { LeftRail } from "./LeftRail";
import { RightPanel } from "./RightPanel";
import { MobilePanels } from "./MobilePanels";
import { CommandPalette } from "./CommandPalette";

/**
 * The three-pane application shell: left rail · main surface · right panel,
 * with a collapsed mobile experience and the global command palette.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-canvas-bg text-ink">
      <LeftRail />
      <main className="relative min-w-0 flex-1">{children}</main>
      <RightPanel />
      <MobilePanels />
      <CommandPalette />
    </div>
  );
}
