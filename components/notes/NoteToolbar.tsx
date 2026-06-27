'use client';

import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';

export default function NoteToolbar({
  query,
  onQueryChange,
  onNew,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onNew: () => void;
}) {
  const t = useTranslations('notes');

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-ink-faint">{t('subtitle')}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:w-72">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-faint ltr:left-3 rtl:right-3"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input ltr:pl-9 rtl:pr-9"
            aria-label={t('searchPlaceholder')}
          />
        </div>
        <button type="button" onClick={onNew} className="btn-brand shrink-0">
          <Plus size={18} />
          <span className="hidden sm:inline">{t('newNote')}</span>
        </button>
      </div>
    </div>
  );
}
