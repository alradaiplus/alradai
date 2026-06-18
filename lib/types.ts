/**
 * Domain types shared across the canvas, knowledge graph, search and AI layers.
 *
 * The canvas (tldraw) owns geometry; the semantic layer below is *projected*
 * from canvas shapes and is the source of truth for the graph view, search and
 * retrieval-augmented AI. See lib/projection.
 */

export type NodeType = "note" | "image" | "file" | "embed" | "link";

export type EdgeKind = "arrow" | "wikilink" | "ai_suggested" | "reference";

export interface SemanticNode {
  id: string;
  type: NodeType;
  title: string;
  /** Markdown body for note nodes; caption / url for media nodes. */
  content: string;
  tags: string[];
  /** Denormalized geometry mirrored from the canvas shape. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Media payload (image url, embed src, link href). */
  src?: string;
  color?: string;
  updatedAt: string;
}

export interface SemanticEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label?: string;
  /** 0..1 for ai_suggested edges. */
  confidence?: number;
  status?: "active" | "suggested" | "dismissed";
}

export interface GraphData {
  nodes: SemanticNode[];
  edges: SemanticEdge[];
}

export interface Board {
  id: string;
  title: string;
  icon?: string;
  updatedAt: string;
}

export interface ChatCitation {
  nodeId: string;
  title: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
}

export const NODE_TYPE_META: Record<
  NodeType,
  { label: string; color: string; colorVar: string }
> = {
  note: { label: "Note", color: "#7c6cf6", colorVar: "node-note" },
  image: { label: "Image", color: "#37b6ff", colorVar: "node-image" },
  file: { label: "File", color: "#f5a623", colorVar: "node-file" },
  embed: { label: "Embed", color: "#ff6ca6", colorVar: "node-embed" },
  link: { label: "Link", color: "#34d399", colorVar: "node-link" },
};
