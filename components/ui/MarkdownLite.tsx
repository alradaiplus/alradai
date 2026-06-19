"use client";

import { Fragment } from "react";
import { useStore } from "@/lib/store";
import { normalizeTitle } from "@/lib/projection/wikilinks";

/**
 * Minimal, dependency-free markdown renderer for note bodies.
 * Supports headings (#), bold (**), inline code (`), [[wikilinks]] and
 * ![[Transclusion]] (live embed of another node, one level deep).
 * Intentionally small — full rich text lives in the inspector editor.
 */
export function MarkdownLite({
  text,
  allowTransclude = true,
}: {
  text: string;
  allowTransclude?: boolean;
}) {
  const nodes = useStore((s) => s.nodes);
  const lines = (text || "").split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Transclusion: a line that is exactly ![[Title]] embeds that node.
        const embed = allowTransclude && line.trim().match(/^!\[\[([^\]]+?)\]\]$/);
        if (embed) {
          const title = embed[1].split("|")[0].split("#")[0].trim();
          const target = nodes.find(
            (n) => normalizeTitle(n.title) === normalizeTitle(title)
          );
          return (
            <div
              key={i}
              className="my-1 rounded-md border-l-2 border-canvas-strong bg-canvas-elevated/40 px-2 py-1"
            >
              <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                {target ? target.title : `Missing: ${title}`}
              </div>
              {target && (
                <MarkdownLite text={target.content} allowTransclude={false} />
              )}
            </div>
          );
        }

        const heading = line.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          const level = heading[1].length;
          const cls =
            level === 1
              ? "text-[13px] font-bold text-ink"
              : "text-[12px] font-semibold text-ink";
          return (
            <p key={i} className={cls}>
              {renderInline(heading[2])}
            </p>
          );
        }
        return (
          <p key={i} className="text-[12px] text-ink-muted">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Tokenize **bold**, `code`, [[wikilink]]
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\[[^\]]+\]\])/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-canvas-elevated px-1 py-0.5 font-mono text-[11px] text-accent-hover"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("[[") && part.endsWith("]]")) {
      const inner = part.slice(2, -2).split("|")[0].split("#")[0];
      return (
        <span key={i} className="text-accent-hover underline decoration-dotted">
          {inner}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
