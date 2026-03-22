'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { FormError } from './FormError';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  required?: boolean;
  error?: string;
}

export function FormSection({
  title,
  description,
  children,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  required = false,
  error,
}: FormSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="space-y-1">
          {collapsible ? (
            <button type="button" onClick={() => setIsCollapsed(!isCollapsed)} className="flex items-center justify-between w-full text-left" aria-expanded={!isCollapsed}>
              <h3 className={cn('text-lg font-medium text-gray-900 transition-colors duration-200', error && 'text-red-600', required && "after:content-['*'] after:text-red-500 after:mr-1")}>
                {title}
              </h3>
              <svg className={cn('w-5 h-5 text-gray-500 transition-transform duration-200', isCollapsed && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <h3 className={cn('text-lg font-medium text-gray-900', error && 'text-red-600', required && "after:content-['*'] after:text-red-500 after:mr-1")}>
              {title}
            </h3>
          )}
          {description && <p className="text-sm text-gray-600">{description}</p>}
          {error && <FormError error={error} />}
        </div>
      )}
      <div className={cn('space-y-4 transition-all duration-300', collapsible && isCollapsed && 'hidden')}>
        {children}
      </div>
    </div>
  );
}
