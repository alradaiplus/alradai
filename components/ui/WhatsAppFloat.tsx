'use client';

import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFloat() {
  const t = useTranslations('cta.contact');
  const phone = t('phone');

  return (
    <a
      href={`https://wa.me/967${phone}`}
      target="_blank"
      rel="noreferrer"
      aria-label={t('whatsapp')}
      className="group fixed bottom-6 z-[55] ltr:right-6 rtl:left-6"
    >
      <span className="absolute inset-0 animate-pulse-soft rounded-full bg-gold-500/50 blur-xl" />
      <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold-500/40 bg-ink/80 text-gold-400 shadow-gold-glow backdrop-blur-xl transition-all group-hover:-translate-y-1 group-hover:border-gold-400 group-hover:text-gold-200">
        <MessageCircle className="h-6 w-6" />
      </span>
    </a>
  );
}
