/**
 * Obsidian-style wikilink parsing.
 *
 * Extracts `[[Title]]`, `[[Title|alias]]` and `[[Title#heading]]` references
 * from markdown so they can be materialized as edges between semantic nodes.
 */

export interface ParsedWikilink {
  /** The resolved target title (without alias or heading). */
  target: string;
  /** Display alias if provided via `|`. */
  alias?: string;
  /** Heading anchor if provided via `#`. */
  heading?: string;
  /** Raw matched token, e.g. "[[Foo|bar]]". */
  raw: string;
}

const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;

export function parseWikilinks(markdown: string): ParsedWikilink[] {
  const out: ParsedWikilink[] = [];
  if (!markdown) return out;
  let m: RegExpExecArray | null;
  WIKILINK_RE.lastIndex = 0;
  while ((m = WIKILINK_RE.exec(markdown)) !== null) {
    const inner = m[1].trim();
    let target = inner;
    let alias: string | undefined;
    let heading: string | undefined;

    const pipe = target.indexOf("|");
    if (pipe !== -1) {
      alias = target.slice(pipe + 1).trim();
      target = target.slice(0, pipe).trim();
    }
    const hash = target.indexOf("#");
    if (hash !== -1) {
      heading = target.slice(hash + 1).trim();
      target = target.slice(0, hash).trim();
    }
    if (target) out.push({ target, alias, heading, raw: m[0] });
  }
  return out;
}

/** Normalize a title for case-insensitive matching. */
export function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}
