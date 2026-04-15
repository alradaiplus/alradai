'use client';

import { useTranslations } from 'next-intl';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type StatItem = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
};

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const motionVal = useMotionValue(0);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionVal, to, {
      duration: 1.8,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(Math.round(v).toString()),
    });
    return () => controls.stop();
  }, [inView, motionVal, to]);

  return <span ref={ref}>{display}</span>;
}

export default function Stats() {
  const t = useTranslations('stats');
  const items = t.raw('items') as StatItem[];

  return (
    <section className="section-shell">
      <div className="glass p-8 sm:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">{t('title')}</p>
          <p className="mt-4 text-sm text-white/60 sm:text-base">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 sm:mt-14 sm:grid-cols-4 sm:gap-8">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                delay: idx * 0.12,
                duration: 0.7,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              className="group relative text-center"
            >
              <div
                className="font-space text-4xl font-bold text-gold-gradient sm:text-5xl md:text-6xl"
                dir="ltr"
              >
                {item.prefix && <span>{item.prefix}</span>}
                <Counter to={item.value} />
                {item.suffix && <span>{item.suffix}</span>}
              </div>
              <p className="mt-3 text-sm text-white/60 sm:text-base">
                {item.label}
              </p>
              <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-gold-500 to-transparent transition-all duration-500 group-hover:w-20" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
