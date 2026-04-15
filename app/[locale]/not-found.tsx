import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * Locale-aware 404 page.
 * next-intl resolves the locale from the URL segment via middleware,
 * so we can read it from params if needed. For now a bilingual static
 * fallback keeps it simple — the URL already tells us the locale.
 */
export default function NotFound() {
  return (
    <section className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p
        className="font-space text-[9rem] font-black leading-none text-gold-gradient opacity-80 sm:text-[14rem]"
        aria-hidden
      >
        404
      </p>

      <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
        الصفحة غير موجودة
        <span className="mx-3 text-white/30">/</span>
        Page not found
      </h1>

      <p className="mt-4 max-w-[42ch] text-white/60">
        الصفحة التي تبحث عنها لم تُعثر عليها أو تم نقلها.
      </p>

      <Link href="/" className="btn-gold mt-10">
        العودة للرئيسية
        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
      </Link>
    </section>
  );
}
