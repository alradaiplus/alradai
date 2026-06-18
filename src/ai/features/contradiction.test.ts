import { describe, expect, it } from 'vitest';

import { buildLineage } from './contradiction';
import type { Memory } from '@/src/core/memory/types';

function mem(partial: Partial<Memory> & { id: string }): Memory {
  const { id, ...rest } = partial;
  return {
    id,
    tier: rest.tier ?? 'position',
    subject: rest.subject ?? 'back-emf',
    subjectLabel: rest.subjectLabel ?? 'back-EMF',
    statement: rest.statement ?? 'placeholder',
    confidence: rest.confidence ?? 0.7,
    evidenceCount: rest.evidenceCount ?? 1,
    sourceBlockIds: rest.sourceBlockIds ?? ['B1'],
    createdAt: rest.createdAt ?? 0,
    updatedAt: rest.updatedAt ?? 0,
    supersededBy: rest.supersededBy ?? null,
    archivedAt: rest.archivedAt ?? null,
    isHead: rest.isHead ?? 1,
  };
}

describe('buildLineage', () => {
  it('returns [current] when no predecessors exist', () => {
    const m = mem({ id: 'M1', isHead: 1 });
    const l = buildLineage(m, [m]);
    expect(l).toHaveLength(1);
    expect(l[0].id).toBe('M1');
  });

  it('walks supersededBy chain oldest-first', () => {
    const m1 = mem({
      id: 'M1',
      statement: 'back-EMF unreliable below 200 rpm',
      supersededBy: 'M2',
      isHead: 0,
    });
    const m2 = mem({
      id: 'M2',
      statement: 'back-EMF unreliable below 100 rpm',
      supersededBy: 'M3',
      isHead: 0,
    });
    const m3 = mem({
      id: 'M3',
      statement: 'back-EMF works above 80 rpm with filtering',
      isHead: 1,
    });
    const l = buildLineage(m3, [m1, m2, m3]);
    expect(l.map((m) => m.id)).toEqual(['M1', 'M2', 'M3']);
  });

  it('stops at cycles', () => {
    const m1 = mem({ id: 'M1', supersededBy: 'M1' });
    const l = buildLineage(m1, [m1]);
    expect(l).toHaveLength(1);
  });

  it('returns lineage of length >= 2 only when an actual ancestor exists', () => {
    const orphan = mem({ id: 'X' });
    const l = buildLineage(orphan, [orphan]);
    expect(l.length).toBeLessThan(2);
  });
});
