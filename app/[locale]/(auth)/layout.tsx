import { getTranslations } from 'next-intl/server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/navigation';
import BrandMark from '@/components/ui/BrandMark';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default async function AuthLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in → straight to the app.
  if (user) redirect('/notes');

  const t = await getTranslations('nav');

  return (
    <div className="flex min-h-screen flex-col">
      <header className="shell flex h-16 items-center justify-between">
        <BrandMark label={t('brand')} />
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
    </div>
  );
}
