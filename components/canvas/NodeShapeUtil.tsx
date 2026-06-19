"use client";

import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  T,
  resizeBox,
  type RecordProps,
  type TLBaseShape,
  type TLResizeInfo,
} from "tldraw";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META, type NodeType } from "@/lib/types";
import { NodeCard } from "./NodeCard";

/**
 * A single Notes Canvas node, rendered as an HTML card on the tldraw canvas.
 * The shape carries only geometry + a `nodeId`; the card body reads the
 * semantic node from the shared store, keeping one source of truth.
 */
export type NodeShape = TLBaseShape<
  "node",
  {
    w: number;
    h: number;
    nodeId: string;
    nodeType: NodeType;
  }
>;

export class NodeShapeUtil extends ShapeUtil<NodeShape> {
  static override type = "node" as const;

  static override props: RecordProps<NodeShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    nodeType: T.literalEnum(
      "note",
      "task",
      "project",
      "ai",
      "pdf",
      "image",
      "voice",
      "research",
      "link",
      "folder",
      "video",
      "code",
      "whiteboard",
      "mindmap",
      "bookmark",
      "event",
      "workflow",
      "embed",
      "habit"
    ),
  };

  getDefaultProps(): NodeShape["props"] {
    return { w: 240, h: 150, nodeId: "", nodeType: "note" };
  }

  override canEdit() {
    return true;
  }
  override canResize() {
    return true;
  }
  override isAspectRatioLocked() {
    return false;
  }

  getGeometry(shape: NodeShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: NodeShape, info: TLResizeInfo<NodeShape>) {
    return resizeBox(shape, info);
  }

  component(shape: NodeShape) {
    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: "all",
        }}
      >
        <NodeCard nodeId={shape.props.nodeId} />
      </HTMLContainer>
    );
  }

  indicator(shape: NodeShape) {
    const color = NODE_TYPE_META[shape.props.nodeType]?.color ?? "#f5f5f5";
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={14}
        ry={14}
        fill="none"
        stroke={color}
      />
    );
  }
}

/** Bridge so the card can read live node data. */
export function useNode(nodeId: string) {
  return useStore((s) => s.nodes.find((n) => n.id === nodeId));
}
