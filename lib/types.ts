/**
 * Domain types shared across the canvas, knowledge graph, search and AI layers.
 *
 * The canvas (tldraw) owns geometry; the semantic layer below is the source of
 * truth for the graph view, search, tasks, dashboards and retrieval-augmented
 * AI. Everything is a node (principle #2).
 */

export type NodeType =
  | "note"
  | "task"
  | "project"
  | "ai"
  | "pdf"
  | "image"
  | "voice"
  | "research"
  | "link"
  // Phase 6 — remaining node types
  | "folder"
  | "video"
  | "code"
  | "whiteboard"
  | "mindmap"
  | "bookmark"
  | "event"
  | "workflow"
  | "embed"
  | "habit"
  | "diagram";

export type EdgeKind = "arrow" | "wikilink" | "ai_suggested" | "reference";

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "med" | "high";

export interface SemanticNode {
  id: string;
  type: NodeType;
  title: string;
  /** Markdown body for notes; caption/url/transcript for media nodes. */
  content: string;
  tags: string[];
  /** Which board (canvas) this node lives on. */
  boardId: string;
  /** Optional project membership. */
  projectId?: string;
  /** Denormalized geometry mirrored from the canvas shape. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Media payload (image url, link href, file ref). */
  src?: string;
  color?: string;
  /** Task fields (type === "task"). */
  status?: TaskStatus;
  priority?: TaskPriority;
  due?: string;
  /** Research fields (type === "research"). */
  sources?: { title: string; url?: string }[];
  /** Habit fields (type === "habit"): ISO dates completed + cadence. */
  habitLog?: string[];
  cadence?: "daily" | "weekly";
  category?: string;
  goal?: string;
  /** Cached AI summary (any node). */
  summary?: string;
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
  color?: string;
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
  // Restrained, desaturated category hues that match the monochrome palette
  // (see tailwind.config.ts `node.*` and ARCHITECTURE.md §14).
  note: { label: "Note", color: "#9aa0a6", colorVar: "node-note" },
  task: { label: "Task", color: "#c7c7c7", colorVar: "node-task" },
  project: { label: "Project", color: "#e0e0e0", colorVar: "node-project" },
  ai: { label: "AI", color: "#b9a7ff", colorVar: "node-ai" },
  pdf: { label: "PDF", color: "#e08f8f", colorVar: "node-pdf" },
  image: { label: "Image", color: "#8fb6e0", colorVar: "node-image" },
  voice: { label: "Voice", color: "#8fd0c0", colorVar: "node-voice" },
  research: { label: "Research", color: "#d6c393", colorVar: "node-research" },
  link: { label: "Link", color: "#a0a0a0", colorVar: "node-link" },
  folder: { label: "Folder", color: "#c7c7c7", colorVar: "node-project" },
  video: { label: "Video", color: "#d99a9a", colorVar: "node-pdf" },
  code: { label: "Code", color: "#93c7b0", colorVar: "node-voice" },
  whiteboard: { label: "Whiteboard", color: "#c0c0c0", colorVar: "node-project" },
  mindmap: { label: "Mind Map", color: "#c0a7e0", colorVar: "node-ai" },
  bookmark: { label: "Bookmark", color: "#d6b48f", colorVar: "node-research" },
  event: { label: "Event", color: "#9ab6e0", colorVar: "node-image" },
  workflow: { label: "Workflow", color: "#a7b9ff", colorVar: "node-ai" },
  embed: { label: "Embed", color: "#a0a0a0", colorVar: "node-link" },
  habit: { label: "Habit", color: "#8fd0a0", colorVar: "node-voice" },
  diagram: { label: "Diagram", color: "#9ab6e0", colorVar: "node-image" },
};

/** Default canvas footprint per node type. */
export const NODE_DEFAULT_SIZE: Record<NodeType, { w: number; h: number }> = {
  note: { w: 280, h: 180 },
  task: { w: 260, h: 120 },
  project: { w: 300, h: 180 },
  ai: { w: 300, h: 220 },
  pdf: { w: 280, h: 320 },
  image: { w: 280, h: 200 },
  voice: { w: 260, h: 130 },
  research: { w: 300, h: 240 },
  link: { w: 260, h: 110 },
  folder: { w: 240, h: 130 },
  video: { w: 300, h: 200 },
  code: { w: 320, h: 200 },
  whiteboard: { w: 300, h: 200 },
  mindmap: { w: 300, h: 200 },
  bookmark: { w: 260, h: 120 },
  event: { w: 260, h: 130 },
  workflow: { w: 300, h: 180 },
  embed: { w: 300, h: 200 },
  habit: { w: 260, h: 140 },
  diagram: { w: 300, h: 200 },
};
