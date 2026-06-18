/**
 * Client-safe demo AI: lightweight keyword retrieval + grounded fallback answer.
 *
 * Shared by the server route (when no OpenRouter keys are set) and by the
 * static-export build (GitHub Pages), where there is no server to call. Keeping
 * this pure and dependency-free means it runs identically on both sides.
 */

export interface ContextNode {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

export interface Hit {
  node: ContextNode;
  score: number;
}

export interface Citation {
  nodeId: string;
  title: string;
  score: number;
}

/** Lightweight keyword retrieval to pick the most relevant nodes. */
export function retrieve(query: string, nodes: ContextNode[], k = 4): Hit[] {
  const terms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2);
  const scored = nodes.map((n) => {
    const hay = `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (hay.includes(t)) score += 1;
      if (n.title.toLowerCase().includes(t)) score += 1.5;
    }
    return { node: n, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((s) => s.score > 0)
    .slice(0, k);
}

export function citationsOf(hits: Hit[]): Citation[] {
  return hits.map((h) => ({
    nodeId: h.node.id,
    title: h.node.title,
    score: h.score,
  }));
}

export function firstSentence(text: string): string {
  const clean = text.replace(/[#*`>\[\]]/g, "").trim();
  const m = clean.match(/^(.{0,140}?[.!?])(\s|$)/);
  return (m ? m[1] : clean.slice(0, 120)).trim();
}

/** Grounded answer assembled purely from the matched notes. */
export function fallbackAnswer(hits: Hit[]): string {
  if (hits.length === 0) {
    return `I couldn't find anything on your canvas about that yet. Add notes (or configure OpenRouter keys for full AI answers), then ask again.`;
  }
  return `Based on your canvas, here's what's relevant:\n\n${hits
    .map((h) => `• **${h.node.title}** — ${firstSentence(h.node.content)}`)
    .join("\n")}`;
}

export function contextBlock(hits: Hit[]): string {
  return hits.map((h) => `### ${h.node.title}\n${h.node.content}`).join("\n\n");
}
