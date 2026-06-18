export type PropertyType = 'text' | 'number' | 'select' | 'date' | 'relation' | 'checkbox' | 'formula' | 'rollup';

export type BlockType = 
  | 'paragraph'
  | 'heading1' | 'heading2' | 'heading3'
  | 'bulleted_list' | 'numbered_list'
  | 'toggle'
  | 'callout'
  | 'code'
  | 'quote'
  | 'divider'
  | 'database'
  | 'embed'
  | 'image';

export interface Property {
  id: string;
  databaseId: string;
  name: string;
  type: PropertyType;
  config: Record<string, unknown>;
  order: number;
  createdAt: number;
}

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface PropertyConfig {
  text?: {
    multiline?: boolean;
  };
  number?: {
    format?: 'number' | 'percent' | 'currency';
  };
  select?: {
    options: SelectOption[];
  };
  date?: {
    includeTime?: boolean;
    dateFormat?: string;
  };
  relation?: {
    targetDatabaseId: string;
    symmetricProperty?: string;
  };
  formula?: {
    expression: string;
  };
  rollup?: {
    relationProperty: string;
    rollupProperty: string;
    function: 'count' | 'sum' | 'average' | 'min' | 'max';
  };
}

export interface DatabaseRow {
  id: string;
  databaseId: string;
  blockId: string;
  values: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export interface Database {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  properties: Property[];
  rows?: DatabaseRow[];
  createdAt: number;
  updatedAt: number;
}

export type ViewType = 'table' | 'board' | 'calendar' | 'gallery' | 'timeline';

export interface ViewConfig {
  filters?: Array<{
    property: string;
    operator: 'is' | 'contains' | 'before' | 'after' | 'equals';
    value: unknown;
  }>;
  sorts?: Array<{
    property: string;
    direction: 'asc' | 'desc';
  }>;
  groupBy?: string;
  hiddenProperties?: string[];
}

export interface DatabaseView {
  id: string;
  databaseId: string;
  name: string;
  type: ViewType;
  config: ViewConfig;
  createdAt: number;
  updatedAt: number;
}

export interface RichBlock {
  id: string;
  type: BlockType;
  content: string;
  properties?: Record<string, unknown>;
  children?: RichBlock[];
  createdAt: number;
  updatedAt: number;
}
