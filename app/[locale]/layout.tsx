import type { Metadata, Viewport } from 'next';
import { Cairo, Tajawal, Space_Grotesk } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { locales, type Locale } from '@/i18n';
import SmoothScroll from '@/components/layout/SmoothScroll';
import ScrollProgress from '@/components/layout/ScrollProgress';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PersistentBackground from '@/components/layout/PersistentBackground';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import BackToTop from '@/components/ui/BackToTop';
import Preloader from '@/components/ui/Preloader';

import '../globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

const space = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pyb3dcp.com'
    ),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      locale: locale === 'ar' ? 'ar_YE' : 'en_US',
    },
    alternates: {
      languages: {
        ar: '/',
        en: '/en',
      },
    },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: '/favicon.svg',
      apple: '/apple-touch-icon.png',
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${cairo.variable} ${tajawal.variable} ${space.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-ink text-white antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Preloader />
          <PersistentBackground />
          <SmoothScroll>
            <ScrollProgress />
            <Navbar />
            <main className="relative z-10">{children}</main>
            <Footer />
          </SmoothScroll>
          <WhatsAppFloat />
          <BackToTop />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
