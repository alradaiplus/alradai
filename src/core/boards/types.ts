// Research Board — a generated interpretation of a topic.
//
// Boards are not graphs. They are the agent's reading of "what is
// happening here." Edges carry meaning (supports / contradicts /
// derives / asks). Cluster placement encodes argumentative structure.
//
// Boards are interpretations; blocks remain the source of truth.
// Closing a board never loses a block.

export type EdgeLabel = 'supports' | 'contradicts' | 'derives' | 'asks';

export const EDGE_LABELS: EdgeLabel[] = ['supports', 'contradicts', 'derives', 'asks'];

export type BoardCluster = {
  /** stable id within the board, e.g. "c0" */
  id: string;
  label: string;
  /** agent-chosen plane position; -300..300 × -200..200 by prompt convention */
  x: number;
  y: number;
};

export type BoardNode = {
  /** ULID, board-scoped */
  id: string;
  boardId: string;
  blockId: string;
  /** computed position on the plane, derived from cluster + index */
  x: number;
  y: number;
  /** id of the BoardCluster this node belongs to */
  cluster: string;
};

export type BoardEdge = {
  /** ULID, board-scoped */
  id: string;
  boardId: string;
  fromBlockId: string;
  toBlockId: string;
  label: EdgeLabel;
};

export type Board = {
  id: string;
  title: string;
  topic: string;
  createdAt: number;
  /** "agent" for AI-generated. Reserved for "manual" in a later slice. */
  origin: 'agent' | 'manual';
  /** verbatim prompt used to generate, for explainability */
  prompt: string;
  /** UNIX ms; 30 days after createdAt by default */
  expiresAt: number;
  /**
   * The agent's named clusters live on the board header itself.
   * Per-node positions are derived from cluster center + member index.
   */
  clusters: BoardCluster[];
};

/** Single-document return type from boardStore.load. */
export type BoardWithGraph = {
  board: Board;
  nodes: BoardNode[];
  edges: BoardEdge[];
};
