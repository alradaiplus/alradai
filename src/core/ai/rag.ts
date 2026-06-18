import { supabase } from '@/src/core/supabase';
import { aiGateway } from '@/src/ai/gateway';

export interface RAGResult {
  blockId: string;
  title: string;
  content: string;
  score: number;
  source: 'full-text' | 'semantic';
}

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8191), // Max token limit
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

/**
 * Hybrid RAG search: full-text + semantic + rerank
 */
export async function hybridSearch(
  workspaceId: string,
  query: string,
  limit: number = 5
): Promise<RAGResult[]> {
  const results: RAGResult[] = [];
  const seen = new Set<string>();

  // Full-text search
  const { data: fullTextResults } = await supabase
    .from('blocks')
    .select('id, body')
    .eq('workspace_id', workspaceId)
    .textSearch('body', query)
    .limit(limit);

  if (fullTextResults) {
    for (const result of fullTextResults) {
      seen.add(result.id);
      results.push({
        blockId: result.id,
        title: extractTitle(result.body),
        content: result.body.slice(0, 300),
        score: 1.0,
        source: 'full-text',
      });
    }
  }

  // Semantic search using pgvector
  const embedding = await generateEmbedding(query);
  if (embedding) {
    const { data: semanticResults } = await supabase.rpc('search_embeddings', {
      query_embedding: embedding,
      workspace_id: workspaceId,
      match_threshold: 0.5,
      match_count: limit * 2,
    });

    if (semanticResults) {
      for (const result of semanticResults) {
        if (!seen.has(result.block_id)) {
          seen.add(result.block_id);
          
          // Fetch block content
          const { data: block } = await supabase
            .from('blocks')
            .select('body')
            .eq('id', result.block_id)
            .single();

          if (block) {
            results.push({
              blockId: result.block_id,
              title: extractTitle(block.body),
              content: block.body.slice(0, 300),
              score: result.similarity,
              source: 'semantic',
            });
          }
        }
      }
    }
  }

  // Rerank by score and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
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
 * Build RAG context for AI prompt
 */
export async function buildRAGContext(
  workspaceId: string,
  query: string,
  maxTokens: number = 2000
): Promise<{ context: string; citations: Array<{ blockId: string; title: string }> }> {
  const results = await hybridSearch(workspaceId, query, 5);
  
  const citations = results.map(r => ({
    blockId: r.blockId,
    title: r.title,
  }));

  let context = 'Relevant workspace context:\n\n';
  let tokenCount = 0;

  for (const result of results) {
    const section = `**${result.title}** (${result.source})\n${result.content}\n\n`;
    const estimatedTokens = section.split(/\s+/).length;

    if (tokenCount + estimatedTokens > maxTokens) break;

    context += section;
    tokenCount += estimatedTokens;
  }

  return { context, citations };
}

/**
 * Index block for semantic search
 */
export async function indexBlockForSearch(
  workspaceId: string,
  blockId: string,
  content: string
): Promise<void> {
  const embedding = await generateEmbedding(content);
  if (!embedding) return;

  // Check if embedding already exists
  const { data: existing } = await supabase
    .from('embeddings')
    .select('id')
    .eq('block_id', blockId)
    .single();

  if (existing) {
    // Update
    await supabase
      .from('embeddings')
      .update({
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('block_id', blockId);
  } else {
    // Insert
    await supabase
      .from('embeddings')
      .insert([{
        block_id: blockId,
        workspace_id: workspaceId,
        embedding,
        created_at: new Date().toISOString(),
      }]);
  }
}
