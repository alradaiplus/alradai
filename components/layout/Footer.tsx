'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

import BrandMark from '@/components/ui/BrandMark';

const NAV_KEYS = ['home', 'about', 'services', 'projects', 'contact'] as const;
const NAV_HREFS: Record<(typeof NAV_KEYS)[number], string> = {
  home: '#top',
  about: '#about',
  services: '#services',
  projects: '#projects',
  contact: '#contact',
};

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-24 border-t border-gold-900/30 bg-[#060606]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <BrandMark className="h-8 w-8 text-gold-500" />
            <span className="text-lg font-semibold">
              PYB<span className="text-gold-500">3DCP</span>
            </span>
          </div>
          <p className="max-w-[28ch] text-sm text-white/60">{t('footer.tagline')}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-500/80">
            {t('footer.brand')}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            {t('footer.nav')}
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            {NAV_KEYS.map((k) => (
              <li key={k}>
                <a
                  href={NAV_HREFS[k]}
                  className="text-white/70 transition-colors hover:text-gold-300"
                >
                  {t(`nav.${k}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            {t('footer.contact')}
          </h3>
          <ul className="mt-5 space-y-3 text-sm text-white/70">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <span>{t('cta.contact.address')}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-gold-500" />
              <a
                href={`tel:+967${t('cta.contact.phone')}`}
                className="transition-colors hover:text-gold-300"
                dir="ltr"
              >
                +967 {t('cta.contact.phone')}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-gold-500" />
              <a
                href={`mailto:${t('cta.contact.email')}`}
                className="transition-colors hover:text-gold-300"
                dir="ltr"
              >
                {t('cta.contact.email')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">
            {t('footer.social')}
          </h3>
          <ul className="mt-5 flex items-center gap-3">
            {[
              { Icon: Youtube, href: '#', label: 'YouTube' },
              { Icon: Instagram, href: '#', label: 'Instagram' },
              { Icon: Facebook, href: '#', label: 'Facebook' },
            ].map(({ Icon, href, label }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className="group inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-900/60 text-gold-500 transition-all hover:border-gold-400 hover:bg-gold-500 hover:text-ink hover:shadow-gold-glow"
                >
                  <Icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div
          className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-white/40 sm:flex-row"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          <p>{t('footer.rights', { year })}</p>
          <p className="font-mono tracking-[0.2em] text-white/30">
            PYB · 3D CONCRETE PRINTING · YE
          </p>
        </div>
      </div>
    </footer>
  );
}
