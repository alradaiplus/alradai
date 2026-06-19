"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  Heading1,
  Heading2,
  CheckSquare,
  List,
  ListOrdered,
  Quote,
  Info,
  Code2,
  Minus,
} from "lucide-react";

/**
 * Markdown-backed block editor with a Notion-style slash menu. Content stays a
 * markdown string (so canvas cards, transclusion, AI context and search all keep
 * working), while `/` opens a block picker. Rendering is handled by MarkdownLite.
 */

interface BlockDef {
  key: string;
  label: string;
  snippet: string;
  /** Caret offset from the insertion point after applying the snippet. */
  caret: number;
  icon: React.ReactNode;
}

const BLOCKS: BlockDef[] = [
  { key: "h1", label: "Heading 1", snippet: "# ", caret: 2, icon: <Heading1 size={14} /> },
  { key: "h2", label: "Heading 2", snippet: "## ", caret: 3, icon: <Heading2 size={14} /> },
  { key: "todo", label: "To-do", snippet: "- [ ] ", caret: 6, icon: <CheckSquare size={14} /> },
  { key: "bullet", label: "Bulleted list", snippet: "- ", caret: 2, icon: <List size={14} /> },
  { key: "number", label: "Numbered list", snippet: "1. ", caret: 3, icon: <ListOrdered size={14} /> },
  { key: "quote", label: "Quote", snippet: "> ", caret: 2, icon: <Quote size={14} /> },
  { key: "callout", label: "Callout", snippet: "> [!note] ", caret: 10, icon: <Info size={14} /> },
  { key: "code", label: "Code", snippet: "```\n\n```", caret: 4, icon: <Code2 size={14} /> },
  { key: "divider", label: "Divider", snippet: "---\n", caret: 4, icon: <Minus size={14} /> },
];

export function BlockEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const caretRef = useRef<number | null>(null);
  // menu.at = index of the "/" that opened the menu
  const [menu, setMenu] = useState<{ query: string; at: number } | null>(null);

  useLayoutEffect(() => {
    if (caretRef.current != null && ref.current) {
      ref.current.selectionStart = ref.current.selectionEnd = caretRef.current;
      caretRef.current = null;
    }
  });

  const detect = (v: string, caret: number) => {
    const before = v.slice(0, caret);
    const m = before.match(/(?:^|\n)\/(\w*)$/);
    if (m) setMenu({ query: m[1].toLowerCase(), at: caret - m[1].length - 1 });
    else setMenu(null);
  };

  const filtered = menu
    ? BLOCKS.filter((b) => b.label.toLowerCase().includes(menu.query))
    : [];

  const insert = (b: BlockDef) => {
    if (!menu || !ref.current) return;
    const caret = ref.current.selectionStart;
    const newVal = value.slice(0, menu.at) + b.snippet + value.slice(caret);
    caretRef.current = menu.at + b.caret;
    onChange(newVal);
    setMenu(null);
    requestAnimationFrame(() => ref.current?.focus());
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          detect(e.target.value, e.target.selectionStart);
        }}
        onKeyDown={(e) => {
          if (menu && filtered.length) {
            if (e.key === "Enter") {
              e.preventDefault();
              insert(filtered[0]);
            } else if (e.key === "Escape") {
              setMenu(null);
            }
          }
        }}
        onBlur={() => setTimeout(() => setMenu(null), 150)}
        rows={6}
        placeholder={placeholder}
        className="min-h-[140px] w-full resize-y rounded-lg border border-canvas-border bg-canvas-panel p-3 text-[13px] leading-relaxed text-ink-muted outline-none focus:border-accent-ring"
      />
      {menu && filtered.length > 0 && (
        <div className="absolute left-2 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-canvas-border bg-canvas-panel shadow-panel">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-ink-faint">
            Blocks
          </div>
          {filtered.map((b) => (
            <button
              key={b.key}
              onMouseDown={(e) => {
                e.preventDefault();
                insert(b);
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] text-ink-muted hover:bg-canvas-hover hover:text-ink"
            >
              <span className="text-ink-faint">{b.icon}</span>
              {b.label}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-[10px] text-ink-faint">
        Type <span className="font-mono text-ink-muted">/</span> for blocks · [[ to link · ![[ to embed
      </p>
    </div>
  );
}
