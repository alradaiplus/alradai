'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Trash2, X } from 'lucide-react';

import type { Note, NoteColor } from '@/lib/notes/types';
import { NOTE_COLORS, NOTE_COLOR_KEYS } from '@/lib/notes/colors';

export default function NoteEditor({
  note,
  onClose,
  onSave,
  onDelete,
}: {
  note: Note | null;
  onClose: () => void;
  onSave: (input: {
    title: string;
    content: string;
    color: NoteColor;
  }) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}) {
  const t = useTranslations('notes');
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [color, setColor] = useState<NoteColor>(note?.color ?? 'default');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave() {
    if (saving) return;
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }
    setSaving(true);
    await onSave({ title, content, color });
  }

  const c = NOTE_COLORS[color];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{ backgroundColor: c.bg, borderColor: c.border }}
        className="animate-pop-in my-auto w-full max-w-lg rounded-2xl border shadow-card-hover"
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-sm font-semibold text-ink-faint">
            {note ? t('editNote') : t('newNote')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-faint hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('titlePlaceholder')}
            className="w-full bg-transparent text-lg font-semibold text-ink outline-none placeholder:text-ink-faint"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('contentPlaceholder')}
            rows={8}
            className="mt-2 w-full resize-y bg-transparent text-sm leading-relaxed text-ink-soft outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 pb-2">
          {NOTE_COLOR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setColor(key)}
              aria-label={t(`colors.${key}` as never)}
              style={{ backgroundColor: NOTE_COLORS[key].swatch }}
              className={`h-6 w-6 rounded-full border transition ${
                color === key
                  ? 'ring-2 ring-brand-500 ring-offset-2'
                  : 'border-line'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-black/5 px-5 py-3">
          <div>
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete()}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
              >
                <Trash2 size={16} />
                <span>{t('delete')}</span>
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-brand text-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
