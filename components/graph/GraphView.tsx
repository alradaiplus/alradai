"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META } from "@/lib/types";

// react-force-graph touches window — load client-only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GNode {
  id: string;
  name: string;
  color: string;
  degree: number;
}

/**
 * The dedicated Knowledge Graph screen — a force-directed view derived from the
 * same nodes/edges as the canvas. Clicking a node deep-links back to the board.
 */
export function GraphView() {
  const allNodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const currentBoardId = useStore((s) => s.currentBoardId);
  const select = useStore((s) => s.select);
  const router = useRouter();
  const nodes = allNodes.filter((n) => n.boardId === currentBoardId);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    const boardEdges = edges.filter(
      (e) => e.status !== "dismissed" && ids.has(e.source) && ids.has(e.target)
    );
    const degree: Record<string, number> = {};
    boardEdges.forEach((e) => {
      degree[e.source] = (degree[e.source] || 0) + 1;
      degree[e.target] = (degree[e.target] || 0) + 1;
    });
    return {
      nodes: nodes.map<GNode>((n) => ({
        id: n.id,
        name: n.title,
        color: NODE_TYPE_META[n.type].color,
        degree: degree[n.id] || 1,
      })),
      links: boardEdges.map((e) => ({
        source: e.source,
        target: e.target,
        kind: e.kind,
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  return (
    <div ref={wrapRef} className="h-full w-full bg-canvas-bg">
      <ForceGraph2D
        width={size.w}
        height={size.h}
        graphData={data}
        backgroundColor="#050505"
        cooldownTicks={120}
        linkColor={(l: any) =>
          l.kind === "ai_suggested"
            ? "rgba(185,167,255,0.55)"
            : "rgba(255,255,255,0.18)"
        }
        linkWidth={(l: any) => (l.kind === "arrow" ? 1.6 : 1)}
        linkDirectionalParticles={0}
        nodeRelSize={5}
        nodeVal={(n: any) => 1 + n.degree}
        nodeLabel={(n: any) => n.name}
        nodeCanvasObject={(node: any, ctx, scale) => {
          const r = (1 + Math.sqrt(node.degree)) * 3;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = node.color;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
          ctx.lineWidth = 1 / scale;
          ctx.stroke();
          const label = node.name as string;
          const fontSize = Math.max(11 / scale, 3);
          ctx.font = `${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = "rgba(237,237,242,0.85)";
          ctx.textAlign = "center";
          ctx.fillText(label, node.x, node.y + r + fontSize + 1);
        }}
        onNodeClick={(node: any) => {
          select(node.id);
          router.push("/app");
        }}
      />
    </div>
  );
}
