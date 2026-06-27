import { NotebookPen } from 'lucide-react';

export default function BrandMark({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-ink">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white shadow-brand">
        <NotebookPen size={18} strokeWidth={2.5} />
      </span>
      <span className="text-lg tracking-tight">{label}</span>
    </span>
  );
}
