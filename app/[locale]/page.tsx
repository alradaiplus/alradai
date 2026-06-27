import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/navigation';

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? '/notes' : '/login');
}
