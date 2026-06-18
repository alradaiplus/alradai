import { supabase } from '@/src/core/supabase';

/**
 * Parse wikilinks from text
 * Supports: [[id]], [[id|label]], [[title]], [[title|label]]
 */
export function parseWikilinks(text: string): Array<{ raw: string; id?: string; title?: string; label?: string }> {
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const matches = [];
  let match;

  while ((match = wikiLinkRegex.exec(text)) !== null) {
    const target = match[1].trim();
    const label = match[2]?.trim();
    
    // Check if it's a ULID (26 chars, alphanumeric)
    const isUlid = /^[0-9A-Z]{26}$/.test(target);
    
    matches.push({
      raw: match[0],
      id: isUlid ? target : undefined,
      title: !isUlid ? target : undefined,
      label,
    });
  }

  return matches;
}

/**
 * Resolve wikilink to block ID
 * First tries exact ID match, then title match, then fuzzy match
 */
export async function resolveWikilink(
  workspaceId: string,
  target: string
): Promise<{ id: string; title: string } | null> {
  // Check if it's already a ULID
  if (/^[0-9A-Z]{26}$/.test(target)) {
    const { data } = await supabase
      .from('blocks')
      .select('id, body')
      .eq('id', target)
      .eq('workspace_id', workspaceId)
      .single();

    if (data) {
      return { id: data.id, title: extractTitle(data.body) };
    }
  }

  // Try exact title match
  const { data: exactMatches } = await supabase
    .from('blocks')
    .select('id, body')
    .eq('workspace_id', workspaceId)
    .textSearch('body', target, { type: 'phrase' });

  if (exactMatches && exactMatches.length > 0) {
    const match = exactMatches[0];
    return { id: match.id, title: extractTitle(match.body) };
  }

  // Try fuzzy match
  const { data: fuzzyMatches } = await supabase
    .from('blocks')
    .select('id, body')
    .eq('workspace_id', workspaceId)
    .textSearch('body', target);

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    const match = fuzzyMatches[0];
    return { id: match.id, title: extractTitle(match.body) };
  }

  return null;
}

/**
 * Extract title from block body (first line or heading)
 */
export function extractTitle(body: string): string {
  const lines = body.split('\n');
  
  // Look for heading
  for (const line of lines) {
    if (line.startsWith('# ')) return line.slice(2).trim();
    if (line.startsWith('## ')) return line.slice(3).trim();
    if (line.startsWith('### ')) return line.slice(4).trim();
  }

  // Use first non-empty line
  for (const line of lines) {
    if (line.trim()) return line.trim().slice(0, 100);
  }

  return 'Untitled';
}

/**
 * Get wikilink autocomplete suggestions
 */
export async function getWikilinkSuggestions(
  workspaceId: string,
  query: string,
  limit: number = 10
): Promise<Array<{ id: string; title: string }>> {
  if (!query || query.length < 2) return [];

  const { data } = await supabase
    .from('blocks')
    .select('id, body')
    .eq('workspace_id', workspaceId)
    .textSearch('body', query)
    .limit(limit);

  if (!data) return [];

  return data.map(block => ({
    id: block.id,
    title: extractTitle(block.body),
  }));
}

/**
 * Replace wikilink in text
 */
export function replaceWikilink(
  text: string,
  oldRaw: string,
  newId: string,
  newLabel?: string
): string {
  const replacement = newLabel ? `[[${newId}|${newLabel}]]` : `[[${newId}]]`;
  return text.replace(oldRaw, replacement);
}

/**
 * Render wikilink as clickable element
 */
export function renderWikilink(
  wikilink: { raw: string; id?: string; title?: string; label?: string },
  resolvedId?: string,
  resolvedTitle?: string
): { id: string; label: string; valid: boolean } {
  const id = wikilink.id || resolvedId;
  const label = wikilink.label || resolvedTitle || wikilink.title || 'Unknown';
  
  return {
    id: id || '',
    label,
    valid: !!id,
  };
}
