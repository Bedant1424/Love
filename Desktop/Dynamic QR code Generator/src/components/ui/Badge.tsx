import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'active' | 'unactivated' | 'disabled' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  ...props
}) => {
  const variants = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    unactivated: 'bg-amber-50 text-amber-700 border-amber-200',
    disabled: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  );
};
