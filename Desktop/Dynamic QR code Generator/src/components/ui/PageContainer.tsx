import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'narrow' | 'default' | 'wide';
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  size = 'default',
  ...props
}) => {
  const sizes = {
    narrow: 'max-w-md', // Ideal for mobile activation (single column, phone-focused)
    default: 'max-w-3xl', // Standard card & content view
    wide: 'max-w-6xl', // Dashboard table view
  };

  return (
    <div
      className={twMerge(clsx('mx-auto w-full px-4 py-8 sm:px-6 sm:py-12', sizes[size], className))}
      {...props}
    >
      {children}
    </div>
  );
};
