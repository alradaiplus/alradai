"use client";

import { useStore } from "@/lib/store";
import { NODE_TYPE_META, type NodeType, type SemanticNode } from "@/lib/types";
import {
  FileText,
  Link2,
  CircleCheck,
  Circle,
  CircleDot,
  FolderKanban,
  Sparkles,
  FileType2,
  Image as ImageIcon,
  Mic,
  Telescope,
  Folder,
  Video,
  Code2,
  PenTool,
  Network,
  Bookmark,
  CalendarClock,
  Workflow,
  AppWindow,
  Play,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { MarkdownLite } from "@/components/ui/MarkdownLite";
import { useMediaURL } from "@/lib/media";

const ICONS: Record<NodeType, LucideIcon> = {
  note: FileText,
  task: CircleCheck,
  project: FolderKanban,
  ai: Sparkles,
  pdf: FileType2,
  image: ImageIcon,
  voice: Mic,
  research: Telescope,
  link: Link2,
  folder: Folder,
  video: Video,
  code: Code2,
  whiteboard: PenTool,
  mindmap: Network,
  bookmark: Bookmark,
  event: CalendarClock,
  workflow: Workflow,
  embed: AppWindow,
  habit: Flame,
};

/**
 * The visual body of a canvas node. Reads from the shared store so edits made
 * in the inspector or by the AI reflect live on the canvas. Each node type has
 * a tailored body while sharing one card chrome.
 */
export function NodeCard({ nodeId }: { nodeId: string }) {
  const node = useStore((s) => s.nodes.find((n) => n.id === nodeId));
  const cycleTask = useStore((s) => s.cycleTask);
  const connectSourceId = useStore((s) => s.connectSourceId);
  const completeConnect = useStore((s) => s.completeConnect);
  if (!node) return null;

  const meta = NODE_TYPE_META[node.type];
  const Icon = ICONS[node.type];
  const isConnectTarget = connectSourceId && connectSourceId !== node.id;

  return (
    <div
      className="group relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-canvas-border bg-canvas-panel text-ink shadow-node"
      style={{ borderTopColor: meta.color, borderTopWidth: 3 }}
      onPointerDown={(e) => {
        if (isConnectTarget) {
          e.stopPropagation();
          completeConnect(node.id);
        }
      }}
    >
      {isConnectTarget && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-xl ring-2 ring-accent-ring" />
      )}

      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        {node.type === "task" ? (
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              cycleTask(node.id);
            }}
            title="Toggle status"
            className="shrink-0"
          >
            {node.status === "done" ? (
              <CircleCheck size={15} style={{ color: meta.color }} />
            ) : node.status === "doing" ? (
              <CircleDot size={15} style={{ color: meta.color }} />
            ) : (
              <Circle size={15} className="text-ink-faint" />
            )}
          </button>
        ) : (
          <Icon size={14} style={{ color: meta.color }} />
        )}
        <span
          className={
            "truncate text-[13px] font-semibold leading-tight " +
            (node.type === "task" && node.status === "done"
              ? "text-ink-faint line-through"
              : "")
          }
        >
          {node.title}
        </span>
      </div>

      <Body node={node} metaColor={meta.color} />

      {node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {node.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-canvas-elevated px-1.5 py-0.5 text-[10px] text-ink-faint"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Body({ node, metaColor }: { node: SemanticNode; metaColor: string }) {
  const mediaUrl = useMediaURL(node.src);

  if (node.type === "image" && mediaUrl) {
    return (
      <div className="min-h-0 flex-1 overflow-hidden bg-canvas-bg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={node.title}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
    );
  }

  if (node.type === "link" || node.type === "bookmark" || node.type === "embed") {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center px-3 pb-2">
        <p className="line-clamp-2 text-[12px] text-ink-muted">{node.content}</p>
        {node.src && (
          <span className="mt-1 truncate text-[11px] text-node-link">{node.src}</span>
        )}
      </div>
    );
  }

  if (node.type === "code") {
    return (
      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-2">
        <pre className="h-full overflow-auto rounded-md border border-canvas-border bg-canvas-bg p-2 font-mono text-[11px] leading-snug text-ink-muted">
          {node.content || "// code"}
        </pre>
      </div>
    );
  }

  if (node.type === "video") {
    const isImg = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(node.src ?? "");
    return (
      <div className="min-h-0 flex-1 overflow-hidden bg-canvas-bg">
        {mediaUrl ? (
          isImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt={node.title} className="h-full w-full object-cover" draggable={false} />
          ) : (
            <video src={mediaUrl} controls className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play size={26} style={{ color: metaColor }} />
          </div>
        )}
      </div>
    );
  }

  if (node.type === "event") {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 text-[12px] text-ink-muted">
        {node.due && (
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-ink">
            <CalendarClock size={12} style={{ color: metaColor }} />
            {new Date(node.due).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        )}
        <p className="line-clamp-3">{node.content}</p>
      </div>
    );
  }

  if (node.type === "whiteboard" || node.type === "mindmap" || node.type === "workflow") {
    const Icon = node.type === "mindmap" ? Network : node.type === "workflow" ? Workflow : PenTool;
    return (
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <div className="mb-2 flex flex-1 items-center justify-center rounded-lg border border-dashed border-canvas-border bg-canvas-bg">
          <Icon size={26} style={{ color: metaColor }} />
        </div>
        <p className="line-clamp-2 text-[11px] text-ink-faint">{node.content}</p>
      </div>
    );
  }

  if (node.type === "habit") {
    const log = new Set(node.habitLog ?? []);
    const days = Array.from({ length: 7 }, (_, k) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - k));
      return d.toISOString().slice(0, 10);
    });
    let streak = 0;
    for (let k = 0; ; k++) {
      const d = new Date();
      d.setDate(d.getDate() - k);
      if (log.has(d.toISOString().slice(0, 10))) streak++;
      else break;
    }
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center px-3 pb-2">
        <div className="mb-1.5 flex items-center gap-1">
          {days.map((d) => (
            <span
              key={d}
              className="h-4 flex-1 rounded-sm"
              style={{ background: log.has(d) ? metaColor : "var(--bg-elevated)" }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-ink-faint">
          <Flame size={12} style={{ color: metaColor }} /> {streak}-day streak
        </div>
      </div>
    );
  }

  if (node.type === "folder") {
    return (
      <div className="flex min-h-0 flex-1 items-center gap-2 px-3 pb-2 text-[12px] text-ink-muted">
        <Folder size={18} style={{ color: metaColor }} />
        <p className="line-clamp-2">{node.content || "Empty folder"}</p>
      </div>
    );
  }

  if (node.type === "pdf") {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <div className="mb-2 flex flex-1 items-center justify-center rounded-lg border border-canvas-border bg-canvas-bg">
          <FileType2 size={28} style={{ color: metaColor }} />
        </div>
        <p className="line-clamp-2 text-[11px] text-ink-faint">{node.content}</p>
      </div>
    );
  }

  if (node.type === "voice") {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Mic size={12} style={{ color: metaColor }} />
          <div className="flex flex-1 items-center gap-[2px]">
            {[6, 12, 8, 16, 10, 14, 7, 13, 9, 5, 11, 8].map((h, i) => (
              <span
                key={i}
                className="w-[2px] rounded-full bg-canvas-strong"
                style={{ height: h }}
              />
            ))}
          </div>
        </div>
        {mediaUrl && (
          <audio src={mediaUrl} controls className="mb-1.5 h-7 w-full" />
        )}
        <p className="line-clamp-3 text-[11px] leading-snug text-ink-muted">
          {node.content}
        </p>
      </div>
    );
  }

  if (node.type === "task") {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
        <p className="line-clamp-2 text-[12px] text-ink-muted">{node.content}</p>
        <div className="mt-auto flex items-center gap-2 pt-1.5 text-[10px] text-ink-faint">
          {node.priority && (
            <span className="rounded bg-canvas-elevated px-1.5 py-0.5 uppercase">
              {node.priority}
            </span>
          )}
          {node.due && (
            <span>
              due{" "}
              {new Date(node.due).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (node.type === "research") {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 text-[12px] text-ink-muted">
        <p className="line-clamp-2">{node.content}</p>
        {node.sources && node.sources.length > 0 && (
          <div className="mt-2 space-y-1">
            {node.sources.slice(0, 3).map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] text-ink-faint"
              >
                <Telescope size={11} style={{ color: metaColor }} />
                <span className="truncate">{s.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (node.type === "project") {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 text-[12px] text-ink-muted">
        <p className="line-clamp-3">{node.content}</p>
      </div>
    );
  }

  // note, ai, fallback
  return (
    <div className="min-h-0 flex-1 overflow-hidden px-3 pb-2 text-[12px] leading-snug text-ink-muted">
      <MarkdownLite text={node.content} />
    </div>
  );
}
