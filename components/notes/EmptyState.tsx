'use client';

import { useTranslations } from 'next-intl';
import { NotebookPen, Plus } from 'lucide-react';

export default function EmptyState({ onNew }: { onNew: () => void }) {
  const t = useTranslations('notes');

  return (
    <div className="card grid place-items-center px-6 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
        <NotebookPen size={26} />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-ink">{t('emptyTitle')}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-faint">{t('emptyBody')}</p>
      <button type="button" onClick={onNew} className="btn-brand mt-5">
        <Plus size={18} />
        {t('newNote')}
      </button>
    </div>
  );
}
