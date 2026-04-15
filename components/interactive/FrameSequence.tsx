'use client';

import { useEffect, useRef, useState } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

import PlaceholderHand from '@/components/interactive/PlaceholderHand';

const TOTAL_FRAMES = 30;

type Props = {
  /**
   * Base path where frames live. Files must be named
   * `frame-001.jpg` .. `frame-030.jpg`.
   */
  basePath?: string;
  /** Total number of frames. Override if Ahmed's export differs. */
  totalFrames?: number;
  /** Height of the scroll scrubber, expressed in vh. Default 300. */
  scrubHeightVh?: number;
};

/**
 * Scroll-driven frame sequence, Apple-style.
 *
 * Loads N frames upfront, pins a canvas while the user scrolls,
 * and redraws the current frame as `scrollYProgress` advances.
 * Falls back to an animated SVG placeholder when no frames are present.
 */
export default function FrameSequence({
  basePath = '/frames',
  totalFrames = TOTAL_FRAMES,
  scrubHeightVh = 300,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [framesReady, setFramesReady] = useState(false);
  const [framesMissing, setFramesMissing] = useState(false);

  // Preload all frames on mount. If the first frame 404s, fall through to
  // the placeholder hand so the page still works before Ahmed's export.
  useEffect(() => {
    let cancelled = false;

    const probe = new Image();
    probe.src = `${basePath}/frame-001.jpg`;
    probe.onload = () => {
      if (cancelled) return;
      const loaded: HTMLImageElement[] = new Array(totalFrames);
      let completed = 0;

      for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        img.src = `${basePath}/frame-${String(i).padStart(3, '0')}.jpg`;
        img.onload = () => {
          completed += 1;
          if (completed === totalFrames && !cancelled) {
            setFramesReady(true);
          }
        };
        img.onerror = () => {
          if (!cancelled) setFramesMissing(true);
        };
        loaded[i - 1] = img;
      }
      imagesRef.current = loaded;
    };
    probe.onerror = () => {
      if (!cancelled) setFramesMissing(true);
    };

    return () => {
      cancelled = true;
    };
  }, [basePath, totalFrames]);

  // First frame draw after canvas mounts
  useEffect(() => {
    if (framesReady && !framesMissing) drawFrame(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [framesReady, framesMissing]);

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imagesRef.current[index];
    if (!canvas || !ctx || !img || !img.complete) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = canvas.clientWidth;
    const targetH = canvas.clientHeight;
    if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
      canvas.width = targetW * dpr;
      canvas.height = targetH * dpr;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, targetW, targetH);

    // contain-cover fit
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.min(targetW / iw, targetH / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = (targetW - w) / 2;
    const y = (targetH - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  };

  // Map scroll progress → current frame index
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [0, totalFrames - 1]);

  useMotionValueEvent(frameIndex, 'change', (latest) => {
    if (!framesReady) return;
    const idx = Math.min(totalFrames - 1, Math.max(0, Math.round(latest)));
    drawFrame(idx);
  });

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: `${scrubHeightVh}vh` }}
      id="top"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center">
        {framesReady && !framesMissing ? (
          <canvas
            ref={canvasRef}
            className="h-full w-full max-w-[min(1200px,92vw)] object-contain"
            aria-hidden
          />
        ) : (
          <PlaceholderHand scrollYProgress={scrollYProgress} />
        )}
      </div>
    </div>
  );
}
