'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

import BrandMark from '@/components/ui/BrandMark';

const SECTIONS = [
  { key: 'home', href: '#top' },
  { key: 'about', href: '#about' },
  { key: 'services', href: '#services' },
  { key: 'projects', href: '#projects' },
  { key: 'contact', href: '#contact' },
] as const;

export default function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Toggle locale while preserving the current path
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  const switchLocaleHref = (() => {
    // next-intl with localePrefix: 'as-needed' — AR lives at root
    const stripped = pathname.replace(/^\/(ar|en)(?=\/|$)/, '') || '/';
    return otherLocale === 'ar' ? stripped : `/en${stripped === '/' ? '' : stripped}`;
  })();

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className={[
          'fixed inset-x-0 top-0 z-50 transition-all duration-500',
          scrolled
            ? 'backdrop-blur-xl bg-ink/70 border-b border-white/5'
            : 'bg-transparent',
        ].join(' ')}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="#top"
            className="flex items-center gap-2 text-white"
            aria-label="PYB3DCP"
          >
            <BrandMark className="h-7 w-7 text-gold-500" />
            <span className="font-semibold tracking-tight">
              PYB<span className="text-gold-500">3DCP</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {SECTIONS.map((s) => (
              <li key={s.key}>
                <a
                  href={s.href}
                  className="text-sm text-white/70 transition-colors hover:text-gold-300"
                >
                  {t(s.key)}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href={switchLocaleHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:border-gold-500/50 hover:text-gold-300"
              aria-label="Switch language"
            >
              <Globe className="h-3.5 w-3.5" />
              {t('language')}
            </a>
            <a href="#contact" className="btn-gold !px-5 !py-2 text-sm">
              {t('cta')}
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70] md:hidden"
          >
            <div className="absolute inset-0 bg-ink/90 backdrop-blur-2xl" />
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative flex h-full flex-col px-6 py-6"
            >
              <div className="flex items-center justify-between">
                <Link
                  href="#top"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 text-white"
                >
                  <BrandMark className="h-7 w-7 text-gold-500" />
                  <span className="font-semibold">
                    PYB<span className="text-gold-500">3DCP</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ul className="mt-16 flex flex-col gap-7">
                {SECTIONS.map((s, i) => (
                  <motion.li
                    key={s.key}
                    initial={{ x: 24, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <a
                      href={s.href}
                      onClick={() => setOpen(false)}
                      className="text-3xl font-semibold tracking-tight text-white transition-colors hover:text-gold-400"
                    >
                      {t(s.key)}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-auto flex flex-col gap-3">
                <a
                  href={switchLocaleHref}
                  onClick={() => setOpen(false)}
                  className="btn-ghost"
                >
                  <Globe className="h-4 w-4" />
                  {t('language')}
                </a>
                <a
                  href="#contact"
                  onClick={() => setOpen(false)}
                  className="btn-gold"
                >
                  {t('cta')}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
