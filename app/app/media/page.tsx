"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useMediaURL } from "@/lib/media";
import type { NodeType, SemanticNode } from "@/lib/types";
import { Image as ImageIcon, FileType2, Mic, Video, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const MEDIA_TYPES: NodeType[] = ["image", "video", "pdf", "voice"];

/**
 * Media Library — every image, video, PDF and voice note in the workspace,
 * filterable by kind. Click to open on the canvas.
 */
export default function MediaPage() {
  const nodes = useStore((s) => s.nodes);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const router = useRouter();
  const [filter, setFilter] = useState<NodeType | "all">("all");

  const media = nodes.filter(
    (n) => MEDIA_TYPES.includes(n.type) && (filter === "all" || n.type === filter)
  );

  const open = (n: SemanticNode) => {
    selectBoard(n.boardId);
    select(n.id);
    router.push("/app");
  };

  return (
    <div className="flex h-full flex-col bg-canvas-bg">
      <div className="flex flex-wrap items-center gap-3 border-b border-canvas-border bg-canvas-surface/80 px-5 py-3 backdrop-blur">
        <Library size={16} className="text-ink-muted" />
        <h1 className="text-[15px] font-semibold text-ink">Media Library</h1>
        <span className="text-[12px] text-ink-faint">{media.length} items</span>
        <div className="ml-auto flex gap-1">
          {(["all", ...MEDIA_TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[12px] capitalize transition",
                filter === t
                  ? "bg-canvas-hover text-ink"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5">
        {media.length === 0 ? (
          <p className="text-[13px] text-ink-faint">
            No media yet. Add an image/PDF/video/voice node and upload from your device.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {media.map((n) => (
              <MediaTile key={n.id} node={n} onOpen={() => open(n)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MediaTile({ node, onOpen }: { node: SemanticNode; onOpen: () => void }) {
  const url = useMediaURL(node.src);
  const isImg = node.type === "image" || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(node.src ?? "");
  const Icon = node.type === "pdf" ? FileType2 : node.type === "voice" ? Mic : Video;
  return (
    <button
      onClick={onOpen}
      className="overflow-hidden rounded-xl border border-canvas-border bg-canvas-panel text-left transition hover:border-canvas-strong"
    >
      <div className="flex aspect-video items-center justify-center bg-canvas-bg">
        {url && isImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={node.title} className="h-full w-full object-cover" />
        ) : node.type === "video" && url ? (
          <video src={url} className="h-full w-full object-cover" />
        ) : (
          <Icon size={26} className="text-ink-faint" />
        )}
      </div>
      <div className="truncate px-2.5 py-1.5 text-[12px] text-ink-muted">{node.title}</div>
    </button>
  );
}
