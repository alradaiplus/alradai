'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  children?: ReactNode;
};

export function Button({ variant = 'default', className, children, ...rest }: ButtonProps) {
  const cls = ['nc-btn'];
  if (variant === 'primary') cls.push('nc-btn--primary');
  if (variant === 'ghost') cls.push('nc-btn--ghost');
  if (variant === 'danger') cls.push('nc-btn--danger');
  if (className) cls.push(className);
  return (
    <button className={cls.join(' ')} {...rest}>
      {children}
    </button>
  );
}
