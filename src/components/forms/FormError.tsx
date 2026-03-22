'use client';

import { cn } from '@/lib/utils';

export interface FormErrorProps {
  error?: string | string[];
  className?: string;
  showIcon?: boolean;
}

export function FormError({ error, className = '', showIcon = true }: FormErrorProps) {
  if (!error) return null;
  const errors = Array.isArray(error) ? error : [error];

  return (
    <div className={cn('text-sm text-red-600 space-y-1', className)} role="alert" aria-live="polite">
      {errors.map((err, index) => (
        <div key={index} className="flex items-center animate-in slide-in-from-top-1 duration-200">
          {showIcon && (
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {err}
        </div>
      ))}
    </div>
  );
}
