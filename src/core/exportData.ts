// Pure data-export and danger-zone helpers.
// Used by Settings → Data. No React. No Dexie internals leaked.

import { db } from './db';

/**
 * Export the user's blocks as a single markdown bundle.
 * Format
 *   # YYYY-MM-DD HH:MM
 *   tags: #foo #bar
 *
 *   body…
 *
 *   ---
 */
export async function exportBlocksAsMarkdown(): Promise<string> {
  const blocks = await db.blocks.orderBy('createdAt').toArray();
  const parts: string[] = [];
  parts.push(`# Notes Canvas — export`);
  parts.push(`exported: ${new Date().toISOString()}`);
  parts.push(`blocks: ${blocks.length}`);
  parts.push('---');
  for (const b of blocks) {
    if (b.archivedAt) continue;
    const ts = new Date(b.createdAt).toISOString().replace('T', ' ').slice(0, 16);
    parts.push(`## ${ts}`);
    if (b.tags.length) parts.push(`tags: ${b.tags.map((t) => '#' + t).join(' ')}`);
    if (b.source !== 'manual') parts.push(`source: ${b.source}`);
    parts.push('');
    parts.push(b.body);
    parts.push('');
    parts.push('---');
  }
  return parts.join('\n');
}

/**
 * Drop every Block, Commitment, Embedding, Memory, Board, and
 * AgentRun. Settings + KV preserved (so the user's API key + theme
 * survive). Caller MUST gate behind explicit confirmation.
 */
export async function wipeAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.blocks,
      db.commitments,
      db.embeddings,
      db.memories,
      db.memoryEmbeddings,
      db.boards,
      db.boardNodes,
      db.boardEdges,
      db.agentRuns,
    ],
    async () => {
      await Promise.all([
        db.blocks.clear(),
        db.commitments.clear(),
        db.embeddings.clear(),
        db.memories.clear(),
        db.memoryEmbeddings.clear(),
        db.boards.clear(),
        db.boardNodes.clear(),
        db.boardEdges.clear(),
        db.agentRuns.clear(),
      ]);
    },
  );
}

/** Trigger a browser download for a given filename + text. */
export function downloadAsFile(filename: string, content: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
