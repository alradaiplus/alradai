import { supabase } from '@/src/core/supabase';

const STRIPE_API_KEY = process.env.STRIPE_SECRET_KEY || '';

export interface StripeCustomer {
  id: string;
  stripeCustomerId: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: number;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  canceledAt?: number;
}

/**
 * Create Stripe customer
 */
export async function createStripeCustomer(
  userId: string,
  email: string
): Promise<StripeCustomer> {
  const response = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      email,
      metadata: JSON.stringify({ userId }),
    }),
  });

  if (!response.ok) throw new Error('Failed to create Stripe customer');

  const customer = await response.json();

  // Store in database
  await supabase
    .from('stripe_customers')
    .insert([{
      user_id: userId,
      stripe_customer_id: customer.id,
      email,
      plan: 'free',
      status: 'active',
      current_period_end: null,
    }]);

  return {
    id: userId,
    stripeCustomerId: customer.id,
    email,
    plan: 'free',
    status: 'active',
    currentPeriodEnd: 0,
  };
}

/**
 * Create subscription
 */
export async function createSubscription(
  stripeCustomerId: string,
  priceId: string,
  plan: 'pro' | 'enterprise'
): Promise<StripeSubscription> {
  const response = await fetch('https://api.stripe.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: stripeCustomerId,
      items: JSON.stringify([{ price: priceId }]),
      payment_behavior: 'default_incomplete',
      expand: JSON.stringify(['latest_invoice.payment_intent']),
    }),
  });

  if (!response.ok) throw new Error('Failed to create subscription');

  const subscription = await response.json();

  // Store in database
  await supabase
    .from('stripe_subscriptions')
    .insert([{
      stripe_subscription_id: subscription.id,
      stripe_customer_id: stripeCustomerId,
      plan,
      status: subscription.status,
      current_period_start: subscription.current_period_start * 1000,
      current_period_end: subscription.current_period_end * 1000,
    }]);

  return {
    id: subscription.id,
    customerId: stripeCustomerId,
    plan,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start * 1000,
    currentPeriodEnd: subscription.current_period_end * 1000,
  };
}

/**
 * Get customer subscription
 */
export async function getCustomerSubscription(
  stripeCustomerId: string
): Promise<StripeSubscription | null> {
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions?customer=${stripeCustomerId}`,
    {
      headers: {
        'Authorization': `Bearer ${STRIPE_API_KEY}`,
      },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const subscription = data.data?.[0];

  if (!subscription) return null;

  return {
    id: subscription.id,
    customerId: stripeCustomerId,
    plan: subscription.metadata?.plan || 'free',
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start * 1000,
    currentPeriodEnd: subscription.current_period_end * 1000,
    canceledAt: subscription.canceled_at ? subscription.canceled_at * 1000 : undefined,
  };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${STRIPE_API_KEY}`,
      },
    }
  );

  if (!response.ok) throw new Error('Failed to cancel subscription');

  // Update database
  await supabase
    .from('stripe_subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscriptionId);
}

/**
 * Get usage for billing
 */
export async function getUsage(userId: string): Promise<{
  apiCalls: number;
  storageBytes: number;
  collaborators: number;
  cost: number;
}> {
  const { data: agentRuns } = await supabase
    .from('agent_runs')
    .select('cost_usd')
    .eq('workspace_id', userId);

  const totalCost = (agentRuns || []).reduce((sum, run) => sum + (run.cost_usd || 0), 0);

  return {
    apiCalls: agentRuns?.length || 0,
    storageBytes: 0, // TODO: calculate from blocks
    collaborators: 0, // TODO: calculate from workspace_members
    cost: totalCost,
  };
}
