"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  NODE_DEFAULT_SIZE,
  type Board,
  type GraphData,
  type SemanticEdge,
  type SemanticNode,
  type TaskStatus,
} from "./types";
import { DEMO_BOARDS, DEMO_GRAPH, DEMO_CURRENT_BOARD } from "./demo";
import { parseWikilinks, normalizeTitle } from "./projection/wikilinks";
import { nanoid } from "nanoid";

/**
 * Client-side workspace store — the source of truth in demo mode (persisted to
 * localStorage so notes survive reloads). The canvas, knowledge graph, search,
 * tasks, dashboards and AI panels all read from here.
 */

export type RightPanelTab = "details" | "ai";

interface AppState {
  boards: Board[];
  currentBoardId: string;
  nodes: SemanticNode[];
  edges: SemanticEdge[];

  selectedId: string | null;
  rightPanelTab: RightPanelTab;
  rightPanelOpen: boolean;
  leftRailOpen: boolean;
  commandOpen: boolean;
  /** When set, the next node pick creates a connection from this id. */
  connectSourceId: string | null;
  /** User's OpenRouter key — browser-only (never committed), enables real AI. */
  aiKey: string | null;
  /** Preferred OpenRouter model id (used by client AI calls). */
  aiModel: string;
  /** Display name shown in the shell / dashboard. */
  userName: string;

  // ---- UI ----
  select: (id: string | null) => void;
  setTab: (tab: RightPanelTab) => void;
  toggleRightPanel: (open?: boolean) => void;
  toggleLeftRail: (open?: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setAiKey: (key: string | null) => void;
  setAiModel: (model: string) => void;
  setUserName: (name: string) => void;
  exportWorkspace: () => string;

  // ---- Boards ----
  addBoard: (title?: string) => Board;
  selectBoard: (id: string) => void;
  renameBoard: (id: string, title: string) => void;
  removeBoard: (id: string) => void;
  boardNodes: () => SemanticNode[];

  // ---- Nodes ----
  graph: () => GraphData;
  getNode: (id: string) => SemanticNode | undefined;
  updateNode: (id: string, patch: Partial<SemanticNode>) => void;
  addNode: (
    node: Partial<SemanticNode> & { type: SemanticNode["type"] }
  ) => SemanticNode;
  removeNode: (id: string) => void;
  cycleTask: (id: string) => void;
  summarizeNode: (id: string) => void;

  // ---- Edges / connections ----
  addEdge: (source: string, target: string, kind?: SemanticEdge["kind"]) => void;
  acceptSuggestedEdge: (id: string) => void;
  dismissSuggestedEdge: (id: string) => void;
  backlinks: (id: string) => SemanticNode[];
  outgoing: (id: string) => SemanticNode[];
  unlinkedMentions: (id: string) => SemanticNode[];
  startConnect: (id: string) => void;
  cancelConnect: () => void;
  completeConnect: (targetId: string) => void;
  discoverLinks: () => number;

  reset: () => void;
}

const now = () => new Date().toISOString();

/** Materialize [[wikilinks]] in a note's content into edges on the same board. */
function reconcileWikilinks(
  nodeId: string,
  content: string,
  nodes: SemanticNode[],
  edges: SemanticEdge[]
): SemanticEdge[] {
  const self = nodes.find((n) => n.id === nodeId);
  if (!self) return edges;
  const titles = parseWikilinks(content).map((w) => normalizeTitle(w.target));
  const targets = new Set(
    nodes
      .filter(
        (n) =>
          n.id !== nodeId &&
          n.boardId === self.boardId &&
          titles.includes(normalizeTitle(n.title))
      )
      .map((n) => n.id)
  );
  // Drop stale wikilink edges from this source, keep everything else.
  const kept = edges.filter(
    (e) => !(e.kind === "wikilink" && e.source === nodeId)
  );
  const existing = new Set(
    kept.filter((e) => e.source === nodeId).map((e) => e.target)
  );
  const added: SemanticEdge[] = [];
  targets.forEach((t) => {
    if (!existing.has(t)) {
      added.push({
        id: `e_${nanoid(6)}`,
        source: nodeId,
        target: t,
        kind: "wikilink",
        status: "active",
      });
    }
  });
  return [...kept, ...added];
}

const STOPWORDS = new Set(
  "the a an and or of to in for on with is are be this that it as at by from into".split(
    " "
  )
);
function keywords(n: SemanticNode): Set<string> {
  const out = new Set<string>();
  `${n.title} ${n.content}`
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    .forEach((w) => out.add(w));
  n.tags.forEach((t) => out.add(t.toLowerCase()));
  return out;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      boards: DEMO_BOARDS,
      currentBoardId: DEMO_CURRENT_BOARD,
      nodes: DEMO_GRAPH.nodes,
      edges: DEMO_GRAPH.edges,

      selectedId: null,
      rightPanelTab: "details",
      rightPanelOpen: true,
      leftRailOpen: true,
      commandOpen: false,
      connectSourceId: null,
      aiKey: null,
      aiModel: "anthropic/claude-3.5-sonnet",
      userName: "You",

      // ---- UI ----
      select: (id) =>
        set((s) => ({
          selectedId: id,
          rightPanelOpen: id ? true : s.rightPanelOpen,
        })),
      setTab: (tab) => set({ rightPanelTab: tab, rightPanelOpen: true }),
      toggleRightPanel: (open) =>
        set((s) => ({ rightPanelOpen: open ?? !s.rightPanelOpen })),
      toggleLeftRail: (open) =>
        set((s) => ({ leftRailOpen: open ?? !s.leftRailOpen })),
      setCommandOpen: (open) => set({ commandOpen: open }),
      setAiKey: (key) => set({ aiKey: key && key.trim() ? key.trim() : null }),
      setAiModel: (model) => set({ aiModel: model || "anthropic/claude-3.5-sonnet" }),
      setUserName: (name) => set({ userName: name.trim() || "You" }),
      exportWorkspace: () => {
        const s = get();
        return JSON.stringify(
          { boards: s.boards, nodes: s.nodes, edges: s.edges },
          null,
          2
        );
      },

      // ---- Boards ----
      addBoard: (title) => {
        const board: Board = {
          id: `b_${nanoid(6)}`,
          title: title?.trim() || "New board",
          color: "#cfcfcf",
          updatedAt: now(),
        };
        set((s) => ({
          boards: [...s.boards, board],
          currentBoardId: board.id,
          selectedId: null,
        }));
        return board;
      },
      selectBoard: (id) => set({ currentBoardId: id, selectedId: null }),
      renameBoard: (id, title) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === id ? { ...b, title, updatedAt: now() } : b
          ),
        })),
      removeBoard: (id) =>
        set((s) => {
          if (s.boards.length <= 1) return s;
          const boards = s.boards.filter((b) => b.id !== id);
          const nodeIds = new Set(
            s.nodes.filter((n) => n.boardId === id).map((n) => n.id)
          );
          return {
            boards,
            nodes: s.nodes.filter((n) => n.boardId !== id),
            edges: s.edges.filter(
              (e) => !nodeIds.has(e.source) && !nodeIds.has(e.target)
            ),
            currentBoardId:
              s.currentBoardId === id ? boards[0].id : s.currentBoardId,
            selectedId: null,
          };
        }),
      boardNodes: () => {
        const s = get();
        return s.nodes.filter((n) => n.boardId === s.currentBoardId);
      },

      // ---- Nodes ----
      graph: () => ({ nodes: get().nodes, edges: get().edges }),
      getNode: (id) => get().nodes.find((n) => n.id === id),

      updateNode: (id, patch) =>
        set((s) => {
          const nodes = s.nodes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: now() } : n
          );
          // Auto-link: re-materialize wikilinks when note content changes.
          let edges = s.edges;
          if (patch.content !== undefined) {
            edges = reconcileWikilinks(id, patch.content, nodes, edges);
          }
          return { nodes, edges };
        }),

      addNode: (node) => {
        const size = NODE_DEFAULT_SIZE[node.type];
        const isTask = node.type === "task";
        const created: SemanticNode = {
          id: node.id ?? `n_${nanoid(8)}`,
          type: node.type,
          title: node.title ?? "Untitled",
          content: node.content ?? "",
          tags: node.tags ?? [],
          boardId: node.boardId ?? get().currentBoardId,
          projectId: node.projectId,
          x: node.x ?? 0,
          y: node.y ?? 0,
          w: node.w ?? size.w,
          h: node.h ?? size.h,
          src: node.src,
          color: node.color,
          status: isTask ? node.status ?? "todo" : node.status,
          priority: isTask ? node.priority ?? "med" : node.priority,
          due: node.due,
          sources: node.sources,
          updatedAt: now(),
        };
        set((s) => ({ nodes: [...s.nodes, created], selectedId: created.id }));
        return created;
      },

      removeNode: (id) =>
        set((s) => ({
          nodes: s.nodes.filter((n) => n.id !== id),
          edges: s.edges.filter((e) => e.source !== id && e.target !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),

      cycleTask: (id) =>
        set((s) => ({
          nodes: s.nodes.map((n) => {
            if (n.id !== id || n.type !== "task") return n;
            const next: Record<TaskStatus, TaskStatus> = {
              todo: "doing",
              doing: "done",
              done: "todo",
            };
            return { ...n, status: next[n.status ?? "todo"], updatedAt: now() };
          }),
        })),

      summarizeNode: (id) =>
        set((s) => ({
          nodes: s.nodes.map((n) => {
            if (n.id !== id) return n;
            const clean = n.content.replace(/[#*`>\[\]]/g, "").trim();
            const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
            const summary = sentences.slice(0, 2).join(" ").trim();
            return { ...n, summary: summary || n.title, updatedAt: now() };
          }),
        })),

      // ---- Edges / connections ----
      addEdge: (source, target, kind = "arrow") =>
        set((s) => {
          if (source === target) return s;
          if (s.edges.some((e) => e.source === source && e.target === target))
            return s;
          return {
            edges: [
              ...s.edges,
              { id: `e_${nanoid(6)}`, source, target, kind, status: "active" },
            ],
          };
        }),

      acceptSuggestedEdge: (id) =>
        set((s) => ({
          edges: s.edges.map((e) =>
            e.id === id ? { ...e, kind: "reference", status: "active" } : e
          ),
        })),

      dismissSuggestedEdge: (id) =>
        set((s) => ({
          edges: s.edges.map((e) =>
            e.id === id ? { ...e, status: "dismissed" } : e
          ),
        })),

      backlinks: (id) => {
        const s = get();
        const sourceIds = s.edges
          .filter(
            (e) =>
              e.target === id && e.status !== "suggested" && e.status !== "dismissed"
          )
          .map((e) => e.source);
        return s.nodes.filter((n) => sourceIds.includes(n.id));
      },
      outgoing: (id) => {
        const s = get();
        const targetIds = s.edges
          .filter(
            (e) =>
              e.source === id && e.status !== "suggested" && e.status !== "dismissed"
          )
          .map((e) => e.target);
        return s.nodes.filter((n) => targetIds.includes(n.id));
      },

      unlinkedMentions: (id) => {
        const s = get();
        const self = s.nodes.find((n) => n.id === id);
        if (!self || !self.title.trim()) return [];
        const needle = self.title.toLowerCase();
        const linked = new Set(
          s.edges
            .filter(
              (e) =>
                e.status !== "dismissed" &&
                (e.source === id || e.target === id)
            )
            .map((e) => (e.source === id ? e.target : e.source))
        );
        return s.nodes.filter(
          (n) =>
            n.id !== id &&
            n.boardId === self.boardId &&
            !linked.has(n.id) &&
            `${n.title} ${n.content}`.toLowerCase().includes(needle)
        );
      },

      startConnect: (id) => set({ connectSourceId: id }),
      cancelConnect: () => set({ connectSourceId: null }),
      completeConnect: (targetId) =>
        set((s) => {
          const src = s.connectSourceId;
          if (!src || src === targetId) return { connectSourceId: null };
          if (s.edges.some((e) => e.source === src && e.target === targetId))
            return { connectSourceId: null };
          return {
            connectSourceId: null,
            edges: [
              ...s.edges,
              {
                id: `e_${nanoid(6)}`,
                source: src,
                target: targetId,
                kind: "arrow",
                status: "active",
              },
            ],
          };
        }),

      /** Relationship discovery: propose edges from keyword/tag overlap. */
      discoverLinks: () => {
        const s = get();
        const board = s.nodes.filter((n) => n.boardId === s.currentBoardId);
        const kw = new Map(board.map((n) => [n.id, keywords(n)] as const));
        const existing = new Set(s.edges.map((e) => `${e.source}>${e.target}`));
        const proposed: SemanticEdge[] = [];
        for (let i = 0; i < board.length; i++) {
          for (let j = i + 1; j < board.length; j++) {
            const a = board[i];
            const b = board[j];
            const ka = kw.get(a.id)!;
            const kb = kw.get(b.id)!;
            let overlap = 0;
            ka.forEach((w) => kb.has(w) && overlap++);
            const denom = Math.min(ka.size, kb.size) || 1;
            const score = overlap / denom;
            if (
              overlap >= 2 &&
              score >= 0.18 &&
              !existing.has(`${a.id}>${b.id}`) &&
              !existing.has(`${b.id}>${a.id}`)
            ) {
              proposed.push({
                id: `e_${nanoid(6)}`,
                source: a.id,
                target: b.id,
                kind: "ai_suggested",
                status: "suggested",
                confidence: Math.min(0.95, 0.5 + score),
              });
            }
          }
        }
        if (proposed.length) set((st) => ({ edges: [...st.edges, ...proposed] }));
        return proposed.length;
      },

      reset: () =>
        set({
          boards: DEMO_BOARDS,
          currentBoardId: DEMO_CURRENT_BOARD,
          nodes: DEMO_GRAPH.nodes,
          edges: DEMO_GRAPH.edges,
          selectedId: null,
          connectSourceId: null,
        }),
    }),
    {
      name: "notes-canvas-store",
      version: 2,
      partialize: (s) => ({
        boards: s.boards,
        currentBoardId: s.currentBoardId,
        nodes: s.nodes,
        edges: s.edges,
        aiKey: s.aiKey,
        aiModel: s.aiModel,
        userName: s.userName,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        if (version < 2 || !state.boards || state.boards.length === 0) {
          const boardId = "b_default";
          state.boards = [
            { id: boardId, title: "My Canvas", color: "#cfcfcf", updatedAt: now() },
          ];
          state.currentBoardId = boardId;
          state.nodes = (state.nodes ?? []).map((n) => ({
            ...n,
            boardId: n.boardId ?? boardId,
          }));
        }
        return state as AppState;
      },
    }
  )
);
