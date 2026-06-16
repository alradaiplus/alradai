'use client';

export function KeyHint({ keys, label }: { keys: string[]; label?: string }) {
  return (
    <span className="nc-keyhint">
      {keys.map((k, i) => (
        <kbd key={i}>{k}</kbd>
      ))}
      {label ? <span>{label}</span> : null}
    </span>
  );
}
