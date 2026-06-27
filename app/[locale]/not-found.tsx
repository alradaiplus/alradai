import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Locale-aware 404 page. A bilingual static fallback keeps it simple — the URL
 * already tells us the locale.
 */
export default function NotFound() {
  return (
    <section className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p
        className="text-[7rem] font-black leading-none text-brand-500 sm:text-[10rem]"
        aria-hidden
      >
        404
      </p>

      <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
        الصفحة غير موجودة
        <span className="mx-3 text-ink-faint">/</span>
        Page not found
      </h1>

      <p className="mt-3 max-w-[42ch] text-ink-faint">
        الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>

      <Link href="/" className="btn-brand mt-8">
        العودة للرئيسية
        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
      </Link>
    </section>
  );
}
