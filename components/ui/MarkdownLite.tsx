"use client";

import { Fragment } from "react";
import { useStore } from "@/lib/store";
import { normalizeTitle } from "@/lib/projection/wikilinks";

/**
 * Minimal, dependency-free markdown/block renderer for node bodies.
 * Blocks: headings (#), to-dos (- [ ]), bullet/numbered lists, quotes (>),
 * callouts (> [!note]), dividers (---), code fences (```), and
 * ![[Transclusion]] (live embed, one level deep).
 * Inline: **bold**, `code`, [[wikilinks]].
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
  const out: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      out.push(<div key={i} className="h-1" />);
      continue;
    }

    // Code fence ```
    if (trimmed.startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      out.push(
        <pre
          key={i}
          className="my-1 overflow-auto rounded-md border border-canvas-border bg-canvas-bg p-2 font-mono text-[11px] leading-snug text-ink-muted"
        >
          {body.join("\n")}
        </pre>
      );
      continue;
    }

    // Transclusion ![[Title]]
    const embed = allowTransclude && trimmed.match(/^!\[\[([^\]]+?)\]\]$/);
    if (embed) {
      const title = embed[1].split("|")[0].split("#")[0].trim();
      const target = nodes.find(
        (n) => normalizeTitle(n.title) === normalizeTitle(title)
      );
      out.push(
        <div
          key={i}
          className="my-1 rounded-md border-l-2 border-canvas-strong bg-canvas-elevated/40 px-2 py-1"
        >
          <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
            {target ? target.title : `Missing: ${title}`}
          </div>
          {target && <MarkdownLite text={target.content} allowTransclude={false} />}
        </div>
      );
      continue;
    }

    // Divider ---
    if (/^-{3,}$/.test(trimmed)) {
      out.push(<hr key={i} className="my-2 border-canvas-border" />);
      continue;
    }

    // Callout > [!type] text
    const callout = trimmed.match(/^>\s*\[!(\w+)\]\s*(.*)$/);
    if (callout) {
      out.push(
        <div
          key={i}
          className="my-1 flex gap-2 rounded-md border border-canvas-border bg-canvas-elevated/50 px-2 py-1.5 text-[12px] text-ink-muted"
        >
          <span className="text-ink-faint">»</span>
          <span>{renderInline(callout[2] || callout[1])}</span>
        </div>
      );
      continue;
    }

    // Quote >
    if (trimmed.startsWith(">")) {
      out.push(
        <p
          key={i}
          className="my-0.5 border-l-2 border-canvas-strong pl-2 text-[12px] italic text-ink-muted"
        >
          {renderInline(trimmed.replace(/^>\s?/, ""))}
        </p>
      );
      continue;
    }

    // To-do - [ ] / - [x]
    const todo = trimmed.match(/^[-*]\s+\[( |x|X)\]\s+(.*)$/);
    if (todo) {
      const done = todo[1].toLowerCase() === "x";
      out.push(
        <div key={i} className="flex items-start gap-1.5 text-[12px]">
          <span className={done ? "text-ink-muted" : "text-ink-faint"}>
            {done ? "☑" : "☐"}
          </span>
          <span className={done ? "text-ink-faint line-through" : "text-ink-muted"}>
            {renderInline(todo[2])}
          </span>
        </div>
      );
      continue;
    }

    // Bulleted list
    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      out.push(
        <div key={i} className="flex gap-1.5 text-[12px] text-ink-muted">
          <span className="text-ink-faint">•</span>
          <span>{renderInline(bullet[1])}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numbered) {
      out.push(
        <div key={i} className="flex gap-1.5 text-[12px] text-ink-muted">
          <span className="text-ink-faint">{numbered[1]}.</span>
          <span>{renderInline(numbered[2])}</span>
        </div>
      );
      continue;
    }

    // Headings
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const cls =
        level === 1
          ? "text-[13px] font-bold text-ink"
          : "text-[12px] font-semibold text-ink";
      out.push(
        <p key={i} className={cls}>
          {renderInline(heading[2])}
        </p>
      );
      continue;
    }

    out.push(
      <p key={i} className="text-[12px] text-ink-muted">
        {renderInline(line)}
      </p>
    );
  }

  return <div className="space-y-1">{out}</div>;
}

function renderInline(text: string) {
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
