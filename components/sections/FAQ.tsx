'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';

type FaqItem = { q: string; a: string };

export default function FAQ() {
  const t = useTranslations('faq');
  const items = t.raw('items') as FaqItem[];
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="section-shell">
      <div className="glass p-8 sm:p-12">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="eyebrow justify-center">{t('eyebrow')}</p>
          <h2 className="display mt-4 text-balance text-white">
            {t('title')}
          </h2>
        </div>

        <ul className="mx-auto max-w-3xl divide-y divide-white/5">
          {items.map((item, i) => {
            const open = openIdx === i;
            return (
              <li key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-5 text-start transition-colors hover:text-gold-300"
                  aria-expanded={open}
                >
                  <span
                    className={[
                      'text-base font-medium transition-colors sm:text-lg',
                      open ? 'text-gold-300' : 'text-white',
                    ].join(' ')}
                  >
                    {item.q}
                  </span>
                  <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                    className={[
                      'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors',
                      open
                        ? 'border-gold-400 bg-gold-500/15 text-gold-300'
                        : 'border-white/10 text-white/70',
                    ].join(' ')}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.45,
                        ease: [0.2, 0.8, 0.2, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-12 text-sm leading-relaxed text-white/65 rtl:pl-12 rtl:pr-0 sm:text-base">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
