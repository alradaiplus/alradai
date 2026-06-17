'use client';

import { useEffect, useState } from 'react';

import { db } from '@/src/core/db';
import type { Block } from '@/src/core/types';
import { useAgent } from '@/src/store/agentStore';
import { useSettings } from '@/src/store/settingsStore';
import { useUI } from '@/src/store/uiStore';

// Five distinct states for the Morning Paragraph. The card no longer
// shows a single optimistic placeholder regardless of context.
//
//   READY        a paragraph exists for today — render it
//   RUNNING      synthesis is currently in flight — show "Reading…"
//   NO-KEY       no API key configured — direct user to Settings
//   TOO-FEW      not enough blocks to synthesize — explain
//   FAILED       last attempt errored — show short reason

export function MorningParagraph() {
  const id = useAgent((s) => s.morningParagraphId);
  const running = useAgent((s) => s.synthesisRunning);
  const last = useAgent((s) => s.lastSynthesis);
  const apiKey = useSettings((s) => s.settings.apiKey);
  const open = useUI((s) => s.open);
  const [block, setBlock] = useState<Block | null>(null);

  useEffect(() => {
    if (!id) {
      setBlock(null);
      return;
    }
    void db.blocks.get(id).then((b) => setBlock(b ?? null));
  }, [id]);

  // 1. We have a paragraph — render it.
  if (block) {
    return (
      <section className="nc-card nc-morning">
        <div className="nc-card__head">
          <div>
            <div className="nc-card__title">Morning</div>
            <div className="nc-card__sub">Synthesis · last 24h</div>
          </div>
        </div>
        <div className="nc-card__body">
          <p className="nc-morning__body">{block.body}</p>
        </div>
      </section>
    );
  }

  // 2. In-flight.
  if (running) {
    return (
      <section className="nc-card nc-morning">
        <div className="nc-card__head">
          <div>
            <div className="nc-card__title">Morning</div>
            <div className="nc-card__sub">Reading yesterday&apos;s blocks…</div>
          </div>
          <span className="nc-pulse-dot" aria-hidden />
        </div>
        <div className="nc-card__body">
          <p className="nc-morning__body nc-morning__body--muted">
            The agent is composing a paragraph from your recent thinking.
            This usually takes 6–10 seconds.
          </p>
        </div>
      </section>
    );
  }

  // 3. Settle on a deterministic empty-state copy based on the last
  //    known outcome and current settings.
  const { title, subtitle, body, action } = pickEmptyState(last, apiKey, !!id);

  return (
    <section className="nc-card nc-morning">
      <div className="nc-card__head">
        <div>
          <div className="nc-card__title">Morning</div>
          <div className="nc-card__sub">{subtitle}</div>
        </div>
      </div>
      <div className="nc-card__body">
        <p className="nc-morning__body nc-morning__body--muted">{body}</p>
        {action ? (
          <button
            type="button"
            className="nc-morning__action"
            onClick={() => open(action.overlay)}
          >
            {action.label}
          </button>
        ) : null}
        <div className="nc-morning__title-hidden">{title}</div>
      </div>
    </section>
  );
}

type EmptyState = {
  title: string;
  subtitle: string;
  body: string;
  action?: { label: string; overlay: 'settings' | 'capture' };
};

function pickEmptyState(
  last: ReturnType<typeof useAgent.getState>['lastSynthesis'],
  apiKey: string,
  haveTodayParagraph: boolean,
): EmptyState {
  if (haveTodayParagraph) {
    return { title: '', subtitle: '', body: '' };
  }
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      title: 'No API key',
      subtitle: 'Synthesis disabled',
      body:
        'Add an OpenRouter key in Settings to enable nightly synthesis. Your capture and recall continue to work.',
      action: { label: 'Open Settings', overlay: 'settings' },
    };
  }
  if (last && !last.ran && last.reason === 'too-few-blocks') {
    return {
      title: 'Not enough yet',
      subtitle: 'Write a few more blocks',
      body:
        'Synthesis needs at least three blocks from the last 24 hours. Capture a few thoughts today and tomorrow morning you will see a paragraph here.',
      action: { label: 'Capture a thought', overlay: 'capture' },
    };
  }
  if (last && !last.ran && last.reason === 'error') {
    return {
      title: 'Synthesis failed',
      subtitle: 'Last attempt errored',
      body: `The last run did not complete: ${shortErr(last.err)} — open Settings → Agent Activity for details, then "Run now" to retry.`,
      action: { label: 'Open Settings', overlay: 'settings' },
    };
  }
  if (last && !last.ran && last.reason === 'empty-output') {
    return {
      title: 'Empty output',
      subtitle: 'Model returned no text',
      body:
        'The model returned an empty response. Try a different synthesis model in Settings, then run again.',
      action: { label: 'Open Settings', overlay: 'settings' },
    };
  }
  if (last && !last.ran && last.reason === 'no-key') {
    return {
      title: 'No API key',
      subtitle: 'Synthesis disabled',
      body: 'Add an OpenRouter key in Settings to enable nightly synthesis.',
      action: { label: 'Open Settings', overlay: 'settings' },
    };
  }
  // Default (never ran today, no failure recorded — usually first session).
  return {
    title: 'Tomorrow',
    subtitle: 'Your first paragraph arrives tomorrow morning',
    body:
      'Capture a few thoughts today. Overnight the agent will read them and write a one-paragraph synthesis to greet you tomorrow.',
    action: { label: 'Capture a thought', overlay: 'capture' },
  };
}

function shortErr(err: string | undefined): string {
  const s = (err ?? '').trim();
  if (!s) return 'unknown error';
  return s.length > 80 ? s.slice(0, 77) + '…' : s;
}
