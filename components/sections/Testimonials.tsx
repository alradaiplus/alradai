'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  rating: number;
};

export default function Testimonials() {
  const t = useTranslations('testimonials');
  const items = t.raw('items') as Testimonial[];

  return (
    <section className="section-shell">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="eyebrow justify-center">{t('eyebrow')}</p>
        <h2 className="display mt-4 text-balance text-white">{t('title')}</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((it, i) => (
          <motion.figure
            key={it.name}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{
              delay: i * 0.12,
              duration: 0.7,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            className="glass glass-hover group relative overflow-hidden p-8"
          >
            {/* Gold right edge (flips for RTL) */}
            <span className="absolute inset-y-6 right-0 w-px bg-gradient-to-b from-transparent via-gold-500/60 to-transparent rtl:left-0 rtl:right-auto" />

            <svg
              viewBox="0 0 64 64"
              className="absolute right-6 top-6 h-12 w-12 text-gold-500/25 rtl:left-6 rtl:right-auto"
              aria-hidden
            >
              <text
                x="0"
                y="52"
                fontFamily="serif"
                fontSize="80"
                fontWeight="700"
                fill="currentColor"
              >
                ❝
              </text>
            </svg>

            <div className="flex gap-0.5">
              {Array.from({ length: it.rating }).map((_, s) => (
                <Star
                  key={s}
                  className="h-4 w-4 fill-gold-500 text-gold-500"
                />
              ))}
            </div>

            <blockquote className="relative mt-5 text-pretty text-base leading-relaxed text-white/80">
              {it.quote}
            </blockquote>

            <figcaption className="mt-6 flex items-center gap-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/40 bg-gold-500/10 font-space text-sm font-semibold text-gold-300">
                {it.name.slice(0, 1)}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{it.name}</p>
                <p className="text-xs text-white/50">{it.role}</p>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
