'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';

/**
 * SVG placeholder for Ahmed's robotic hand — a minimal schematic that still
 * responds to scroll progress so the page functions before the frame export
 * lands in /public/frames.
 *
 * When the real JPG sequence is dropped in, FrameSequence automatically
 * switches over and this component stops rendering.
 */
export default function PlaceholderHand({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 22]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1.06]);
  const fingerFlex = useTransform(scrollYProgress, [0, 1], [0, 28]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.35, 0.7, 0.4]);

  return (
    <div className="relative flex h-full w-full max-w-[min(980px,92vw)] items-center justify-center">
      <motion.div
        style={{ opacity: glow }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-500/15 blur-[120px]" />
      </motion.div>

      <motion.svg
        viewBox="0 0 600 600"
        className="relative h-full w-full"
        style={{ rotate, scale }}
        aria-hidden
      >
        <defs>
          <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5E9C2" />
            <stop offset="45%" stopColor="#D4A843" />
            <stop offset="100%" stopColor="#6B4F15" />
          </linearGradient>
          <linearGradient id="metalSoft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#0e0e0e" />
          </linearGradient>
          <filter id="innerShadow">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Wrist */}
        <rect
          x="220"
          y="400"
          width="160"
          height="140"
          rx="20"
          fill="url(#metalSoft)"
          stroke="url(#metal)"
          strokeWidth="2"
        />
        <rect
          x="236"
          y="416"
          width="128"
          height="10"
          rx="4"
          fill="url(#metal)"
          opacity="0.85"
        />
        <rect
          x="236"
          y="436"
          width="128"
          height="4"
          rx="2"
          fill="url(#metal)"
          opacity="0.5"
        />
        <rect
          x="236"
          y="448"
          width="128"
          height="4"
          rx="2"
          fill="url(#metal)"
          opacity="0.35"
        />

        {/* Palm */}
        <path
          d="M200 280 Q200 200 260 180 Q310 170 360 185 Q410 200 420 260 L420 400 Q420 420 400 420 L220 420 Q200 420 200 400 Z"
          fill="url(#metalSoft)"
          stroke="url(#metal)"
          strokeWidth="2.2"
          filter="url(#innerShadow)"
        />
        <circle cx="310" cy="310" r="22" fill="#111" stroke="url(#metal)" strokeWidth="2" />
        <circle cx="310" cy="310" r="10" fill="url(#metal)" />
        <circle cx="310" cy="310" r="3" fill="#0a0a0a" />

        {/* Fingers — joints flex on scroll */}
        <motion.g
          style={{ rotate: fingerFlex, transformOrigin: '250px 220px' }}
        >
          <rect x="232" y="110" width="36" height="120" rx="10" fill="url(#metalSoft)" stroke="url(#metal)" strokeWidth="2" />
          <line x1="232" y1="145" x2="268" y2="145" stroke="url(#metal)" strokeWidth="1.6" opacity="0.7" />
          <line x1="232" y1="180" x2="268" y2="180" stroke="url(#metal)" strokeWidth="1.6" opacity="0.7" />
        </motion.g>

        <motion.g
          style={{ rotate: fingerFlex, transformOrigin: '310px 220px' }}
        >
          <rect x="292" y="80" width="36" height="150" rx="10" fill="url(#metalSoft)" stroke="url(#metal)" strokeWidth="2" />
          <line x1="292" y1="120" x2="328" y2="120" stroke="url(#metal)" strokeWidth="1.6" opacity="0.7" />
          <line x1="292" y1="160" x2="328" y2="160" stroke="url(#metal)" strokeWidth="1.6" opacity="0.7" />
          <line x1="292" y1="200" x2="328" y2="200" stroke="url(#metal)" strokeWidth="1.6" opacity="0.7" />
        </motion.g>

        <motion.g
          style={{ rotate: fingerFlex, transformOrigin: '370px 220px' }}
        >
          <rect x="352" y="100" width="36" height="130" rx="10" fill="url(#metalSoft)" stroke="url(#metal)" strokeWidth="2" />
          <line x1="352" y1="140" x2="388" y2="140" stroke="url(#metal)" strokeWidth="1.6" opacity="0.7" />
          <line x1="352" y1="175" x2="388" y2="175" stroke="url(#metal)" strokeWidth="1.6" opacity="0.7" />
        </motion.g>

        <motion.g
          style={{ rotate: fingerFlex, transformOrigin: '425px 230px' }}
        >
          <rect x="410" y="130" width="32" height="100" rx="9" fill="url(#metalSoft)" stroke="url(#metal)" strokeWidth="2" />
          <line x1="410" y1="165" x2="442" y2="165" stroke="url(#metal)" strokeWidth="1.6" opacity="0.7" />
        </motion.g>

        {/* Thumb */}
        <motion.g
          style={{ rotate: fingerFlex, transformOrigin: '190px 290px' }}
        >
          <path
            d="M170 260 Q150 260 148 290 Q148 320 180 332 Q200 336 210 320 L200 260 Z"
            fill="url(#metalSoft)"
            stroke="url(#metal)"
            strokeWidth="2"
          />
        </motion.g>
      </motion.svg>
    </div>
  );
}
