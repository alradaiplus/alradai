import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './tracker.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tracker — Notes Canvas',
  description:
    'Notes Canvas Habit Tracker — a premium life operating system for ambitious students, founders, researchers, and engineers.',
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
};

export default function TrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="tracker-body">{children}</body>
    </html>
  );
}
