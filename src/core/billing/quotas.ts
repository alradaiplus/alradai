import { supabase } from '@/src/core/supabase';

export interface Quota {
  apiCallsPerDay: number;
  storageGB: number;
  collaborators: number;
  monthlySpendUSD: number;
}

const PLAN_QUOTAS: Record<string, Quota> = {
  free: {
    apiCallsPerDay: 100,
    storageGB: 1,
    collaborators: 1,
    monthlySpendUSD: 0,
  },
  pro: {
    apiCallsPerDay: 10000,
    storageGB: 100,
    collaborators: 10,
    monthlySpendUSD: 50,
  },
  enterprise: {
    apiCallsPerDay: 1000000,
    storageGB: 10000,
    collaborators: 1000,
    monthlySpendUSD: 10000,
  },
};

/**
 * Get quota for user plan
 */
export function getQuota(plan: string): Quota {
  return PLAN_QUOTAS[plan] || PLAN_QUOTAS.free;
}

/**
 * Check if user has exceeded quota
 */
export async function checkQuota(
  userId: string,
  quotaType: keyof Quota
): Promise<{ exceeded: boolean; used: number; limit: number }> {
  // Get user plan
  const { data: customer } = await supabase
    .from('stripe_customers')
    .select('plan')
    .eq('user_id', userId)
    .single();

  const plan = customer?.plan || 'free';
  const quota = getQuota(plan);
  const limit = quota[quotaType];

  let used = 0;

  if (quotaType === 'apiCallsPerDay') {
    const today = new Date().toISOString().split('T')[0];
    const { data: runs } = await supabase
      .from('agent_runs')
      .select('id')
      .eq('workspace_id', userId)
      .gte('ran_at', `${today}T00:00:00Z`);
    used = runs?.length || 0;
  } else if (quotaType === 'monthlySpendUSD') {
    const { data: runs } = await supabase
      .from('agent_runs')
      .select('cost_usd')
      .eq('workspace_id', userId);
    used = (runs || []).reduce((sum, run) => sum + (run.cost_usd || 0), 0);
  } else if (quotaType === 'collaborators') {
    const { data: members } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', userId);
    used = members?.length || 0;
  }

  return {
    exceeded: used >= limit,
    used,
    limit,
  };
}

/**
 * Rate limit check (in-memory, single instance only)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || record.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

/**
 * Enforce quota
 */
export async function enforceQuota(
  userId: string,
  quotaType: keyof Quota
): Promise<void> {
  const { exceeded } = await checkQuota(userId, quotaType);
  if (exceeded) {
    throw new Error(`Quota exceeded: ${quotaType}`);
  }
}

/**
 * Enforce rate limit
 */
export function enforceRateLimit(
  userId: string,
  limit: number = 100,
  windowMs: number = 60000
): void {
  const { allowed } = checkRateLimit(`user:${userId}`, limit, windowMs);
  if (!allowed) {
    throw new Error('Rate limit exceeded');
  }
}
