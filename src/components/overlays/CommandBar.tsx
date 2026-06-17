'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Icon } from '@/src/components/primitives/Icon';
import { searchBlocks, db } from '@/src/core/db';
import { firstLine } from '@/src/core/text';
import { ago } from '@/src/core/time';
import { useDebounced } from '@/src/hooks/useDebounced';
import { useBoard } from '@/src/store/boardStore';
import { useUI } from '@/src/store/uiStore';
import type { Block } from '@/src/core/types';
import type { Board } from '@/src/core/boards/types';

type Tab = 'blocks' | 'tags' | 'boards' | 'commands';

type Hit =
  | { kind: 'block'; block: Block }
  | { kind: 'tag'; tag: string; count: number }
  | { kind: 'board'; board: Board }
  | { kind: 'board-generate'; topic: string }
  | { kind: 'command'; label: string; do: () => void };

export function CommandBar() {
  const close = useUI((s) => s.close);
  const open = useUI((s) => s.open);
  const setSurface = useUI((s) => s.setSurface);
  const openEditor = useUI((s) => s.openEditor);
  const openBoard = useUI((s) => s.openBoard);
  const generateBoard = useBoard((s) => s.generate);
  const refreshRecentBoards = useBoard((s) => s.refreshRecent);
  const recentBoards = useBoard((s) => s.recent);
  const toast = useUI((s) => s.toast);

  const [q, setQ] = useState('');
  const [tab, setTab] = useState<Tab>('blocks');
  const [hits, setHits] = useState<Hit[]>([]);
  const [focus, setFocus] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounced(q, 90);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const query = debounced.trim();
      if (tab === 'blocks') {
        const blocks = query
          ? await searchBlocks(query, 30)
          : await db.blocks.orderBy('updatedAt').reverse().limit(20).toArray();
        if (!cancelled)
          setHits(blocks.map((b) => ({ kind: 'block' as const, block: b })));
      } else if (tab === 'boards') {
        await refreshRecentBoards();
        const list: Hit[] = recentBoards
          .filter((b) => !query || b.title.toLowerCase().includes(query.toLowerCase()) || b.topic.toLowerCase().includes(query.toLowerCase()))
          .map((b) => ({ kind: 'board' as const, board: b }));
        if (query) {
          list.unshift({ kind: 'board-generate', topic: query });
        }
        if (!cancelled) setHits(list);
      } else if (tab === 'tags') {
        const blocks = await db.blocks.toArray();
        const counts = new Map<string, number>();
        for (const b of blocks)
          for (const t of b.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
        const arr = Array.from(counts.entries())
          .filter(([t]) => !query || t.includes(query.toLowerCase()))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 30)
          .map(([tag, count]) => ({ kind: 'tag' as const, tag, count }));
        if (!cancelled) setHits(arr);
      } else {
        type Cmd = Extract<Hit, { kind: 'command' }>;
        const all: Cmd[] = [
          {
            kind: 'command',
            label: 'Open Settings',
            do: () => {
              close();
              open('settings');
            },
          },
          {
            kind: 'command',
            label: 'Go to Today',
            do: () => {
              close();
              setSurface('today');
            },
          },
          {
            kind: 'command',
            label: 'Go to Canvas',
            do: () => {
              close();
              setSurface('canvas');
            },
          },
          {
            kind: 'command',
            label: 'Go to Inbox',
            do: () => {
              close();
              setSurface('inbox');
            },
          },
          {
            kind: 'command',
            label: 'Capture a thought',
            do: () => {
              close();
              open('capture');
            },
          },
        ];
        const cmds: Cmd[] = all.filter(
          (c) => !query || c.label.toLowerCase().includes(query.toLowerCase()),
        );
        if (!cancelled) setHits(cmds);
      }
      setFocus(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, tab, close, open, setSurface, recentBoards, refreshRecentBoards]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocus((i) => Math.min(hits.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocus((i) => Math.max(0, i - 1));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const order: Tab[] = ['blocks', 'tags', 'boards', 'commands'];
      const idx = order.indexOf(tab);
      setTab(order[(idx + (e.shiftKey ? -1 : 1) + order.length) % order.length]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(hits[focus]);
    }
  }

  function activate(h: Hit | undefined) {
    if (!h) return;
    if (h.kind === 'block') {
      openEditor(h.block.id);
    } else if (h.kind === 'tag') {
      // route to Canvas with the tag query
      close();
      setSurface('canvas');
      // setQuery happens via canvas store hydration
      // small detour: defer until next tick
      import('@/src/store/canvasStore').then(({ useCanvas }) =>
        useCanvas.getState().setQuery(`tag:${h.tag}`),
      );
    } else if (h.kind === 'board') {
      close();
      openBoard(h.board.id);
    } else if (h.kind === 'board-generate') {
      const topic = h.topic;
      close();
      // Switch to the Board surface *immediately* so the user sees a
      // "Generating board…" state while the LLM call resolves.
      const previousSurface = useUI.getState().surface;
      setSurface('board');
      void generateBoard(topic).then((id) => {
        if (id) {
          openBoard(id);
        } else {
          // Revert if generation failed so we don't strand the user
          // on an empty Board surface.
          setSurface(previousSurface === 'board' ? 'today' : previousSurface);
          toast('Not enough material on this topic yet.');
        }
      });
    } else if (h.kind === 'command') {
      h.do();
    }
  }

  const placeholder = useMemo(() => {
    if (tab === 'blocks') return 'Search blocks…';
    if (tab === 'tags') return 'Find a tag…';
    if (tab === 'boards') return 'Board on… (type a topic and ↵)';
    return 'Type a command…';
  }, [tab]);

  return (
    <div className="nc-overlay-root" onMouseDown={close} onKeyDown={onKey}>
      <div className="nc-cmd" onMouseDown={(e) => e.stopPropagation()}>
        <div className="nc-cmd__input">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            value={q}
            placeholder={placeholder}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="nc-cmd__tabs">
          {(['blocks', 'tags', 'boards', 'commands'] as Tab[]).map((t) => (
            <div
              key={t}
              className={`nc-cmd__tab ${tab === t ? 'nc-cmd__tab--active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>
        <div className="nc-cmd__list">
          {hits.length === 0 ? (
            <div className="nc-empty">No matches.</div>
          ) : (
            hits.map((h, i) => (
              <div
                key={hitKey(h, i)}
                className={`nc-cmd__item ${i === focus ? 'nc-cmd__item--focus' : ''}`}
                onMouseEnter={() => setFocus(i)}
                onClick={() => activate(h)}
              >
                {renderHit(h)}
              </div>
            ))
          )}
        </div>
        <div className="nc-cmd__footer">
          <span>↑↓ move</span>
          <span>↵ open</span>
          <span>⇥ tab</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}

function renderHit(h: Hit) {
  if (h.kind === 'block') {
    return (
      <>
        <span>{firstLine(h.block.body, 70)}</span>
        <span className="nc-cmd__item-meta">{ago(h.block.createdAt)}</span>
      </>
    );
  }
  if (h.kind === 'tag') {
    return (
      <>
        <span>#{h.tag}</span>
        <span className="nc-cmd__item-meta">{h.count} blocks</span>
      </>
    );
  }
  if (h.kind === 'board') {
    return (
      <>
        <span>{h.board.title}</span>
        <span className="nc-cmd__item-meta">{ago(h.board.createdAt)}</span>
      </>
    );
  }
  if (h.kind === 'board-generate') {
    return (
      <>
        <span>Board on: <strong style={{ color: 'var(--text)' }}>{h.topic}</strong></span>
        <span className="nc-cmd__item-meta">generate</span>
      </>
    );
  }
  return <span>{h.label}</span>;
}

function hitKey(h: Hit, i: number): string {
  if (h.kind === 'block') return `b:${h.block.id}`;
  if (h.kind === 'tag') return `t:${h.tag}`;
  if (h.kind === 'board') return `B:${h.board.id}`;
  if (h.kind === 'board-generate') return `Bg:${h.topic}`;
  return `c:${i}`;
}
