// One interface. All providers conform. No feature code outside src/ai/
// is allowed to know which provider is active.

import type { ProviderId, ReasoningLevel } from '@/src/core/types';

export type ModelSpec = { id: string; name?: string; contextLength?: number };

export type CompletionRequest = {
  model: string;
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  temperature?: number;
  reasoning?: ReasoningLevel;
  maxTokens?: number;
  json?: boolean;
  signal?: AbortSignal;
};

export type CompletionChunk = {
  delta?: string;
  done?: boolean;
  usage?: { promptTokens?: number; outputTokens?: number; costUsd?: number };
};

export type CompletionResult = {
  text: string;
  promptTokens?: number;
  outputTokens?: number;
  costUsd?: number;
};

export interface Provider {
  id: ProviderId;
  listModels(): Promise<ModelSpec[]>;
  complete(req: CompletionRequest): Promise<CompletionResult>;
  completeStream?(req: CompletionRequest): AsyncIterable<CompletionChunk>;
  test(): Promise<{ ok: boolean; message?: string }>;
}

import { createOpenRouter } from './openrouter';

export type ProviderConfig = {
  provider: ProviderId;
  apiKey: string;
};

export function makeProvider({ provider, apiKey }: ProviderConfig): Provider {
  switch (provider) {
    case 'openrouter':
      return createOpenRouter(apiKey);
    default:
      // v1 ships OpenRouter only. The interface is ready for the rest.
      throw new Error(`Provider "${provider}" not enabled in v1 — use OpenRouter.`);
  }
}
