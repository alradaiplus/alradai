"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Tldraw,
  createShapeId,
  track,
  useEditor,
  type Editor,
  type TLComponents,
  type TLUiOverrides,
} from "tldraw";
import "tldraw/tldraw.css";
import { NodeShapeUtil, type NodeShape } from "./NodeShapeUtil";
import { Edges } from "./Edges";
import { useStore } from "@/lib/store";
import { CanvasToolbar } from "./CanvasToolbar";

const customShapeUtils = [NodeShapeUtil];

// Hide most of tldraw's default chrome — Notes Canvas provides its own.
const components: TLComponents = {
  OnTheCanvas: Edges,
  Toolbar: null,
  PageMenu: null,
  MainMenu: null,
  StylePanel: null,
  NavigationPanel: null,
  HelpMenu: null,
  DebugPanel: null,
  ZoomMenu: null,
  QuickActions: null,
  ActionsMenu: null,
};

const overrides: TLUiOverrides = {};

/** Ensures the canvas has exactly one tldraw shape per semantic node. */
const StoreSync = track(function StoreSync() {
  const editor = useEditor();
  const allNodes = useStore((s) => s.nodes);
  const currentBoardId = useStore((s) => s.currentBoardId);
  const lastBoard = useRef<string | null>(null);

  const nodes = allNodes.filter((n) => n.boardId === currentBoardId);

  useEffect(() => {
    const boardChanged = lastBoard.current !== currentBoardId;
    lastBoard.current = currentBoardId;

    const existing = new Set(
      editor
        .getCurrentPageShapes()
        .filter((s) => s.type === "node")
        .map((s) => (s as NodeShape).props.nodeId)
    );

    const wanted = new Set(nodes.map((n) => n.id));

    // Create shapes for new nodes on this board.
    const toCreate = nodes
      .filter((n) => !existing.has(n.id))
      .map((n) => ({
        id: createShapeId(n.id),
        type: "node" as const,
        x: n.x,
        y: n.y,
        props: { w: n.w, h: n.h, nodeId: n.id, nodeType: n.type },
      }));
    if (toCreate.length) editor.createShapes(toCreate);

    // Remove shapes whose node was deleted or belongs to another board.
    const toDelete = editor
      .getCurrentPageShapes()
      .filter((s) => s.type === "node" && !wanted.has((s as NodeShape).props.nodeId))
      .map((s) => s.id);
    if (toDelete.length) editor.deleteShapes(toDelete);

    if (boardChanged) {
      requestAnimationFrame(() => {
        if (editor.getCurrentPageShapes().length)
          editor.zoomToFit({ animation: { duration: 200 } });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, allNodes, currentBoardId]);

  return null;
});

/** Two-way selection + geometry sync between tldraw and the semantic store. */
const Bridge = track(function Bridge() {
  const editor = useEditor();
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const updateNode = useStore((s) => s.updateNode);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // tldraw selection → store
  const only = editor.getOnlySelectedShape();
  const onlyNodeId =
    only && only.type === "node" ? (only as NodeShape).props.nodeId : null;
  useEffect(() => {
    if (onlyNodeId !== selectedId) select(onlyNodeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyNodeId]);

  // store selection (from graph/command) → tldraw
  useEffect(() => {
    if (!selectedId) return;
    const id = createShapeId(selectedId);
    if (editor.getShape(id) && editor.getOnlySelectedShape()?.id !== id) {
      editor.select(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // tldraw geometry → store (debounced)
  useEffect(() => {
    const unsub = editor.store.listen(
      () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          for (const s of editor.getCurrentPageShapes()) {
            if (s.type !== "node") continue;
            const shape = s as NodeShape;
            updateNode(shape.props.nodeId, {
              x: shape.x,
              y: shape.y,
              w: shape.props.w,
              h: shape.props.h,
            });
          }
        }, 600);
      },
      { source: "user", scope: "document" }
    );
    return () => unsub();
  }, [editor, updateNode]);

  return null;
});

export function Canvas() {
  const handleMount = useCallback((editor: Editor) => {
    try {
      editor.user.updateUserPreferences({ colorScheme: "dark" });
    } catch {
      /* ignore — older tldraw prefs shape */
    }
    editor.updateInstanceState({ isGridMode: true });
    // Frame the seeded content.
    requestAnimationFrame(() => {
      if (editor.getCurrentPageShapes().length) {
        editor.zoomToFit({ animation: { duration: 0 } });
        editor.resetZoom();
        editor.zoomToFit();
      }
    });
  }, []);

  return (
    <div className="relative h-full w-full">
      <Tldraw
        shapeUtils={customShapeUtils}
        components={components}
        overrides={overrides}
        onMount={handleMount}
        hideUi={false}
      >
        <StoreSync />
        <Bridge />
        <CanvasToolbar />
      </Tldraw>
    </div>
  );
}
