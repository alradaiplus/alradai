import { getTranslations } from 'next-intl/server';
import { LogOut } from 'lucide-react';

import BrandMark from '@/components/ui/BrandMark';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { signOut } from '@/app/_actions/auth';

export default async function Navbar({
  locale,
  email,
}: {
  locale: string;
  email?: string | null;
}) {
  const t = await getTranslations('nav');
  const signOutWithLocale = signOut.bind(null, locale);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/80 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between">
        <BrandMark label={t('brand')} />

        <div className="flex items-center gap-2">
          {email ? (
            <span className="hidden max-w-[180px] truncate text-sm text-ink-faint sm:inline">
              {email}
            </span>
          ) : null}
          <LanguageSwitcher />
          {email ? (
            <form action={signOutWithLocale}>
              <button type="submit" className="btn-ghost !px-3 !py-2 text-sm">
                <LogOut size={16} />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </header>
  );
}
