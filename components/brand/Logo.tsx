import { cn } from "@/lib/utils";

/**
 * Notes Canvas logo — a line-art portrait in a ring, recreated from the
 * product brand mark (person with glasses and a hoodie).
 */
export function LogoMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="3.5" />
      {/* hair */}
      <path
        d="M30 40c0-12 9-21 20-21s20 9 20 20c0 2-.3 4-.8 5.6-1.2-4-3-7-3-7s-2.6 2.4-7 2.7c-6 .4-9-2.3-9-2.3s-2 3.4-6.5 4.2c-2 .4-3.7.2-5-.2-.4-1-1.2-2.6-1.7-3.9-.6 0-1 1.1-1 2.1z"
        fill="currentColor"
      />
      {/* glasses */}
      <circle cx="39" cy="50" r="7.5" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="61" cy="50" r="7.5" stroke="currentColor" strokeWidth="2.6" />
      <path d="M46.5 49h7" stroke="currentColor" strokeWidth="2.6" />
      <path d="M31.5 49l-3-1M68.5 49l3-1" stroke="currentColor" strokeWidth="2.6" />
      {/* nose + smile */}
      <path
        d="M50 53v6m-6 6c2 2.6 4 3.6 6 3.6s4-1 6-3.6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* hoodie collar */}
      <path
        d="M24 92c2-11 11-17 26-17s24 6 26 17"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M44 80l-2 9M56 80l2 9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="text-accent">
        <LogoMark size={32} />
      </span>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold tracking-tight text-ink">
          Notes Canvas
        </div>
        <div className="text-[11px] text-ink-faint">Your Visual Second Brain</div>
      </div>
    </div>
  );
}
