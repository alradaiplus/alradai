"use client";

import dynamic from "next/dynamic";

// tldraw is strictly client-side.
const Canvas = dynamic(
  () => import("@/components/canvas/Canvas").then((m) => m.Canvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-canvas-bg text-ink-faint">
        Loading canvas…
      </div>
    ),
  }
);

export default function CanvasPage() {
  return <Canvas />;
}
