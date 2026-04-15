'use client';

import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles } from 'lucide-react';

type Value = { title: string; body: string };

export default function About() {
  const t = useTranslations('about');
  const values = t.raw('values.items') as Value[];

  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ['start end', 'end start'],
  });
  const layerFill = useTransform(scrollYProgress, [0.1, 0.7], [0, 6]);

  return (
    <section id="about" className="section-shell">
      <div className="glass p-8 sm:p-12">
        <div ref={wrapperRef} className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          {/* LEFT: Printer SVG that fills with layers as you scroll */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.9 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative aspect-square w-full max-w-sm">
              <div className="absolute inset-0 rounded-3xl bg-gold-500/5 blur-3xl" />
              <PrinterSvg layerFill={layerFill} />
            </div>
          </motion.div>

          {/* RIGHT: Copy */}
          <div>
            <p className="eyebrow">{t('eyebrow')}</p>
            <h2 className="display mt-4 text-balance text-white">
              {t('title')}
            </h2>
            <p className="mt-6 max-w-[60ch] text-pretty text-white/70">
              {t('intro')}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gold-900/60 bg-white/[0.02] p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gold-400">
                  <Sparkles className="h-4 w-4" />
                  {t('mission.title')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {t('mission.body')}
                </p>
              </div>
              <div className="rounded-2xl border border-gold-900/60 bg-white/[0.02] p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gold-400">
                  <Sparkles className="h-4 w-4" />
                  {t('vision.title')}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {t('vision.body')}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
                {t('values.title')}
              </h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {values.map((v, i) => (
                  <motion.li
                    key={v.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="flex gap-3 text-sm"
                  >
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    <div>
                      <p className="font-medium text-white">{v.title}</p>
                      <p className="text-white/55">{v.body}</p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrinterSvg({ layerFill }: { layerFill: MotionValue<number> }) {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="printMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5E9C2" />
          <stop offset="50%" stopColor="#D4A843" />
          <stop offset="100%" stopColor="#8E691F" />
        </linearGradient>
      </defs>

      {/* Frame rails */}
      <rect x="60" y="60" width="280" height="280" rx="6" fill="none" stroke="url(#printMetal)" strokeWidth="2" opacity="0.55" />
      <rect x="60" y="60" width="280" height="12" fill="url(#printMetal)" opacity="0.7" />
      <rect x="60" y="328" width="280" height="12" fill="url(#printMetal)" opacity="0.7" />

      {/* Z-axis guide */}
      <line x1="200" y1="72" x2="200" y2="328" stroke="url(#printMetal)" strokeWidth="1.5" opacity="0.4" strokeDasharray="3 3" />

      {/* Nozzle */}
      <g>
        <rect x="180" y="78" width="40" height="18" rx="3" fill="#1a1a1a" stroke="url(#printMetal)" strokeWidth="1.5" />
        <polygon points="190,96 210,96 205,108 195,108" fill="url(#printMetal)" />
      </g>

      {/* Build plate */}
      <rect x="110" y="300" width="180" height="8" rx="2" fill="url(#printMetal)" opacity="0.8" />

      {/* Layers — revealed as you scroll */}
      {Array.from({ length: 6 }).map((_, i) => (
        <PrinterLayer key={i} index={i} layerFill={layerFill} />
      ))}
    </svg>
  );
}

function PrinterLayer({
  index,
  layerFill,
}: {
  index: number;
  layerFill: MotionValue<number>;
}) {
  const y = 292 - index * 14;
  const opacity = useTransform(layerFill, (v) => (v > index ? 0.85 : 0));
  const scaleX = useTransform(layerFill, (v) =>
    v > index ? 1 : v > index - 0.5 ? 0.5 : 0
  );
  return (
    <motion.rect
      x="120"
      y={y}
      width="160"
      height="10"
      rx="2"
      fill="url(#printMetal)"
      style={{ opacity, scaleX, transformOrigin: '200px 292px' }}
    />
  );
}
