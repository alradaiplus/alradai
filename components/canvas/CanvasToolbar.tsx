"use client";

import { createShapeId, track, useEditor } from "tldraw";
import { useStore } from "@/lib/store";
import {
  MousePointer2,
  Hand,
  FileText,
  CircleCheck,
  FolderKanban,
  Image as ImageIcon,
  Mic,
  Telescope,
  Plus,
  Minus,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeType } from "@/lib/types";

/**
 * Floating canvas toolbar: select/hand tool toggle (critical for touch), quick
 * create for the core node types, and zoom controls. The remaining types
 * (PDF, link, AI) are one ⌘K away.
 */
export const CanvasToolbar = track(function CanvasToolbar() {
  const editor = useEditor();
  const addNode = useStore((s) => s.addNode);
  const tool = editor.getCurrentToolId();

  const DEFAULTS: Partial<
    Record<NodeType, { title: string; content?: string; src?: string }>
  > = {
    note: { title: "New note", content: "Start writing…" },
    task: { title: "New task", content: "" },
    project: { title: "New project", content: "" },
    image: {
      title: "New image",
      src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=70",
    },
    voice: { title: "Voice note", content: "Transcript…" },
    research: { title: "Research question", content: "" },
  };

  const addAt = (type: NodeType) => {
    const center = editor.getViewportPageBounds().center;
    const d = DEFAULTS[type] ?? { title: "New node" };
    const node = addNode({
      type,
      title: d.title,
      content: d.content ?? "",
      src: d.src,
      x: center.x,
      y: center.y,
    });
    // Re-center on the actual size, then select after StoreSync makes the shape.
    requestAnimationFrame(() => {
      const id = createShapeId(node.id);
      const shape = editor.getShape(id);
      if (shape) {
        editor.updateShape({
          id,
          type: "node",
          x: center.x - node.w / 2,
          y: center.y - node.h / 2,
        });
        editor.select(id);
      }
    });
  };

  const btn =
    "flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-canvas-hover hover:text-ink";

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-[300] flex max-w-[92vw] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-canvas-border bg-canvas-panel/95 p-1.5 shadow-panel backdrop-blur">
      <button
        title="Select"
        className={cn(btn, tool === "select" && "bg-accent-soft text-accent-hover")}
        onClick={() => editor.setCurrentTool("select")}
      >
        <MousePointer2 size={17} />
      </button>
      <button
        title="Pan / Hand"
        className={cn(btn, tool === "hand" && "bg-accent-soft text-accent-hover")}
        onClick={() => editor.setCurrentTool("hand")}
      >
        <Hand size={17} />
      </button>

      <span className="mx-1 h-5 w-px bg-canvas-border" />

      <button title="Add note" className={btn} onClick={() => addAt("note")}>
        <FileText size={17} />
      </button>
      <button title="Add task" className={btn} onClick={() => addAt("task")}>
        <CircleCheck size={17} />
      </button>
      <button title="Add project" className={btn} onClick={() => addAt("project")}>
        <FolderKanban size={17} />
      </button>
      <button title="Add image" className={btn} onClick={() => addAt("image")}>
        <ImageIcon size={17} />
      </button>
      <button title="Add voice note" className={btn} onClick={() => addAt("voice")}>
        <Mic size={17} />
      </button>
      <button title="Add research" className={btn} onClick={() => addAt("research")}>
        <Telescope size={17} />
      </button>

      <span className="mx-1 h-5 w-px bg-canvas-border" />

      <button title="Zoom out" className={btn} onClick={() => editor.zoomOut()}>
        <Minus size={17} />
      </button>
      <button title="Zoom in" className={btn} onClick={() => editor.zoomIn()}>
        <Plus size={17} />
      </button>
      <button title="Zoom to fit" className={btn} onClick={() => editor.zoomToFit()}>
        <Maximize size={16} />
      </button>
    </div>
  );
});
