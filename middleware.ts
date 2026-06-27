import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';

import { locales, defaultLocale } from './i18n';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export async function middleware(request: NextRequest) {
  // 1. Let next-intl resolve the locale (may rewrite/redirect).
  const response = intlMiddleware(request);
  // 2. Refresh the Supabase session and merge auth cookies onto that response.
  return updateSession(request, response);
}

export const config = {
  // Match all paths except Next.js internals, API routes, and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
