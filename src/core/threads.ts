// Pure helpers for Thread Discovery. No Dexie, no React, no AI.

import { fnv1a } from './text';

export const THREAD_TAG = 'thread';

/** ISO date of the Sunday that opens the week containing ts. */
export function weekKeyForSunday(ts = Date.now()): string {
  const d = new Date(ts);
  const day = d.getDay(); // 0 = Sunday
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day2 = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day2}`;
}

export function weekTag(ts?: number): string {
  return `week-${weekKeyForSunday(ts)}`;
}

/**
 * Stable signature for an unordered set of block ids.
 * Same set ⇒ same signature ⇒ dedupe.
 */
export function clusterSignature(blockIds: string[]): string {
  const sorted = blockIds.slice().sort();
  const h = fnv1a(sorted.join('|')) >>> 0;
  return h.toString(16).padStart(8, '0');
}

export function csigTag(blockIds: string[]): string {
  return `csig-${clusterSignature(blockIds)}`;
}

/** Parse `{title}\n\n{abstract}` body shape used by thread Blocks. */
export function parseThreadBody(body: string): { title: string; abstract: string } {
  const lines = body.split('\n');
  const titleLine = lines.find((l) => l.trim().length > 0) ?? 'Untitled thread';
  const title = titleLine.replace(/^#+\s*/, '').trim();
  const rest = body.slice(body.indexOf(titleLine) + titleLine.length).trim();
  return { title, abstract: rest || titleLine };
}

export function formatThreadBody(title: string, abstract: string): string {
  return `# ${title}\n\n${abstract.trim()}`;
}
