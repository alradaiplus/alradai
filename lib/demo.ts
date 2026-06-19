import type { Board, GraphData } from "./types";

/**
 * Fresh start. The app ships empty — a single space and no seeded nodes — so
 * nothing is an undeletable "example". Users add everything themselves; the
 * Help page (/app/help) explains how. Reset returns to exactly this state.
 */

const t = new Date().toISOString();

export const DEMO_BOARDS: Board[] = [
  { id: "b_main", title: "My Canvas", color: "#cfcfcf", updatedAt: t },
];

export const DEMO_CURRENT_BOARD = "b_main";

export const DEMO_GRAPH: GraphData = {
  nodes: [],
  edges: [],
};
