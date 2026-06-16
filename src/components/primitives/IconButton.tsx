'use client';

import type { ButtonHTMLAttributes } from 'react';

import { Icon, type IconName } from './Icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: IconName;
  size?: number;
};

export function IconButton({ icon, size = 14, className, ...rest }: Props) {
  return (
    <button className={`nc-iconbtn ${className ?? ''}`.trim()} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}
