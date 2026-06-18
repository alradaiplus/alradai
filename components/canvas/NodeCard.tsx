"use client";

import { useStore } from "@/lib/store";
import { NODE_TYPE_META } from "@/lib/types";
import { FileText, Image as ImageIcon, Link2, Box, File } from "lucide-react";
import { MarkdownLite } from "@/components/ui/MarkdownLite";

const ICONS = {
  note: FileText,
  image: ImageIcon,
  file: File,
  embed: Box,
  link: Link2,
} as const;

/**
 * The visual body of a canvas node. Reads from the shared store so edits made
 * in the inspector or by the AI reflect live on the canvas.
 */
export function NodeCard({ nodeId }: { nodeId: string }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === nodeId));
  if (!node) return null;

  const meta = NODE_TYPE_META[node.type];
  const Icon = ICONS[node.type];

  return (
    <div
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-canvas-border bg-canvas-panel text-ink shadow-node"
      style={{ borderTopColor: meta.color, borderTopWidth: 3 }}
    >
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        <Icon size={14} style={{ color: meta.color }} />
        <span className="truncate text-[13px] font-semibold leading-tight">
          {node.title}
        </span>
      </div>

      {node.type === "image" && node.src ? (
        <div className="min-h-0 flex-1 overflow-hidden bg-canvas-bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.src}
            alt={node.title}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      ) : node.type === "link" ? (
        <div className="flex min-h-0 flex-1 flex-col justify-center px-3 pb-2">
          <p className="line-clamp-2 text-[12px] text-ink-muted">{node.content}</p>
          <span className="mt-1 truncate text-[11px] text-node-link">{node.src}</span>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-hidden px-3 pb-2 text-[12px] leading-snug text-ink-muted">
          <MarkdownLite text={node.content} />
        </div>
      )}

      {node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {node.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-canvas-elevated px-1.5 py-0.5 text-[10px] text-ink-faint"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
