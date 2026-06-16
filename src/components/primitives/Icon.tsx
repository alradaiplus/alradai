'use client';

import type { SVGProps } from 'react';

type IconName =
  | 'plus'
  | 'check'
  | 'search'
  | 'settings'
  | 'inbox'
  | 'today'
  | 'canvas'
  | 'mic'
  | 'paperclip'
  | 'image'
  | 'link'
  | 'close'
  | 'arrow-right'
  | 'sparkle'
  | 'dot';

const PATHS: Record<IconName, string> = {
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5L20 7',
  search: 'M11 19a8 8 0 1 1 5.3-2L21 21',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1',
  inbox: 'M4 4h16v8h-5l-2 3h-2l-2-3H4z M4 12v8h16v-8',
  today: 'M5 6h14v14H5z M5 10h14 M9 4v4 M15 4v4',
  canvas: 'M4 5h16v14H4z M8 9h8 M8 13h5',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3',
  paperclip:
    'M21 12l-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 1 1 5 5l-8.5 8.5a2 2 0 1 1-3-3L16 7',
  image:
    'M4 5h16v14H4zM7 16l3.5-4 3 3.5 2.5-3L20 18 M8.5 9.5h.01',
  link: 'M10 14a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-1.5 1.5 M14 10a5 5 0 0 1 0 7l-3 3a5 5 0 0 1-7-7l1.5-1.5',
  close: 'M6 6l12 12M6 18L18 6',
  'arrow-right': 'M5 12h14M13 5l7 7-7 7',
  sparkle: 'M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z',
  dot: 'M12 12.01 V12',
};

export function Icon({
  name,
  size = 16,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export type { IconName };
