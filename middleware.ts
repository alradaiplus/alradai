import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  // Match all paths except Next.js internals, API routes, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
