'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Full-screen preloader that dissolves once the page is interactive.
 *
 * Uses CSS-only SVG animation for the initial logo draw (zero JS required
 * before hydration). Framer Motion handles the exit transition.
 */
export default function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dismiss = () => setTimeout(() => setVisible(false), 500);

    if (document.readyState === 'complete') {
      dismiss();
    } else {
      window.addEventListener('load', dismiss, { once: true });
      return () => window.removeEventListener('load', dismiss);
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-ink"
          aria-hidden
        >
          {/* Background glow */}
          <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-gold-500/[8%] blur-[100px] animate-pulse-soft" />

          {/* Animated logo mark */}
          <svg
            viewBox="0 0 48 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative h-14 w-12"
          >
            <style>{`
              .pl { stroke-dasharray: 40; stroke-dashoffset: 40;
                    animation: pl-draw 0.45s ease forwards; }
              .pl1 { animation-delay: 0.05s; }
              .pl2 { animation-delay: 0.22s; }
              .pl3 { animation-delay: 0.39s; }
              .pd  { r: 0; fill: #D4A843;
                    animation: pd-pop 0.25s ease 0.58s forwards; }
              @keyframes pl-draw { to { stroke-dashoffset: 0; } }
              @keyframes pd-pop  { to { r: 4; } }
            `}</style>

            {/* Layer bars — bottom to top */}
            <line className="pl pl1"
              x1="4" y1="44" x2="44" y2="44"
              stroke="#D4A843" strokeWidth="5.5" strokeLinecap="round" />
            <line className="pl pl2"
              x1="8" y1="32" x2="40" y2="32"
              stroke="#D4A843" strokeWidth="5.5" strokeLinecap="round"
              opacity="0.7" />
            <line className="pl pl3"
              x1="13" y1="20" x2="35" y2="20"
              stroke="#D4A843" strokeWidth="5.5" strokeLinecap="round"
              opacity="0.45" />

            {/* Nozzle dot */}
            <circle className="pd" cx="24" cy="8" r="0" />
          </svg>

          {/* Word-mark */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="font-space text-[10px] tracking-[0.38em] text-gold-500/60"
          >
            PYB3DCP
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
