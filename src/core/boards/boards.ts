// CRUD over the boards / board_nodes / board_edges tables.
// Pure DB calls. No AI, no React.

import { db } from '@/src/core/db';
import { ulid } from '@/src/core/ids';
import { DAY } from '@/src/core/time';
import type {
  Board,
  BoardCluster,
  BoardEdge,
  BoardNode,
  BoardWithGraph,
  EdgeLabel,
} from './types';

const DEFAULT_TTL_DAYS = 30;

type CreateBoardInput = {
  title: string;
  topic: string;
  origin?: Board['origin'];
  prompt: string;
  clusters: BoardCluster[];
  nodes: Array<{ blockId: string; x: number; y: number; cluster: string }>;
  edges: Array<{ fromBlockId: string; toBlockId: string; label: EdgeLabel }>;
};

export async function createBoard(input: CreateBoardInput): Promise<Board> {
  const now = Date.now();
  const board: Board = {
    id: ulid(now),
    title: input.title.trim() || 'Untitled board',
    topic: input.topic.trim(),
    createdAt: now,
    origin: input.origin ?? 'agent',
    prompt: input.prompt,
    expiresAt: now + DEFAULT_TTL_DAYS * DAY,
    clusters: input.clusters,
  };

  const nodes: BoardNode[] = input.nodes.map((n) => ({
    id: ulid(now),
    boardId: board.id,
    blockId: n.blockId,
    x: n.x,
    y: n.y,
    cluster: n.cluster,
  }));

  const edges: BoardEdge[] = input.edges.map((e) => ({
    id: ulid(now),
    boardId: board.id,
    fromBlockId: e.fromBlockId,
    toBlockId: e.toBlockId,
    label: e.label,
  }));

  await db.transaction('rw', db.boards, db.boardNodes, db.boardEdges, async () => {
    await db.boards.add(board);
    if (nodes.length) await db.boardNodes.bulkAdd(nodes);
    if (edges.length) await db.boardEdges.bulkAdd(edges);
  });

  return board;
}

export async function getBoard(id: string): Promise<BoardWithGraph | undefined> {
  const board = await db.boards.get(id);
  if (!board) return undefined;
  const [nodes, edges] = await Promise.all([
    db.boardNodes.where('boardId').equals(id).toArray(),
    db.boardEdges.where('boardId').equals(id).toArray(),
  ]);
  return { board, nodes, edges };
}

export async function listBoards(limit = 50): Promise<Board[]> {
  return db.boards.orderBy('createdAt').reverse().limit(limit).toArray();
}

export async function listActiveBoards(now = Date.now()): Promise<Board[]> {
  const all = await db.boards.orderBy('createdAt').reverse().toArray();
  return all.filter((b) => b.expiresAt > now);
}

export async function deleteBoard(id: string): Promise<void> {
  await db.transaction('rw', db.boards, db.boardNodes, db.boardEdges, async () => {
    await db.boards.delete(id);
    await db.boardNodes.where('boardId').equals(id).delete();
    await db.boardEdges.where('boardId').equals(id).delete();
  });
}

/**
 * Renew a board's TTL (touch). Used when the user opens the board so
 * still-useful interpretations don't auto-expire.
 */
export async function touchBoard(id: string): Promise<void> {
  const b = await db.boards.get(id);
  if (!b) return;
  await db.boards.update(id, {
    expiresAt: Date.now() + DEFAULT_TTL_DAYS * DAY,
  });
}
