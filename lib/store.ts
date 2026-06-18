"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GraphData, SemanticEdge, SemanticNode } from "./types";
import { DEMO_GRAPH } from "./demo";
import { nanoid } from "nanoid";

/**
 * Shared client-side semantic store.
 *
 * In demo mode this is the source of truth (persisted to localStorage). When a
 * Supabase backend is configured, the projection layer keeps this in sync with
 * the relational `nodes`/`edges` tables. The canvas, knowledge graph, search
 * and AI panels all read from here.
 */

export type RightPanelTab = "details" | "ai";

interface AppState {
  nodes: SemanticNode[];
  edges: SemanticEdge[];

  selectedId: string | null;
  rightPanelTab: RightPanelTab;
  rightPanelOpen: boolean;
  leftRailOpen: boolean;
  commandOpen: boolean;

  select: (id: string | null) => void;
  setTab: (tab: RightPanelTab) => void;
  toggleRightPanel: (open?: boolean) => void;
  toggleLeftRail: (open?: boolean) => void;
  setCommandOpen: (open: boolean) => void;

  graph: () => GraphData;
  getNode: (id: string) => SemanticNode | undefined;
  updateNode: (id: string, patch: Partial<SemanticNode>) => void;
  addNode: (node: Partial<SemanticNode> & { type: SemanticNode["type"] }) => SemanticNode;
  removeNode: (id: string) => void;
  addEdge: (source: string, target: string, kind?: SemanticEdge["kind"]) => void;
  acceptSuggestedEdge: (id: string) => void;
  dismissSuggestedEdge: (id: string) => void;
  backlinks: (id: string) => SemanticNode[];
  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      nodes: DEMO_GRAPH.nodes,
      edges: DEMO_GRAPH.edges,

      selectedId: null,
      rightPanelTab: "details",
      rightPanelOpen: true,
      leftRailOpen: true,
      commandOpen: false,

      select: (id) => set({ selectedId: id, rightPanelOpen: id ? true : get().rightPanelOpen }),
      setTab: (tab) => set({ rightPanelTab: tab, rightPanelOpen: true }),
      toggleRightPanel: (open) =>
        set((s) => ({ rightPanelOpen: open ?? !s.rightPanelOpen })),
      toggleLeftRail: (open) =>
        set((s) => ({ leftRailOpen: open ?? !s.leftRailOpen })),
      setCommandOpen: (open) => set({ commandOpen: open }),

      graph: () => ({ nodes: get().nodes, edges: get().edges }),
      getNode: (id) => get().nodes.find((n) => n.id === id),

      updateNode: (id, patch) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
          ),
        })),

      addNode: (node) => {
        const created: SemanticNode = {
          id: node.id ?? `n_${nanoid(8)}`,
          type: node.type,
          title: node.title ?? "Untitled",
          content: node.content ?? "",
          tags: node.tags ?? [],
          x: node.x ?? 0,
          y: node.y ?? 0,
          w: node.w ?? 240,
          h: node.h ?? 150,
          src: node.src,
          color: node.color,
          updatedAt: new Date().toISOString(),
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
        set((s) => ({ edges: s.edges.filter((e) => e.id !== id) })),

      backlinks: (id) => {
        const s = get();
        const sourceIds = s.edges
          .filter((e) => e.target === id && e.status !== "suggested")
          .map((e) => e.source);
        return s.nodes.filter((n) => sourceIds.includes(n.id));
      },

      reset: () => set({ nodes: DEMO_GRAPH.nodes, edges: DEMO_GRAPH.edges, selectedId: null }),
    }),
    {
      name: "notes-canvas-store",
      partialize: (s) => ({ nodes: s.nodes, edges: s.edges }),
    }
  )
);
