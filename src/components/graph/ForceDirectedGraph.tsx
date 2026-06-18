'use client';

import { useEffect, useRef, useState } from 'react';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface Edge {
  from: string;
  to: string;
  type: string;
}

interface ForceDirectedGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
  width?: number;
  height?: number;
}

export function ForceDirectedGraph({
  nodes,
  edges,
  onNodeClick,
  width = 800,
  height = 600,
}: ForceDirectedGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [simulation, setSimulation] = useState<{
    nodes: Array<Node & { vx: number; vy: number }>;
    edges: Edge[];
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    // Initialize simulation
    const simNodes = nodes.map(n => ({
      ...n,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
    }));

    setSimulation({ nodes: simNodes, edges });

    // Animation loop
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let iterations = 0;
    const maxIterations = 300;

    const animate = () => {
      if (!simulation) return;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Apply forces
      const alpha = Math.max(0.01, 1 - iterations / maxIterations);
      
      for (let i = 0; i < simNodes.length; i++) {
        const node = simNodes[i];
        let fx = 0;
        let fy = 0;

        // Repulsive forces from other nodes
        for (let j = 0; j < simNodes.length; j++) {
          if (i === j) continue;
          const other = simNodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 50 / (dist * dist);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }

        // Attractive forces from edges
        for (const edge of edges) {
          if (edge.from === node.id) {
            const target = simNodes.find(n => n.id === edge.to);
            if (target) {
              const dx = target.x - node.x;
              const dy = target.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = dist * 0.1;
              fx += (dx / dist) * force;
              fy += (dy / dist) * force;
            }
          }
        }

        // Update velocity and position
        node.vx = (node.vx + fx * alpha) * 0.9;
        node.vy = (node.vy + fy * alpha) * 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Boundary conditions
        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      }

      // Draw edges
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      for (const edge of edges) {
        const from = simNodes.find(n => n.id === edge.from);
        const to = simNodes.find(n => n.id === edge.to);
        if (from && to) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const node of simNodes) {
        ctx.fillStyle = '#0066cc';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#000000';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label.slice(0, 10), node.x, node.y + 15);
      }

      iterations++;
      if (iterations < maxIterations) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [nodes, edges, width, height]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!simulation || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    for (const node of simulation.nodes) {
      const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (dist < 10) {
        onNodeClick?.(node.id);
        break;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleCanvasClick}
      className="border border-border rounded bg-white cursor-pointer"
    />
  );
}
