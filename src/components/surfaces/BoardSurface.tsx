'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { db } from '@/src/core/db';
import { firstLine } from '@/src/core/text';
import { useBoard } from '@/src/store/boardStore';
import { useUI } from '@/src/store/uiStore';
import type { BoardEdge, BoardNode } from '@/src/core/boards/types';
import type { Block } from '@/src/core/types';

const NODE_W = 168;
const NODE_H = 64;
const PAD = 10;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.0;

/**
 * The Board surface — a lens, not a database.
 *
 * Rendering
 *   - Single CSS transform on a "world" group for pan + zoom (no
 *     per-node layout per frame).
 *   - Edges are SVG paths in the same transform.
 *   - Cluster labels render at agent-supplied positions.
 *
 * Slice 1 is read-only: click a node to open its block; pan/zoom only.
 * Drag-node, edit-edge, relayout come in the next slice.
 */
export function BoardSurface() {
  const activeId = useUI((s) => s.activeBoardId);
  const setSurface = useUI((s) => s.setSurface);
  const openEditor = useUI((s) => s.openEditor);
  const status = useBoard((s) => s.status);
  const board = useBoard((s) => s.board);
  const nodes = useBoard((s) => s.nodes);
  const edges = useBoard((s) => s.edges);
  const errorMessage = useBoard((s) => s.errorMessage);
  const load = useBoard((s) => s.load);

  useEffect(() => {
    if (activeId && (!board || board.id !== activeId)) {
      void load(activeId);
    }
  }, [activeId, board, load]);

  // In-flight UI: check status BEFORE activeId so generation can
  // render its progress before a board id exists.
  if (status === 'generating') {
    return (
      <main className="nc-board-empty">
        <BoardGenerating />
      </main>
    );
  }
  if (status === 'loading') {
    return (
      <main className="nc-board-empty">
        <div className="nc-empty">Loading board…</div>
      </main>
    );
  }
  if (!activeId) {
    return (
      <main className="nc-board-empty">
        <div className="nc-empty">No board open. Use ⌘K → &quot;board: topic&quot;.</div>
      </main>
    );
  }
  if (status === 'error') {
    return (
      <main className="nc-board-empty">
        <div className="nc-empty">{errorMessage ?? 'Could not load board.'}</div>
      </main>
    );
  }
  if (!board) return null;

  return (
    <main className="nc-board">
      <header className="nc-board__head">
        <div>
          <div className="nc-board__crumb">
            <button
              type="button"
              className="nc-btn nc-btn--ghost"
              onClick={() => setSurface('canvas')}
            >
              ← Canvas
            </button>
            <span style={{ color: 'var(--text-mute)', margin: '0 8px' }}>/</span>
            <span style={{ color: 'var(--text-mute)' }}>Board</span>
          </div>
          <h1 className="nc-board__title">{board.title}</h1>
          <div className="nc-board__sub">
            {nodes.length} block{nodes.length === 1 ? '' : 's'} ·{' '}
            {edges.length} edge{edges.length === 1 ? '' : 's'} ·{' '}
            {board.clusters.length} cluster{board.clusters.length === 1 ? '' : 's'}
          </div>
        </div>
      </header>
      <BoardCanvas
        clusters={board.clusters}
        nodes={nodes}
        edges={edges}
        onOpenBlock={openEditor}
      />
    </main>
  );
}

// ── canvas ──────────────────────────────────────────────────

function BoardCanvas({
  clusters,
  nodes,
  edges,
  onOpenBlock,
}: {
  clusters: { id: string; label: string; x: number; y: number }[];
  nodes: BoardNode[];
  edges: BoardEdge[];
  onOpenBlock: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.9);
  const [bodies, setBodies] = useState<Record<string, string>>({});

  // Fetch block bodies for the visible nodes — display only the first line.
  useEffect(() => {
    let alive = true;
    (async () => {
      const ids = nodes.map((n) => n.blockId);
      const blocks = await Promise.all(ids.map((id) => db.blocks.get(id)));
      const map: Record<string, string> = {};
      for (const b of blocks) if (b) map[b.id] = b.body;
      if (alive) setBodies(map);
    })();
    return () => {
      alive = false;
    };
  }, [nodes]);

  // Re-center on first paint so the agent's coordinate system maps
  // visually to the visible viewport.
  useEffect(() => {
    if (!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    setPan({ x: r.width / 2, y: r.height / 2 });
  }, []);

  // Pan via Pointer Events; space-bar drag works too.
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('.nc-board-node')) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setPan({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  }
  function onPointerUp() {
    dragRef.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const next = clamp(zoom * (e.deltaY > 0 ? 0.93 : 1.07), MIN_ZOOM, MAX_ZOOM);
    setZoom(next);
  }

  // Pre-compute edge paths once per render of (nodes, edges).
  const edgePaths = useMemo(() => {
    const byBlock = new Map<string, BoardNode>(nodes.map((n) => [n.blockId, n]));
    return edges
      .map((e) => {
        const a = byBlock.get(e.fromBlockId);
        const b = byBlock.get(e.toBlockId);
        if (!a || !b) return null;
        const ax = a.x + NODE_W / 2;
        const ay = a.y + NODE_H / 2;
        const bx = b.x + NODE_W / 2;
        const by = b.y + NODE_H / 2;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        return {
          id: e.id,
          label: e.label,
          d: `M ${ax} ${ay} Q ${mx} ${my - 30} ${bx} ${by}`,
          lx: mx,
          ly: my - 18,
        };
      })
      .filter((x): x is { id: string; label: BoardEdge['label']; d: string; lx: number; ly: number } => !!x);
  }, [nodes, edges]);

  return (
    <div
      ref={containerRef}
      className="nc-board__canvas"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      <div
        className="nc-board__world"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* cluster labels */}
        {clusters.map((c) => (
          <div
            key={c.id}
            className="nc-board__cluster-label"
            style={{ transform: `translate(${c.x - 60}px, ${c.y - 100}px)` }}
          >
            {c.label}
          </div>
        ))}

        {/* edges */}
        <svg className="nc-board__edges" overflow="visible">
          {edgePaths.map((p) => (
            <g key={p.id}>
              <path
                d={p.d}
                fill="none"
                stroke={edgeStroke(p.label)}
                strokeWidth={1.4}
                strokeDasharray={p.label === 'contradicts' ? '4 4' : undefined}
              />
              <text
                x={p.lx}
                y={p.ly}
                fontSize={10}
                fill="var(--text-mute)"
                textAnchor="middle"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>

        {/* nodes */}
        {nodes.map((n) => (
          <button
            type="button"
            key={n.id}
            className="nc-board-node"
            style={{
              transform: `translate(${n.x}px, ${n.y}px)`,
              width: NODE_W,
              height: NODE_H,
              padding: PAD,
            }}
            onClick={() => onOpenBlock(n.blockId)}
          >
            <span className="nc-board-node__body">
              {firstLine(bodies[n.blockId] ?? '', 80)}
            </span>
          </button>
        ))}
      </div>
      <div className="nc-board__hud">
        <span>{Math.round(zoom * 100)}%</span>
        <span style={{ color: 'var(--text-mute)' }}>· ⌘scroll to zoom · drag to pan</span>
      </div>
    </div>
  );
}

function edgeStroke(label: BoardEdge['label']): string {
  if (label === 'contradicts') return 'var(--warn)';
  return 'var(--text-dim)';
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

// In-flight board generation surface.
// Six animated phantom nodes + a single line of copy. No spinner —
// the staggered fade does the work.
function BoardGenerating() {
  const phantoms = [
    { x: -180, y: -80 },
    { x: 0, y: -120 },
    { x: 180, y: -60 },
    { x: -140, y: 60 },
    { x: 40, y: 80 },
    { x: 200, y: 90 },
  ];
  return (
    <div className="nc-board__generating">
      <div className="nc-board__generating-stage">
        {phantoms.map((p, i) => (
          <div
            key={i}
            className="nc-board__phantom"
            style={{
              transform: `translate(${p.x}px, ${p.y}px)`,
              animationDelay: `${i * 110}ms`,
            }}
          />
        ))}
      </div>
      <div className="nc-board__generating-caption">
        Reading your blocks and recent memory…
      </div>
    </div>
  );
}
