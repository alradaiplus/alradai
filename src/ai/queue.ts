// AgentQueue — priority + dedupe + monthly cost guard.
//
// Every LLM call in the app routes through here. Same (feature, key,
// model) calls are deduped while in-flight. A budget check runs before
// each call; if monthly spend exceeds the user cap, the call is rejected
// with a typed error the UI can surface.

import { logRun, monthlySpendUsd } from '@/src/core/db';
import { makeProvider } from './provider';
import type { CompletionRequest, CompletionResult } from './provider';
import { useSettings } from '@/src/store/settingsStore';

export class BudgetExceeded extends Error {
  constructor(public capUsd: number, public spentUsd: number) {
    super(`Monthly cap $${capUsd.toFixed(2)} reached (spent $${spentUsd.toFixed(2)})`);
  }
}

type Job<T> = {
  key: string;
  run: () => Promise<T>;
};

const inflight = new Map<string, Promise<unknown>>();

export function dedupe<T>({ key, run }: Job<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = run().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export async function call(
  feature: 'recall' | 'synthesis' | 'contradiction' | 'thread' | 'board',
  req: CompletionRequest,
): Promise<CompletionResult> {
  const settings = useSettings.getState().settings;
  if (!settings.apiKey) {
    throw new Error('No API key — add one in Settings (⌘,).');
  }
  const cap = settings.monthlyCapUsd;
  const spent = await monthlySpendUsd();
  if (spent >= cap) throw new BudgetExceeded(cap, spent);

  const provider = makeProvider({
    provider: settings.provider,
    apiKey: settings.apiKey,
  });

  let res: CompletionResult;
  let ok: 0 | 1 = 0;
  let err: string | undefined;
  try {
    res = await provider.complete(req);
    ok = 1;
    return res;
  } catch (e) {
    err = (e as Error).message;
    throw e;
  } finally {
    await logRun({
      kind: feature,
      ranAt: Date.now(),
      provider: settings.provider,
      model: req.model,
      promptTokens: ok ? (res!.promptTokens ?? 0) : undefined,
      outputTokens: ok ? (res!.outputTokens ?? 0) : undefined,
      costUsd: ok ? (res!.costUsd ?? 0) : 0,
      ok,
      err,
    });
  }
}
