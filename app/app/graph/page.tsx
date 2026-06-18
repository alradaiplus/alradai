"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const GraphView = dynamic(
  () => import("@/components/graph/GraphView").then((m) => m.GraphView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-canvas-bg text-ink-faint">
        Building graph…
      </div>
    ),
  }
);

export default function GraphPage() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-4 py-2.5 backdrop-blur">
        <Link
          href="/app"
          className="flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={15} /> Canvas
        </Link>
        <h1 className="text-[14px] font-semibold text-ink">Knowledge Graph</h1>
        <span className="ml-auto text-[12px] text-ink-faint">
          Click a node to open it on the canvas
        </span>
      </div>
      <GraphView />
    </div>
  );
}
