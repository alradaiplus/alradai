import { describe, expect, it } from 'vitest';

import { fanOut } from './board';

describe('fanOut layout', () => {
  it('places idx=0 at the cluster center', () => {
    const p = fanOut(100, -50, 0);
    expect(p.x).toBe(100);
    expect(p.y).toBe(-50);
  });

  it('places higher idx outside the first ring', () => {
    const center = fanOut(0, 0, 0);
    const ring1 = fanOut(0, 0, 1);
    const ring9 = fanOut(0, 0, 9);
    expect(distance(ring1, center)).toBeGreaterThan(80 + 60 - 1);
    expect(distance(ring9, center)).toBeGreaterThan(80 + 120 - 1);
  });

  it('is deterministic', () => {
    const a = fanOut(10, 20, 5);
    const b = fanOut(10, 20, 5);
    expect(a).toEqual(b);
  });

  it('does not overlap within a single ring', () => {
    const points = Array.from({ length: 8 }, (_, i) => fanOut(0, 0, i + 1));
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        expect(distance(points[i], points[j])).toBeGreaterThan(40);
      }
    }
  });
});

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
