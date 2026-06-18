"use client";

import { createShapeId, track, useEditor } from "tldraw";
import { useStore } from "@/lib/store";
import {
  MousePointer2,
  Hand,
  FileText,
  Image as ImageIcon,
  Link2,
  Plus,
  Minus,
  Maximize,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeType } from "@/lib/types";

/**
 * Floating canvas toolbar: select/hand tool toggle (critical for touch),
 * quick add-node actions, and zoom controls.
 */
export const CanvasToolbar = track(function CanvasToolbar() {
  const editor = useEditor();
  const addNode = useStore((s) => s.addNode);
  const tool = editor.getCurrentToolId();

  const addAt = (type: NodeType) => {
    const center = editor.getViewportPageBounds().center;
    const w = type === "image" ? 220 : 240;
    const h = type === "image" ? 160 : 150;
    const node = addNode({
      type,
      title:
        type === "note" ? "New note" : type === "image" ? "New image" : "New link",
      content: type === "note" ? "Start writing…" : "",
      src:
        type === "image"
          ? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=70"
          : type === "link"
          ? "https://"
          : undefined,
      x: center.x - w / 2,
      y: center.y - h / 2,
      w,
      h,
      color: "#7c6cf6",
    });
    // Select after StoreSync creates the shape.
    requestAnimationFrame(() => {
      const id = createShapeId(node.id);
      if (editor.getShape(id)) editor.select(id);
    });
  };

  const btn =
    "flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-canvas-hover hover:text-ink";

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-canvas-border bg-canvas-panel/95 p-1.5 shadow-panel backdrop-blur">
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
      <button title="Add image" className={btn} onClick={() => addAt("image")}>
        <ImageIcon size={17} />
      </button>
      <button title="Add link" className={btn} onClick={() => addAt("link")}>
        <Link2 size={17} />
      </button>

      <span className="mx-1 h-5 w-px bg-canvas-border" />

      <button title="Zoom out" className={btn} onClick={() => editor.zoomOut()}>
        <Minus size={17} />
      </button>
      <button title="Zoom in" className={btn} onClick={() => editor.zoomIn()}>
        <Plus size={17} />
      </button>
      <button
        title="Zoom to fit"
        className={btn}
        onClick={() => editor.zoomToFit()}
      >
        <Maximize size={16} />
      </button>
    </div>
  );
});
