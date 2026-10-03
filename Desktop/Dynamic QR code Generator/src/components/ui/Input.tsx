import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          disabled={disabled}
          className={twMerge(
            clsx(
              'flex h-11 w-full rounded-lg border bg-white px-3.5 py-2 text-base text-zinc-950 transition-colors placeholder:text-zinc-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500',
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-zinc-300 hover:border-zinc-400',
              className
            )
          )}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
