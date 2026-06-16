'use client';

import dynamic from 'next/dynamic';

// Shell mounts IndexedDB, stores, and global hotkeys — strictly client-side.
const Shell = dynamic(
  () => import('@/src/components/shell/Shell').then((m) => m.Shell),
  { ssr: false },
);

export default function Page() {
  return <Shell />;
}
