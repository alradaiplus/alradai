// Nightly Synthesis. Runs at most once per local day on first open.
//
// Order
//   1. Pull yesterday's user blocks
//   2. Run the memory extractor over them (batched, single LLM call)
//   3. Build the <known_context> from updated memories
//   4. Write the morning paragraph with the context injected

import { call } from '@/src/ai/queue';
import { createBlock, db, lastRun } from '@/src/core/db';
import { isoDate, longDate, startOfDay, DAY } from '@/src/core/time';
import { useSettings } from '@/src/store/settingsStore';
import { buildContext, extractFromBlocks } from '@/src/ai/features/memory';

const SYSTEM = `You are the user's nightly synthesis agent for Notes Canvas.
You read all blocks the user wrote in the last 24 hours, plus a
<known_context> block describing what the agent already knows about
this user.

In ≤150 words, write one paragraph: what the user was really thinking
about, and one thread they didn't notice. Use known_context to be
specific — name their project, reference a position they hold, point
to a contradiction if present. Do not be sycophantic. Do not list
bullet points. Cite block IDs inline using [[id]] notation.`;

export async function runSynthesisIfDue(): Promise<void> {
  const today = isoDate();
  const previous = await lastRun('synthesis');
  if (previous && isoDate(previous.ranAt) === today) return;

  const dayStart = startOfDay();
  const yStart = dayStart - DAY;
  const blocks = await db.blocks
    .where('createdAt')
    .between(yStart, dayStart, true, false)
    .filter((b) => !b.archivedAt && b.source !== 'agent')
    .toArray();

  if (blocks.length < 3) return;

  const settings = useSettings.getState().settings;
  if (!settings.apiKey) return;

  // 1. Extract memories from yesterday's blocks. This is the only
  //    point in the system that mints new memories — keeps cost
  //    predictable at one LLM call per day.
  try {
    await extractFromBlocks(blocks);
  } catch {
    // memory extraction failure must not block synthesis itself
  }

  // 2. Build context from the now-current memory store. Seed text is
  //    yesterday's writing concatenated and truncated.
  const seed = blocks
    .map((b) => b.body)
    .join('\n')
    .slice(0, 1500);
  const context = await buildContext(seed, 400);

  // 3. Compose corpus
  const corpus = blocks
    .map((b) => `[[${b.id}]] ${b.body.replace(/\s+/g, ' ').slice(0, 800)}`)
    .join('\n\n');

  const userContent = [
    `Date: ${longDate()}`,
    context, // empty string if no memories yet — harmless
    `Blocks (${blocks.length}):`,
    '',
    corpus,
  ]
    .filter(Boolean)
    .join('\n\n');

  // 4. Write the paragraph
  const res = await call('synthesis', {
    model: settings.models.synthesis,
    system: SYSTEM,
    temperature: settings.temperature,
    reasoning: settings.reasoning,
    maxTokens: 400,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = res.text.trim();
  if (!text) return;
  await createBlock({
    body: text,
    source: 'agent',
    tags: ['synthesis', `synth-${today}`],
  });
}
