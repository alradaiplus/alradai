// Human-friendly translations of typed agent outcomes.
// Single source of truth so Today and Settings agree on wording.

import type { SynthesisOutcome } from '@/src/ai/features/synthesis';
import type { ThreadOutcome } from '@/src/ai/features/thread';

export type Severity = 'info' | 'success' | 'warn' | 'error';

export type RenderedOutcome = {
  /** Toast / status line copy. */
  message: string;
  /** Used by UI to colour or filter toasts. */
  severity: Severity;
  /** True only when the run did something visible. */
  ran: boolean;
};

export function renderSynthesis(o: SynthesisOutcome | null): RenderedOutcome {
  if (!o) return { message: 'No synthesis yet.', severity: 'info', ran: false };
  if (o.ran) {
    return { message: 'Synthesis written.', severity: 'success', ran: true };
  }
  switch (o.reason) {
    case 'already-today':
      return { message: 'Already ran today.', severity: 'info', ran: false };
    case 'no-key':
      return {
        message: 'No API key — add one in Settings.',
        severity: 'warn',
        ran: false,
      };
    case 'too-few-blocks':
      return {
        message: 'Write at least 3 blocks first.',
        severity: 'info',
        ran: false,
      };
    case 'empty-output':
      return {
        message: 'The model returned no text.',
        severity: 'warn',
        ran: false,
      };
    case 'error':
      return {
        message: `Synthesis failed — ${shortErr(o.err)}`,
        severity: 'error',
        ran: false,
      };
  }
}

export function renderThread(o: ThreadOutcome | null): RenderedOutcome {
  if (!o) return { message: 'No thread run yet.', severity: 'info', ran: false };
  if (o.ran) {
    const n = o.report.newThreads;
    return {
      message: n === 0 ? 'No new threads this week.' : `${n} new thread${n === 1 ? '' : 's'}.`,
      severity: n === 0 ? 'info' : 'success',
      ran: true,
    };
  }
  switch (o.reason) {
    case 'already-this-week':
      return { message: 'Already ran this week.', severity: 'info', ran: false };
    case 'no-key':
      return {
        message: 'No API key — add one in Settings.',
        severity: 'warn',
        ran: false,
      };
    case 'too-few-blocks':
      return {
        message: 'Need 5+ blocks across 30 days.',
        severity: 'info',
        ran: false,
      };
    case 'no-clusters':
      return {
        message: 'No coherent themes found this week.',
        severity: 'info',
        ran: false,
      };
    case 'error':
      return {
        message: `Threads failed — ${shortErr(o.err)}`,
        severity: 'error',
        ran: false,
      };
  }
}

function shortErr(err: string | undefined): string {
  const s = (err ?? '').trim();
  if (!s) return 'unknown error';
  return s.length > 120 ? s.slice(0, 117) + '…' : s;
}
