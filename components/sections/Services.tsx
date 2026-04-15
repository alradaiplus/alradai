'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Layers, Ruler, HardHat, Wrench, ArrowRight } from 'lucide-react';

type Service = {
  id: string;
  title: string;
  body: string;
};

const ICONS = [Layers, Ruler, HardHat, Wrench];
// Bento layout — 2 large cards, 2 regular, grid-arranged
const SPANS = [
  'md:col-span-2 md:row-span-1',
  'md:col-span-1 md:row-span-1',
  'md:col-span-1 md:row-span-1',
  'md:col-span-2 md:row-span-1',
];

export default function Services() {
  const t = useTranslations('services');
  const items = t.raw('items') as Service[];
  const [active, setActive] = useState<string | null>(null);
  const activeItem = items.find((s) => s.id === active) ?? null;
  const ActiveIcon =
    active !== null
      ? ICONS[items.findIndex((s) => s.id === active)] ?? Layers
      : Layers;

  return (
    <section id="services" className="section-shell">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="eyebrow justify-center">{t('eyebrow')}</p>
        <h2 className="display mt-4 text-balance text-white">{t('title')}</h2>
        <p className="mx-auto mt-4 max-w-[56ch] text-pretty text-white/65">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid auto-rows-[minmax(220px,1fr)] grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((service, i) => {
          const Icon = ICONS[i] ?? Layers;
          return (
            <motion.button
              type="button"
              key={service.id}
              layoutId={`service-${service.id}`}
              onClick={() => setActive(service.id)}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                delay: i * 0.08,
                duration: 0.7,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className={[
                'glass glass-hover group relative overflow-hidden p-6 text-start sm:p-8',
                SPANS[i] ?? '',
              ].join(' ')}
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-500/40 bg-gold-500/10 text-gold-400">
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className="font-space text-xs tracking-[0.2em] text-gold-500/80"
                  dir="ltr"
                >
                  {service.id}
                </span>
              </div>

              <h3 className="relative mt-6 text-xl font-semibold text-white">
                {service.title}
              </h3>
              <p className="relative mt-3 line-clamp-3 text-sm leading-relaxed text-white/60">
                {service.body}
              </p>

              <span className="relative mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400">
                {t('eyebrow')}
                <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center p-5"
            onClick={() => setActive(null)}
          >
            <div className="absolute inset-0 bg-ink/80 backdrop-blur-xl" />
            <motion.div
              layoutId={`service-${activeItem.id}`}
              onClick={(e) => e.stopPropagation()}
              className="glass relative z-10 w-full max-w-2xl p-8 sm:p-10"
            >
              <button
                type="button"
                onClick={() => setActive(null)}
                className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-gold-500/50 hover:text-gold-300 rtl:left-5 rtl:right-auto"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-500/40 bg-gold-500/10 text-gold-400">
                <ActiveIcon className="h-6 w-6" />
              </div>
              <span
                className="mt-6 block font-space text-xs tracking-[0.22em] text-gold-500/80"
                dir="ltr"
              >
                {activeItem.id}
              </span>
              <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                {activeItem.title}
              </h3>
              <p className="mt-5 text-pretty leading-relaxed text-white/75">
                {activeItem.body}
              </p>
              <a href="#contact" className="btn-gold mt-8">
                {t('eyebrow')}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
