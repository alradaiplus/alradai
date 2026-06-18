export type NodeType = 
  | 'block'
  | 'database'
  | 'folder'
  | 'video'
  | 'code'
  | 'whiteboard'
  | 'mindmap'
  | 'bookmark'
  | 'calendar'
  | 'workflow'
  | 'embed';

export interface FolderNode {
  type: 'folder';
  id: string;
  title: string;
  children: string[]; // node IDs
  createdAt: number;
}

export interface VideoNode {
  type: 'video';
  id: string;
  title: string;
  url: string;
  duration?: number;
  transcript?: string;
  thumbnailUrl?: string;
  createdAt: number;
}

export interface CodeNode {
  type: 'code';
  id: string;
  title: string;
  language: string;
  code: string;
  lineNumbers?: boolean;
  createdAt: number;
}

export interface WhiteboardNode {
  type: 'whiteboard';
  id: string;
  title: string;
  drawing: string; // SVG or canvas data
  createdAt: number;
}

export interface MindMapNode {
  type: 'mindmap';
  id: string;
  title: string;
  root: {
    text: string;
    children?: MindMapNode[];
  };
  createdAt: number;
}

export interface BookmarkNode {
  type: 'bookmark';
  id: string;
  title: string;
  url: string;
  description?: string;
  imageUrl?: string;
  domain?: string;
  createdAt: number;
}

export interface CalendarEventNode {
  type: 'calendar';
  id: string;
  title: string;
  startDate: string; // ISO 8601
  endDate?: string;
  description?: string;
  location?: string;
  attendees?: string[];
  createdAt: number;
}

export interface WorkflowNode {
  type: 'workflow';
  id: string;
  title: string;
  steps: Array<{
    id: string;
    type: string;
    config: Record<string, unknown>;
  }>;
  createdAt: number;
}

export interface EmbedNode {
  type: 'embed';
  id: string;
  title: string;
  embedUrl: string;
  embedType: 'iframe' | 'script' | 'widget';
  width?: number;
  height?: number;
  createdAt: number;
}

export type AnyNode = 
  | FolderNode
  | VideoNode
  | CodeNode
  | WhiteboardNode
  | MindMapNode
  | BookmarkNode
  | CalendarEventNode
  | WorkflowNode
  | EmbedNode;
