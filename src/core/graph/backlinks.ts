import { supabase } from '@/src/core/supabase';

export interface Backlink {
  id: string;
  type: 'block' | 'database_row' | 'canvas_node';
  title: string;
  preview: string;
  source: string;
  createdAt: number;
}

/**
 * Get all backlinks to a block across all surfaces
 */
export async function getBacklinks(
  workspaceId: string,
  blockId: string
): Promise<Backlink[]> {
  const backlinks: Backlink[] = [];

  // Get backlinks from blocks (wikilinks)
  const { data: blockBacklinks } = await supabase
    .from('blocks')
    .select('id, body, created_at')
    .eq('workspace_id', workspaceId)
    .contains('links', [blockId]);

  if (blockBacklinks) {
    backlinks.push(
      ...blockBacklinks.map(b => ({
        id: b.id,
        type: 'block' as const,
        title: extractTitle(b.body),
        preview: b.body.slice(0, 150),
        source: 'wikilink',
        createdAt: new Date(b.created_at).getTime(),
      }))
    );
  }

  // Get backlinks from database rows (property relations)
  const { data: dbBacklinks } = await supabase
    .from('database_rows')
    .select('id, block_id, values, created_at')
    .eq('workspace_id', workspaceId)
    .filter('values', 'cs', JSON.stringify({ relation: blockId }));

  if (dbBacklinks) {
    backlinks.push(
      ...dbBacklinks.map(r => ({
        id: r.id,
        type: 'database_row' as const,
        title: `Row: ${r.id.slice(0, 8)}`,
        preview: JSON.stringify(r.values).slice(0, 150),
        source: 'relation',
        createdAt: new Date(r.created_at).getTime(),
      }))
    );
  }

  // Get backlinks from board edges
  const { data: edgeBacklinks } = await supabase
    .from('board_edges')
    .select('id, from_block_id, label, created_at')
    .eq('workspace_id', workspaceId)
    .eq('to_block_id', blockId);

  if (edgeBacklinks) {
    backlinks.push(
      ...edgeBacklinks.map(e => ({
        id: e.id,
        type: 'canvas_node' as const,
        title: `Edge: ${e.label}`,
        preview: `From: ${e.from_block_id.slice(0, 8)}`,
        source: 'canvas',
        createdAt: new Date(e.created_at).getTime(),
      }))
    );
  }

  return backlinks.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get unlinked mentions of a block
 * Finds blocks that mention the target block's title but don't have an explicit wikilink
 */
export async function getUnlinkedMentions(
  workspaceId: string,
  blockId: string,
  blockTitle: string
): Promise<Backlink[]> {
  if (!blockTitle || blockTitle.length < 3) return [];

  // Search for blocks containing the title
  const { data: mentions } = await supabase
    .from('blocks')
    .select('id, body, created_at')
    .eq('workspace_id', workspaceId)
    .textSearch('body', blockTitle);

  if (!mentions) return [];

  // Filter out blocks that already have explicit wikilinks
  const backlinks = await getBacklinks(workspaceId, blockId);
  const backlinkIds = new Set(backlinks.map(b => b.id));

  return mentions
    .filter(m => !backlinkIds.has(m.id) && m.id !== blockId)
    .map(m => ({
      id: m.id,
      type: 'block' as const,
      title: extractTitle(m.body),
      preview: m.body.slice(0, 150),
      source: 'mention',
      createdAt: new Date(m.created_at).getTime(),
    }));
}

/**
 * Extract title from block body
 */
function extractTitle(body: string): string {
  const lines = body.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('# ')) return line.slice(2).trim();
    if (line.startsWith('## ')) return line.slice(3).trim();
    if (line.startsWith('### ')) return line.slice(4).trim();
  }

  for (const line of lines) {
    if (line.trim()) return line.trim().slice(0, 100);
  }

  return 'Untitled';
}

/**
 * Build graph edges from all wikilinks and relations
 */
export async function buildGraphEdges(workspaceId: string) {
  // Get all blocks with links
  const { data: blocks } = await supabase
    .from('blocks')
    .select('id, links')
    .eq('workspace_id', workspaceId);

  if (!blocks) return [];

  const edges = [];

  for (const block of blocks) {
    if (block.links && Array.isArray(block.links)) {
      for (const linkedId of block.links) {
        edges.push({
          from: block.id,
          to: linkedId,
          type: 'wikilink',
        });
      }
    }
  }

  return edges;
}
