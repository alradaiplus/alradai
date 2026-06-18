'use client';

import { useRef, useState } from 'react';
import { BoardNode } from '@/src/core/boards/types';

interface DraggableNodeProps {
  node: BoardNode;
  blockTitle: string;
  onDragEnd: (nodeId: string, x: number, y: number) => void;
  onClick?: (nodeId: string) => void;
  selected?: boolean;
}

export function DraggableNode({
  node,
  blockTitle,
  onDragEnd,
  onClick,
  selected,
}: DraggableNodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    
    setIsDragging(true);
    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !nodeRef.current) return;

    const parent = nodeRef.current.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const newX = e.clientX - parentRect.left - dragOffset.x;
    const newY = e.clientY - parentRect.top - dragOffset.y;

    nodeRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setIsDragging(false);

    const parent = nodeRef.current?.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const newX = e.clientX - parentRect.left - dragOffset.x;
    const newY = e.clientY - parentRect.top - dragOffset.y;

    onDragEnd(node.id, newX, newY);
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute p-3 rounded border-2 cursor-move transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-300 bg-white hover:shadow-md'
      } ${isDragging ? 'shadow-xl' : ''}`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: '200px',
        minHeight: '60px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={(e) => isDragging && handleMouseUp(e)}
      onClick={() => onClick?.(node.id)}
    >
      <div className="text-sm font-semibold text-gray-900 truncate">
        {blockTitle || 'Untitled'}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        ID: {node.id.slice(0, 8)}
      </div>
      {node.cluster && (
        <div className="text-xs text-gray-600 mt-1 bg-gray-100 px-2 py-1 rounded inline-block">
          {node.cluster}
        </div>
      )}
    </div>
  );
}
