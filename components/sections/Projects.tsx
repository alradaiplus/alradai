'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';

type Project = {
  title: string;
  location: string;
  category: string;
};

export default function Projects() {
  const t = useTranslations('projects');
  const items = t.raw('items') as Project[];
  const railRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const parallax = useTransform(scrollYProgress, [0, 1], [40, -40]);

  const scrollBy = (dir: 1 | -1) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({
      left: dir * railRef.current.clientWidth * 0.8,
      behavior: 'smooth',
    });
  };

  const onScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    const cardWidth = rail.scrollWidth / Math.max(items.length, 1);
    const idx = Math.round(rail.scrollLeft / cardWidth);
    setActiveIdx(Math.min(items.length - 1, Math.max(0, idx)));
  };

  return (
    <section id="projects" ref={sectionRef} className="section-shell">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 className="display mt-4 max-w-[14ch] text-balance text-white">
            {t('title')}
          </h2>
          <p className="mt-3 max-w-[56ch] text-sm text-white/60 sm:text-base">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-gold-500/50 hover:text-gold-300"
            aria-label="Previous"
          >
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-gold-500/50 hover:text-gold-300"
            aria-label="Next"
          >
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        onScroll={onScroll}
        className="no-scrollbar mask-fade-edges -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4"
      >
        {items.map((p, i) => (
          <motion.article
            key={p.title}
            style={{ y: parallax }}
            className="glass glass-hover group relative w-[78%] shrink-0 snap-center overflow-hidden sm:w-[52%] lg:w-[34%]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <ProjectArt index={i} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
              <span className="absolute right-4 top-4 rounded-full border border-gold-500/40 bg-ink/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold-300 backdrop-blur rtl:left-4 rtl:right-auto">
                {p.category}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-white/50">
                  {p.location}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-white">
                  {p.title}
                </h3>
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-gold-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  {t('comingSoon')}
                </p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {items.map((_, i) => (
          <span
            key={i}
            className={[
              'h-1.5 rounded-full transition-all duration-500',
              i === activeIdx ? 'w-8 bg-gold-500' : 'w-1.5 bg-white/15',
            ].join(' ')}
          />
        ))}
      </div>
    </section>
  );
}

function ProjectArt({ index }: { index: number }) {
  // Deterministic gold-tinted abstract fill per card — used as a placeholder
  // until real project photography lands from the client.
  const hues = [
    'from-gold-900 via-ink to-black',
    'from-[#2a1d07] via-ink to-black',
    'from-[#1a1205] via-ink to-black',
    'from-[#3a2a0c] via-ink to-black',
    'from-[#22180a] via-ink to-black',
    'from-[#2e2008] via-ink to-black',
  ];
  return (
    <div
      className={`absolute inset-0 bg-gradient-to-br ${hues[index % hues.length]}`}
    >
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full opacity-60 mix-blend-screen"
      >
        <defs>
          <linearGradient id={`pg-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#D4A843" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D4A843" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x={40 + i * 12}
            y={80 + i * 14}
            width={260 - i * 12}
            height={8}
            rx={2}
            fill={`url(#pg-${index})`}
            stroke="rgba(212,168,67,0.35)"
            strokeWidth="0.5"
          />
        ))}
        <circle cx="200" cy="240" r="3" fill="#D4A843" />
      </svg>
    </div>
  );
}
