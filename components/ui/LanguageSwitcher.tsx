'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';

import { usePathname, useRouter } from '@/navigation';

export default function LanguageSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const target = locale === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(() => router.replace(pathname, { locale: target }))
      }
      className="btn-ghost !px-3 !py-2 text-sm"
      aria-label={t('switchLanguage')}
    >
      <Languages size={16} />
      <span>{t('language')}</span>
    </button>
  );
}
