// Tokenization, slug, excerpt — all pure, no deps.

const STOP = new Set([
  'a','an','the','and','or','but','of','on','in','to','for','at','by','is','am',
  'are','was','were','be','been','being','it','its','this','that','these','those',
  'as','if','so','do','does','did','i','you','we','they','he','she','my','your',
  'our','their','me','him','her','us','them',
]);

const WORD = /[A-Za-z0-9_]+/g;

export function tokenize(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const matches = text.toLowerCase().match(WORD);
  if (!matches) return out;
  for (const w of matches) {
    if (w.length < 2 || STOP.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

export function extractTags(text: string): string[] {
  const out = new Set<string>();
  const re = /(?:^|\s)#([a-z0-9_-]{1,32})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.add(m[1].toLowerCase());
  return Array.from(out);
}

export function extractLinks(text: string): string[] {
  // [[block id or title]] — we only keep things that look like ULIDs for now.
  const out = new Set<string>();
  const re = /\[\[([A-Z0-9]{26})\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.add(m[1]);
  return Array.from(out);
}

export function excerpt(body: string, n = 140): string {
  const clean = body.replace(/\s+/g, ' ').trim();
  if (clean.length <= n) return clean;
  return clean.slice(0, n - 1) + '…';
}

export function firstLine(body: string, n = 80): string {
  const line = body.split('\n').find((l) => l.trim().length > 0) ?? '';
  return excerpt(line, n);
}

// Hash function — FNV-1a 32-bit. Used by the local embedding.
export function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
