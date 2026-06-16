// Minimal query DSL parser.
// Supports: tag:foo  is:inbox  is:done  is:question
//           before:2026-06-01  after:2026-06-01
//           free text terms
//
// Example: "tag:mechatronics is:question back-EMF"

export type ParsedQuery = {
  tags: string[];
  text: string[];
  is: string[];
  before?: number;
  after?: number;
};

export function parseQuery(input: string): ParsedQuery {
  const out: ParsedQuery = { tags: [], text: [], is: [] };
  const parts = input.trim().split(/\s+/);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith('tag:')) {
      out.tags.push(p.slice(4).toLowerCase());
    } else if (p.startsWith('is:')) {
      out.is.push(p.slice(3).toLowerCase());
    } else if (p.startsWith('before:')) {
      const d = Date.parse(p.slice(7));
      if (!isNaN(d)) out.before = d;
    } else if (p.startsWith('after:')) {
      const d = Date.parse(p.slice(6));
      if (!isNaN(d)) out.after = d;
    } else {
      out.text.push(p);
    }
  }
  return out;
}
