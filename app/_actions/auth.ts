'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function signOut(locale: string) {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect(locale === 'en' ? '/en/login' : '/login');
}
