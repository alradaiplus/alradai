// ─────────────────────────────────────────────────────────────
// Core types — One Atom: Block.
// Everything else is a view on top of Block.
// ─────────────────────────────────────────────────────────────

export type BlockSource = 'manual' | 'capture' | 'voice' | 'share' | 'agent';

export type Attachment = {
  id: string;
  kind: 'image' | 'pdf' | 'audio' | 'video' | 'url';
  url: string;
  meta?: Record<string, unknown>;
};

export type Block = {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  source: BlockSource;
  tags: string[];
  links: string[];
  attachments: Attachment[];
  // derived/cached
  tokens: string[]; // for indexed search
  agentSummary?: string;
  archivedAt?: number;
  // status flags expressed as conventional tags too — kept here for fast read paths
  inbox?: 1 | 0;
  pinnedToday?: 1 | 0;
};

export type Commitment = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  slot: 1 | 2 | 3;
  text: string;
  done: 0 | 1;
  updatedAt: number;
};

export type AgentRun = {
  id: string;
  kind: 'recall' | 'synthesis' | 'contradiction' | 'thread' | 'board' | 'embed';
  ranAt: number;
  provider: string;
  model: string;
  promptTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  resultBlockId?: string;
  ok: 0 | 1;
  err?: string;
};

export type ProviderId = 'openrouter' | 'openai' | 'anthropic' | 'gemini' | 'local';

export type ReasoningLevel = 'off' | 'low' | 'medium' | 'high';

export type SettingsState = {
  provider: ProviderId;
  apiKey: string; // stored locally in IndexedDB; in Tauri/RN this moves to keychain
  models: {
    synthesis: string;
    recall: string;
    boards: string;
    threads: string;
  };
  temperature: number;
  reasoning: ReasoningLevel;
  monthlyCapUsd: number;
  theme: 'carbon' | 'dark' | 'system';
  snapToGrid: boolean;
};

export const DEFAULT_SETTINGS: SettingsState = {
  provider: 'openrouter',
  apiKey: '',
  models: {
    synthesis: 'anthropic/claude-sonnet-4',
    recall: 'on-device',
    boards: 'openai/gpt-4o',
    threads: 'anthropic/claude-opus-4',
  },
  temperature: 0.3,
  reasoning: 'medium',
  monthlyCapUsd: 5,
  theme: 'carbon',
  snapToGrid: true,
};

// 32-d lexical embedding used by on-device Recall. Cheap, deterministic,
// good enough for ranking on small corpora. Will be replaced by MLX /
// transformers.js embeddings when wrapped in Tauri/RN.
export type Embedding = Float32Array;
