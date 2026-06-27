import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/navigation';
import Navbar from '@/components/layout/Navbar';

export default async function NotesLayout({
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

  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar locale={locale} email={user!.email} />
      <main className="shell w-full flex-1 py-8">{children}</main>
    </div>
  );
}
