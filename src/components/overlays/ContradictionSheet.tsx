'use client';

import { useEffect, useState } from 'react';

import { Sheet } from '@/src/components/primitives/Sheet';
import { TagChip } from '@/src/components/primitives/TagChip';
import { contradictionsForBlock, type Contradiction } from '@/src/ai/features/contradiction';
import { db } from '@/src/core/db';
import { ago, longDate } from '@/src/core/time';
import type { Block } from '@/src/core/types';

type Props = {
  blockId: string;
  onClose: () => void;
};

export function ContradictionSheet({ blockId, onClose }: Props) {
  const [items, setItems] = useState<Contradiction[]>([]);
  const [sourceBlocks, setSourceBlocks] = useState<Record<string, Block>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const cs = await contradictionsForBlock(blockId);
      if (!alive) return;
      setItems(cs);
      const ids = Array.from(
        new Set(
          cs.flatMap((c) => [
            ...c.prior.sourceBlockIds,
            ...c.current.sourceBlockIds,
          ]),
        ),
      );
      const blocks = await Promise.all(ids.map((id) => db.blocks.get(id)));
      const byId: Record<string, Block> = {};
      for (const b of blocks) if (b) byId[b.id] = b;
      if (alive) setSourceBlocks(byId);
    })();
    return () => {
      alive = false;
    };
  }, [blockId]);

  return (
    <Sheet title="Contradiction" onClose={onClose}>
      {items.length === 0 ? (
        <div className="nc-empty">No contradictions for this block.</div>
      ) : (
        items.map((c) => <ContradictionRow key={c.current.id} c={c} blocks={sourceBlocks} />)
      )}
    </Sheet>
  );
}

function ContradictionRow({
  c,
  blocks,
}: {
  c: Contradiction;
  blocks: Record<string, Block>;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-mute)',
          marginBottom: 10,
        }}
      >
        {c.current.tier} · {c.current.subjectLabel}
      </div>

      <Pane
        label="Previous position"
        meta={`${ago(c.prior.createdAt)} · ${Math.round(c.prior.confidence * 100)}% confidence · ${c.prior.evidenceCount} block${c.prior.evidenceCount === 1 ? '' : 's'}`}
        statement={c.prior.statement}
        sourceIds={c.prior.sourceBlockIds}
        blocks={blocks}
        dim
      />
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-mute)',
          margin: '12px 0',
          textAlign: 'center',
        }}
      >
        ↓ superseded by ↓
      </div>
      <Pane
        label="Current position"
        meta={`${longDate(c.current.createdAt)} · ${Math.round(c.current.confidence * 100)}% confidence · ${c.current.evidenceCount} block${c.current.evidenceCount === 1 ? '' : 's'}`}
        statement={c.current.statement}
        sourceIds={c.current.sourceBlockIds}
        blocks={blocks}
      />

      {c.lineage.length > 2 ? (
        <details style={{ marginTop: 14 }}>
          <summary
            style={{
              fontSize: 11,
              color: 'var(--text-mute)',
              cursor: 'pointer',
            }}
          >
            Lineage ({c.lineage.length} statements)
          </summary>
          <ol
            style={{
              fontSize: 12,
              color: 'var(--text-dim)',
              paddingLeft: 18,
              marginTop: 8,
            }}
          >
            {c.lineage.map((m) => (
              <li key={m.id} style={{ marginBottom: 6 }}>
                {m.statement}{' '}
                <span style={{ color: 'var(--text-mute)' }}>
                  · {ago(m.createdAt)}
                </span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}

function Pane({
  label,
  meta,
  statement,
  sourceIds,
  blocks,
  dim,
}: {
  label: string;
  meta: string;
  statement: string;
  sourceIds: string[];
  blocks: Record<string, Block>;
  dim?: boolean;
}) {
  return (
    <div
      style={{
        padding: 14,
        border: '1px solid var(--hairline)',
        borderRadius: 12,
        background: dim ? 'transparent' : 'var(--surface-2)',
        opacity: dim ? 0.78 : 1,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-mute)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.55 }}>{statement}</div>
      <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 8 }}>
        {meta}
      </div>
      {sourceIds.length > 0 ? (
        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sourceIds.slice(0, 6).map((id) => {
            const b = blocks[id];
            return (
              <TagChip
                key={id}
                tag={b ? b.body.replace(/\s+/g, ' ').slice(0, 24) + (b.body.length > 24 ? '…' : '') : id.slice(0, 8)}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
