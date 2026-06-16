// OpenRouter driver. v1's only enabled provider — unlocks the entire
// model catalog with a single user-supplied key.

import type {
  CompletionRequest,
  CompletionResult,
  ModelSpec,
  Provider,
} from './provider';

const BASE = 'https://openrouter.ai/api/v1';

function reasoningPayload(level: CompletionRequest['reasoning']) {
  if (!level || level === 'off') return { enabled: false } as const;
  return { effort: level } as const;
}

export function createOpenRouter(apiKey: string): Provider {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://notescanvas.app',
    'X-Title': 'Notes Canvas',
  };

  async function call(body: object, signal?: AbortSignal) {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      throw new Error(`OpenRouter ${r.status}: ${text || r.statusText}`);
    }
    return r.json();
  }

  return {
    id: 'openrouter',

    async listModels(): Promise<ModelSpec[]> {
      const r = await fetch(`${BASE}/models`, { headers });
      if (!r.ok) return [];
      const j = (await r.json()) as { data?: Array<{ id: string; name?: string; context_length?: number }> };
      return (j.data ?? []).map((m) => ({
        id: m.id,
        name: m.name,
        contextLength: m.context_length,
      }));
    },

    async test() {
      try {
        const r = await fetch(`${BASE}/auth/key`, { headers });
        if (!r.ok) return { ok: false, message: `HTTP ${r.status}` };
        return { ok: true };
      } catch (e) {
        return { ok: false, message: (e as Error).message };
      }
    },

    async complete(req: CompletionRequest): Promise<CompletionResult> {
      const messages: Array<{ role: string; content: string }> = [];
      if (req.system) messages.push({ role: 'system', content: req.system });
      messages.push(...req.messages);

      const body: Record<string, unknown> = {
        model: req.model,
        messages,
        temperature: req.temperature ?? 0.3,
        max_tokens: req.maxTokens ?? 1024,
      };
      if (req.json) body.response_format = { type: 'json_object' };
      const reasoning = reasoningPayload(req.reasoning);
      if (reasoning.enabled !== false) body.reasoning = reasoning;

      const j = await call(body, req.signal);
      const choice = j.choices?.[0]?.message?.content ?? '';
      const usage = j.usage ?? {};
      return {
        text: choice,
        promptTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        costUsd: j.usage?.total_cost ?? undefined,
      };
    },
  };
}
