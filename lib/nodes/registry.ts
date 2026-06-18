/**
 * Node registry — the single source of truth for the platform node taxonomy.
 *
 * Principle #2: every object is a node. Adding a node type means adding one
 * entry here; every surface (canvas shape, search result, dashboard row, mobile
 * list item, AI context) reads from this registry so they never diverge.
 *
 * This is the forward-looking platform taxonomy used by new surfaces. The V1
 * canvas (lib/types.ts `NodeType`) is a subset that is being migrated onto it.
 */

export type PlatformNodeType =
  | "note"
  | "task"
  | "project"
  | "ai"
  | "pdf"
  | "image"
  | "voice"
  | "research";

export interface NodeTypeDef {
  type: PlatformNodeType;
  label: string;
  /** lucide-react icon name (resolved at the component layer). */
  icon: string;
  /** Tailwind color token (see tailwind.config.ts `node.*`). */
  colorVar: string;
  /** Raw category hue, for the knowledge graph / canvas (non-Tailwind contexts). */
  color: string;
  description: string;
  /** Default canvas footprint in px. */
  defaultSize: { w: number; h: number };
  /** Whether this node's content is embedded and fed into AI context. */
  aiContext: boolean;
  /** Whether this node is backed by a Storage object (pdf/image/voice). */
  hasFile: boolean;
}

export const NODE_REGISTRY: Record<PlatformNodeType, NodeTypeDef> = {
  note: {
    type: "note",
    label: "Note",
    icon: "FileText",
    colorVar: "node-note",
    color: "#9aa0a6",
    description: "Freeform markdown thought. The atomic unit of the workspace.",
    defaultSize: { w: 280, h: 180 },
    aiContext: true,
    hasFile: false,
  },
  task: {
    type: "task",
    label: "Task",
    icon: "CircleCheck",
    colorVar: "node-task",
    color: "#c7c7c7",
    description: "Actionable item with status, priority, due date, and assignee.",
    defaultSize: { w: 260, h: 120 },
    aiContext: true,
    hasFile: false,
  },
  project: {
    type: "project",
    label: "Project",
    icon: "FolderKanban",
    colorVar: "node-project",
    color: "#e0e0e0",
    description: "A container that groups nodes and powers a dashboard view.",
    defaultSize: { w: 320, h: 200 },
    aiContext: true,
    hasFile: false,
  },
  ai: {
    type: "ai",
    label: "AI",
    icon: "Sparkles",
    colorVar: "node-ai",
    color: "#b9a7ff",
    description: "An AI thread or agent output, grounded in workspace context.",
    defaultSize: { w: 320, h: 240 },
    aiContext: true,
    hasFile: false,
  },
  pdf: {
    type: "pdf",
    label: "PDF",
    icon: "FileType2",
    colorVar: "node-pdf",
    color: "#e08f8f",
    description: "A document; text is extracted, chunked, and made searchable.",
    defaultSize: { w: 300, h: 380 },
    aiContext: true,
    hasFile: true,
  },
  image: {
    type: "image",
    label: "Image",
    icon: "Image",
    colorVar: "node-image",
    color: "#8fb6e0",
    description: "An image with optional caption and AI-generated description.",
    defaultSize: { w: 300, h: 220 },
    aiContext: true,
    hasFile: true,
  },
  voice: {
    type: "voice",
    label: "Voice note",
    icon: "Mic",
    colorVar: "node-voice",
    color: "#8fd0c0",
    description: "Audio capture; transcribed and turned into notes/tasks.",
    defaultSize: { w: 280, h: 140 },
    aiContext: true,
    hasFile: true,
  },
  research: {
    type: "research",
    label: "Research",
    icon: "Telescope",
    colorVar: "node-research",
    color: "#d6c393",
    description: "A question the AI researches into sources and a synthesis.",
    defaultSize: { w: 320, h: 260 },
    aiContext: true,
    hasFile: false,
  },
};

export const NODE_TYPES = Object.keys(NODE_REGISTRY) as PlatformNodeType[];

export function nodeDef(type: PlatformNodeType): NodeTypeDef {
  return NODE_REGISTRY[type];
}

/** Node types whose content contributes to AI/workspace context. */
export const AI_CONTEXT_TYPES = NODE_TYPES.filter((t) => NODE_REGISTRY[t].aiContext);

/** Node types backed by a Storage object. */
export const FILE_NODE_TYPES = NODE_TYPES.filter((t) => NODE_REGISTRY[t].hasFile);
