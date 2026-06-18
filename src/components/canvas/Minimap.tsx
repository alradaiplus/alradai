'use client';

import { useRef, useEffect } from 'react';
import { BoardNode } from '@/src/core/boards/types';

interface MinimapProps {
  nodes: BoardNode[];
  viewportWidth: number;
  viewportHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  onViewportChange?: (x: number, y: number) => void;
}

export function Minimap({
  nodes,
  viewportWidth,
  viewportHeight,
  canvasWidth,
  canvasHeight,
  onViewportChange,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapWidth = 200;
  const minimapHeight = 150;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate scale
    const scaleX = minimapWidth / canvasWidth;
    const scaleY = minimapHeight / canvasHeight;

    // Clear canvas
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, minimapWidth, minimapHeight);

    // Draw border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, minimapWidth, minimapHeight);

    // Draw nodes
    ctx.fillStyle = '#0066cc';
    for (const node of nodes) {
      const x = node.x * scaleX;
      const y = node.y * scaleY;
      const size = 2;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }

    // Draw viewport indicator
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    const vpX = 0 * scaleX;
    const vpY = 0 * scaleY;
    const vpW = viewportWidth * scaleX;
    const vpH = viewportHeight * scaleY;
    ctx.strokeRect(vpX, vpY, vpW, vpH);
  }, [nodes, viewportWidth, viewportHeight, canvasWidth, canvasHeight]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvasWidth / minimapWidth;
    const scaleY = canvasHeight / minimapHeight;

    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    onViewportChange?.(canvasX, canvasY);
  };

  return (
    <div className="border border-border rounded bg-muted p-2">
      <div className="text-xs font-semibold text-muted-foreground mb-2">Minimap</div>
      <canvas
        ref={canvasRef}
        width={minimapWidth}
        height={minimapHeight}
        onClick={handleClick}
        className="border border-border rounded cursor-pointer"
      />
    </div>
  );
}
