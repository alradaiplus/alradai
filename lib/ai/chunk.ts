/**
 * Markdown-aware text chunking for embedding.
 *
 * Splits on headings/paragraphs and packs into ~maxChars windows with overlap.
 * Kept dependency-free so it runs in both Node and Edge runtimes.
 */

export interface Chunk {
  index: number;
  content: string;
}

export function chunkMarkdown(
  text: string,
  maxChars = 1800,
  overlapChars = 200
): Chunk[] {
  const clean = (text || "").trim();
  if (!clean) return [];

  // Split into blocks on blank lines / headings, preserving order.
  const blocks = clean
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buf = "";

  const flush = () => {
    if (buf.trim()) {
      chunks.push({ index: chunks.length, content: buf.trim() });
      // start next buffer with a tail overlap for context continuity
      buf = overlapChars > 0 ? buf.slice(-overlapChars) : "";
    }
  };

  for (const block of blocks) {
    if (block.length > maxChars) {
      // very large block — hard split by sentences
      const sentences = block.split(/(?<=[.!?])\s+/);
      for (const s of sentences) {
        if ((buf + " " + s).length > maxChars) flush();
        buf += (buf ? " " : "") + s;
      }
      continue;
    }
    if ((buf + "\n\n" + block).length > maxChars) flush();
    buf += (buf ? "\n\n" : "") + block;
  }
  flush();
  return chunks;
}
