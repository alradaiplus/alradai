// Nightly Synthesis. Reads yesterday's blocks, writes one new Block
// tagged `synthesis`. Runs at most once per local day; triggered on
// first app open if today's hasn't fired yet.

import { call } from '@/src/ai/queue';
import { createBlock, db, lastRun } from '@/src/core/db';
import { isoDate, longDate, startOfDay, DAY } from '@/src/core/time';
import { useSettings } from '@/src/store/settingsStore';

const SYSTEM = `You are the user's nightly synthesis agent for Notes Canvas.
You read all blocks the user wrote in the last 24 hours.
In ≤150 words, write one paragraph: what the user was really thinking about,
and one thread they didn't notice. Do not be sycophantic. Do not list bullet
points. Cite block IDs inline using [[id]] notation when referencing them.`;

export async function runSynthesisIfDue(): Promise<void> {
  const today = isoDate();
  const previous = await lastRun('synthesis');
  if (previous) {
    const sameDay = isoDate(previous.ranAt) === today;
    if (sameDay) return;
  }

  const dayStart = startOfDay();
  const yStart = dayStart - DAY;
  const blocks = await db.blocks
    .where('createdAt')
    .between(yStart, dayStart, true, false)
    .filter((b) => !b.archivedAt && b.source !== 'agent')
    .toArray();

  if (blocks.length < 3) return; // too little signal

  const settings = useSettings.getState().settings;
  if (!settings.apiKey) return; // graceful — no key, no synthesis

  const corpus = blocks
    .map((b) => `[[${b.id}]] ${b.body.replace(/\s+/g, ' ').slice(0, 800)}`)
    .join('\n\n');

  const res = await call('synthesis', {
    model: settings.models.synthesis,
    system: SYSTEM,
    temperature: settings.temperature,
    reasoning: settings.reasoning,
    maxTokens: 400,
    messages: [
      {
        role: 'user',
        content: `Date: ${longDate()}\n\nBlocks (${blocks.length}):\n\n${corpus}`,
      },
    ],
  });

  const text = res.text.trim();
  if (!text) return;
  await createBlock({
    body: text,
    source: 'agent',
    tags: ['synthesis', `synth-${today}`],
  });
}
