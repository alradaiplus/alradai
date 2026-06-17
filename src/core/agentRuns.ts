// Read-side helpers over the agentRuns log. Used by the Agent
// Activity surface in Settings.

import { db } from './db';
import type { AgentRun } from './types';

export async function recentRuns(limit = 20): Promise<AgentRun[]> {
  return db.agentRuns.orderBy('ranAt').reverse().limit(limit).toArray();
}

export async function recentFailures(limit = 10): Promise<AgentRun[]> {
  const all = await db.agentRuns
    .where('ok')
    .equals(0)
    .reverse()
    .sortBy('ranAt');
  return all.slice(0, limit);
}
