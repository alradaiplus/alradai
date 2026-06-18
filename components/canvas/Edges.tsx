"use client";

import { createShapeId, track, useEditor } from "tldraw";
import { useStore } from "@/lib/store";
import type { SemanticEdge } from "@/lib/types";

const EDGE_STYLE: Record<
  SemanticEdge["kind"],
  { stroke: string; dash?: string; opacity: number }
> = {
  arrow: { stroke: "#7c6cf6", opacity: 0.85 },
  reference: { stroke: "#9b9ba6", opacity: 0.55 },
  wikilink: { stroke: "#6a6a76", dash: "2 6", opacity: 0.7 },
  ai_suggested: { stroke: "#ff6ca6", dash: "1 7", opacity: 0.8 },
};

/**
 * Renders knowledge-graph connectors between node shapes, in page space, so
 * they pan/zoom with the canvas and follow nodes live during a drag.
 * Mounted via tldraw's `components.OnTheCanvas`.
 */
export const Edges = track(function Edges() {
  const editor = useEditor();
  const edges = useStore((s) => s.edges);

  const paths = edges
    .filter((e) => e.status !== "dismissed")
    .map((e) => {
      const a = editor.getShapePageBounds(createShapeId(e.source));
      const b = editor.getShapePageBounds(createShapeId(e.target));
      if (!a || !b) return null;
      const ax = a.x + a.w / 2;
      const ay = a.y + a.h / 2;
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;
      // control point offset for a gentle curve
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const dx = bx - ax;
      const dy = by - ay;
      const cx = mx - dy * 0.12;
      const cy = my + dx * 0.12;
      const style = EDGE_STYLE[e.kind];
      return { id: e.id, d: `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`, style };
    })
    .filter(Boolean) as { id: string; d: string; style: (typeof EDGE_STYLE)[SemanticEdge["kind"]] }[];

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      width={1}
      height={1}
    >
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke={p.style.stroke}
          strokeWidth={1.5}
          strokeDasharray={p.style.dash}
          strokeOpacity={p.style.opacity}
        />
      ))}
    </svg>
  );
});
