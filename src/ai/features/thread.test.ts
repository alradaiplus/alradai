import { describe, expect, it } from 'vitest';

import {
  clusterSignature,
  csigTag,
  formatThreadBody,
  parseThreadBody,
  weekKeyForSunday,
  weekTag,
} from '@/src/core/threads';
import { cluster } from '@/src/ai/features/_workers/cluster.worker';

describe('clusterSignature', () => {
  it('is stable across orderings', () => {
    const a = clusterSignature(['c', 'a', 'b']);
    const b = clusterSignature(['b', 'a', 'c']);
    expect(a).toBe(b);
  });
  it('differs when membership differs', () => {
    expect(clusterSignature(['a', 'b'])).not.toBe(clusterSignature(['a', 'c']));
  });
  it('produces an 8-char hex string', () => {
    const sig = clusterSignature(['x']);
    expect(sig).toMatch(/^[0-9a-f]{8}$/);
  });
  it('csigTag formats correctly', () => {
    expect(csigTag(['a'])).toMatch(/^csig-[0-9a-f]{8}$/);
  });
});

describe('weekKeyForSunday', () => {
  it('snaps any weekday to the same Sunday', () => {
    // Thursday June 18, 2026
    const thu = new Date('2026-06-18T12:00:00').getTime();
    // Sunday June 14, 2026
    const sun = new Date('2026-06-14T00:00:00').getTime();
    expect(weekKeyForSunday(thu)).toBe(weekKeyForSunday(sun));
  });
  it('weekTag prefixes the iso date', () => {
    const t = weekTag(new Date('2026-06-14T00:00:00').getTime());
    expect(t).toBe('week-2026-06-14');
  });
});

describe('thread body codec', () => {
  it('parses title and abstract', () => {
    const { title, abstract } = parseThreadBody('# Sensorless control\n\nbody body body');
    expect(title).toBe('Sensorless control');
    expect(abstract).toBe('body body body');
  });
  it('round-trips', () => {
    const body = formatThreadBody('Theme', 'Abstract.');
    const { title, abstract } = parseThreadBody(body);
    expect(title).toBe('Theme');
    expect(abstract).toBe('Abstract.');
  });
});

describe('greedy clustering', () => {
  // Two well-separated topics in 4-d unit space.
  const A = [1, 0, 0, 0];
  const B = [0, 1, 0, 0];

  function jitter(v: number[], seed: number): number[] {
    const out = v.slice();
    for (let i = 0; i < out.length; i++) {
      out[i] += ((seed * (i + 1)) % 7) * 0.001;
    }
    let n = 0;
    for (const x of out) n += x * x;
    n = Math.sqrt(n) || 1;
    return out.map((x) => x / n);
  }

  it('groups well-separated topics into two clusters of ≥5', () => {
    const blocks = [
      ...Array.from({ length: 7 }, (_, i) => ({ id: `a${i}`, v: jitter(A, i + 1) })),
      ...Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, v: jitter(B, i + 1) })),
    ];
    const { clusters } = cluster({
      blocks,
      threshold: 0.5,
      minSize: 5,
    });
    expect(clusters.length).toBe(2);
    const ids = clusters.map((c) => c.memberIds.sort()).sort((x, y) => x[0].localeCompare(y[0]));
    expect(ids[0][0].startsWith('a')).toBe(true);
    expect(ids[1][0].startsWith('b')).toBe(true);
  });

  it('filters out clusters below minSize', () => {
    const blocks = [
      ...Array.from({ length: 3 }, (_, i) => ({ id: `a${i}`, v: jitter(A, i + 1) })),
      ...Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, v: jitter(B, i + 1) })),
    ];
    const { clusters } = cluster({ blocks, threshold: 0.5, minSize: 5 });
    expect(clusters).toHaveLength(1);
    expect(clusters[0].memberIds.every((id) => id.startsWith('b'))).toBe(true);
  });

  it('is deterministic for a fixed input order', () => {
    const blocks = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      v: jitter(A, i + 1),
    }));
    const c1 = cluster({ blocks, threshold: 0.5, minSize: 5 }).clusters;
    const c2 = cluster({ blocks, threshold: 0.5, minSize: 5 }).clusters;
    expect(c1.map((c) => c.memberIds)).toEqual(c2.map((c) => c.memberIds));
  });
});
