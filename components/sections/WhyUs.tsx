'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Cpu, PenTool, Zap } from 'lucide-react';

type Item = { title: string; body: string };

const ICONS = [Cpu, PenTool, Zap];

export default function WhyUs() {
  const t = useTranslations('whyUs');
  const items = t.raw('items') as Item[];

  return (
    <section id="why" className="section-shell">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="eyebrow justify-center">{t('eyebrow')}</p>
        <h2 className="display mt-4 text-balance text-white">{t('title')}</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item, i) => {
          const Icon = ICONS[i] ?? Cpu;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                delay: i * 0.12,
                duration: 0.7,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className="glass glass-hover group relative overflow-hidden p-8"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold-500/10 blur-2xl transition-opacity duration-500 group-hover:opacity-80" />

              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-500/40 bg-gold-500/10 text-gold-400">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-6 text-xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">
                {item.body}
              </p>

              <div className="mt-6 h-px w-0 bg-gradient-to-r from-gold-500 to-transparent transition-all duration-500 group-hover:w-full" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
