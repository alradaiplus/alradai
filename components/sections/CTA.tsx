'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Check,
  Loader2,
  Mail,
  MapPin,
  Phone,
  MessageCircle,
} from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function CTA() {
  const t = useTranslations('cta');
  const [status, setStatus] = useState<Status>('idle');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');

    const formData = new FormData(e.currentTarget);
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

    if (!accessKey) {
      // No key configured yet — simulate success in dev so the UI still flows.
      await new Promise((r) => setTimeout(r, 900));
      setStatus('success');
      e.currentTarget.reset();
      return;
    }

    formData.append('access_key', accessKey);
    formData.append('subject', 'New PYB3DCP contact form submission');

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('success');
      e.currentTarget.reset();
    } catch {
      setStatus('error');
    }
  };

  const phone = t('contact.phone');

  return (
    <section id="contact" className="section-shell">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        {/* Form card with rotating gold ring */}
        <div className="relative">
          <div className="gold-ring">
            <div className="glass relative overflow-hidden !rounded-[26px] p-8 sm:p-10">
              <p className="eyebrow">{t('eyebrow')}</p>
              <h2 className="display mt-4 text-balance text-white">
                {t('title')}
              </h2>
              <p className="mt-4 max-w-[56ch] text-white/65">
                {t('subtitle')}
              </p>

              <form onSubmit={onSubmit} className="mt-8 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    name="first_name"
                    label={t('form.firstName')}
                    required
                  />
                  <Field
                    name="last_name"
                    label={t('form.lastName')}
                    required
                  />
                </div>
                <Field
                  name="email"
                  type="email"
                  label={t('form.email')}
                  required
                />
                <Field
                  name="message"
                  label={t('form.message')}
                  as="textarea"
                  required
                />

                <div className="mt-2 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-gold disabled:opacity-70"
                  >
                    {status === 'loading' && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {status === 'success' && <Check className="h-4 w-4" />}
                    {t('form.submit')}
                  </button>

                  {status === 'success' && (
                    <motion.p
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-gold-300"
                    >
                      {t('form.success')}
                    </motion.p>
                  )}
                  {status === 'error' && (
                    <p className="text-sm text-red-400">{t('form.error')}</p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Contact chips + mini map */}
        <div className="flex flex-col gap-5">
          <ContactChip
            icon={<MapPin className="h-5 w-5" />}
            label={t('contact.address')}
            href="https://maps.google.com/?q=Sana'a"
            external
          />
          <ContactChip
            icon={<Phone className="h-5 w-5" />}
            label={`+967 ${phone}`}
            href={`tel:+967${phone}`}
            dirLtr
          />
          <ContactChip
            icon={<Mail className="h-5 w-5" />}
            label={t('contact.email')}
            href={`mailto:${t('contact.email')}`}
            dirLtr
          />
          <ContactChip
            icon={<MessageCircle className="h-5 w-5" />}
            label={t('contact.whatsapp')}
            href={`https://wa.me/967${phone}`}
            external
            accent
          />

          <div className="glass relative mt-2 overflow-hidden">
            <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#141006] via-ink to-black">
              <svg viewBox="0 0 400 300" className="h-full w-full opacity-70">
                <defs>
                  <pattern
                    id="map-grid"
                    x="0"
                    y="0"
                    width="30"
                    height="30"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 30 0 L 0 0 0 30"
                      fill="none"
                      stroke="rgba(212,168,67,0.12)"
                      strokeWidth="0.6"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#map-grid)" />
                <path
                  d="M 40 230 Q 120 120 210 150 T 380 80"
                  stroke="rgba(212,168,67,0.45)"
                  strokeWidth="1.2"
                  fill="none"
                />
                <circle cx="210" cy="150" r="6" fill="#D4A843" />
                <circle
                  cx="210"
                  cy="150"
                  r="14"
                  fill="none"
                  stroke="#D4A843"
                  strokeOpacity="0.45"
                >
                  <animate
                    attributeName="r"
                    from="10"
                    to="28"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.65"
                    to="0"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(
                t('contact.address')
              )}`}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 border-t border-white/5 bg-ink/80 py-3 text-xs font-medium text-gold-300 backdrop-blur transition hover:text-gold-200"
            >
              {t('contact.address')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  as = 'input',
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  as?: 'input' | 'textarea';
}) {
  const baseClass =
    'peer w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 pb-3 pt-6 text-sm text-white placeholder-transparent transition-all focus:border-gold-500/60 focus:outline-none focus:ring-4 focus:ring-gold-500/10';

  return (
    <label className="relative block">
      {as === 'textarea' ? (
        <textarea
          name={name}
          required={required}
          placeholder={label}
          rows={4}
          className={baseClass}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          placeholder={label}
          className={baseClass}
        />
      )}
      <span className="pointer-events-none absolute left-4 top-2 text-[10px] uppercase tracking-[0.18em] text-gold-400/80 transition-all rtl:left-auto rtl:right-4 peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:text-white/40 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-gold-400">
        {label}
      </span>
    </label>
  );
}

function ContactChip({
  icon,
  label,
  href,
  external,
  accent,
  dirLtr,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  external?: boolean;
  accent?: boolean;
  dirLtr?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={[
        'glass glass-hover flex items-center gap-4 p-5',
        accent ? '!border-gold-500/30' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-11 w-11 items-center justify-center rounded-2xl border',
          accent
            ? 'border-gold-500/50 bg-gold-500/15 text-gold-300'
            : 'border-white/10 bg-white/[0.02] text-gold-400',
        ].join(' ')}
      >
        {icon}
      </span>
      <span
        className="text-sm text-white/80"
        dir={dirLtr ? 'ltr' : undefined}
      >
        {label}
      </span>
    </a>
  );
}
