'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { Link, useRouter } from '@/navigation';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // When email confirmation is required there is no active session yet.
        if (!data.session) {
          setNotice(t('checkEmail'));
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push('/notes');
      router.refresh();
    } catch (err) {
      setError((err as Error).message || t('genericError'));
      setLoading(false);
    }
  }

  return (
    <div className="card w-full max-w-md p-7 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">
        {mode === 'signup' ? t('signupTitle') : t('loginTitle')}
      </h1>
      <p className="mt-1 text-sm text-ink-faint">
        {mode === 'signup' ? t('signupSubtitle') : t('loginSubtitle')}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink-soft">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink-soft">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {notice}
          </p>
        ) : null}

        <button type="submit" disabled={loading} className="btn-brand w-full">
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : mode === 'signup' ? (
            t('signupCta')
          ) : (
            t('loginCta')
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-ink-faint">
        {mode === 'signup' ? t('haveAccount') : t('noAccount')}{' '}
        <Link
          href={mode === 'signup' ? '/login' : '/signup'}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          {mode === 'signup' ? t('loginCta') : t('signupCta')}
        </Link>
      </p>
    </div>
  );
}
