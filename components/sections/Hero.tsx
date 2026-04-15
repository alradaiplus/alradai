'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';

import FrameSequence from '@/components/interactive/FrameSequence';
import ParticleField from '@/components/interactive/ParticleField';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="relative isolate">
      {/* Scroll-scrubbed frame sequence — pinned canvas inside */}
      <FrameSequence />

      {/* Fixed text overlay during the scrub */}
      <div className="pointer-events-none absolute inset-0">
        <div className="sticky top-0 flex h-screen items-center justify-center">
          <ParticleField />

          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="eyebrow pointer-events-auto"
            >
              {t('eyebrow')}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
              className="display-lg pointer-events-auto mt-6 max-w-[18ch] text-balance text-white"
            >
              {t('headline')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8 }}
              className="pointer-events-auto mt-6 max-w-[52ch] text-pretty text-base text-white/70 sm:text-lg"
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.8 }}
              className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-4"
            >
              <a href="#contact" className="btn-gold">
                {t('primaryCta')}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </a>
              <a href="#services" className="btn-ghost">
                {t('secondaryCta')}
                <ChevronDown className="h-4 w-4" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 1.4, duration: 1 }}
              className="pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/50"
            >
              <span>{t('scroll')}</span>
              <ChevronDown className="h-4 w-4 animate-scroll-bounce text-gold-500" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
