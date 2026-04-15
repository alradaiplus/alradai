import type { SVGProps } from 'react';

/**
 * Abstract "layered print head" mark for PYB3DCP.
 * Three stacked bars suggesting printed layers + a nozzle dot.
 */
export default function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <rect x="5" y="20" width="22" height="3" rx="1.5" fill="currentColor" />
      <rect
        x="7"
        y="15"
        width="18"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity="0.7"
      />
      <rect
        x="9"
        y="10"
        width="14"
        height="3"
        rx="1.5"
        fill="currentColor"
        opacity="0.45"
      />
      <circle cx="16" cy="5" r="2" fill="currentColor" />
      <path
        d="M16 7v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
