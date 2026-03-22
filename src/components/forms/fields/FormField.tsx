'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import React from 'react';

export interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  error?: string;
  showValidationIcon?: boolean;
  validationState?: 'idle' | 'validating' | 'valid' | 'invalid';
}

export function FormField({
  name,
  label,
  description,
  required = false,
  className = '',
  children,
  error,
  showValidationIcon = true,
  validationState = 'idle',
}: FormFieldProps) {
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const descriptionId = `${fieldId}-description`;
  const [isFocused, setIsFocused] = React.useState(false);

  const getValidationIcon = () => {
    if (!showValidationIcon || validationState === 'idle') return null;
    const icons = {
      validating: (
        <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ),
      valid: (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ),
      invalid: (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    };
    return <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{icons[validationState]}</div>;
  };

  return (
    <div className={cn('space-y-2 transition-all duration-200', isFocused && 'scale-[1.01]', className)}>
      {label && (
        <Label htmlFor={fieldId} className={cn(
          'text-sm font-medium transition-colors duration-200',
          error && 'text-red-600',
          isFocused && !error && 'text-blue-600',
          required && "after:content-['*'] after:text-red-500 after:mr-1"
        )}>
          {label}
        </Label>
      )}
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined,
          'aria-invalid': !!error,
          onFocus: (e: React.FocusEvent) => {
            setIsFocused(true);
            if (React.isValidElement(children)) children.props.onFocus?.(e);
          },
          onBlur: (e: React.FocusEvent) => {
            setIsFocused(false);
            if (React.isValidElement(children)) children.props.onBlur?.(e);
          },
          className: cn(
            React.isValidElement(children) ? children.props.className : '',
            showValidationIcon && validationState !== 'idle' && 'pl-10',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            validationState === 'valid' && !error && 'border-green-500 focus:border-green-500 focus:ring-green-500'
          ),
        })}
        {getValidationIcon()}
      </div>
      {description && <p id={descriptionId} className="text-sm text-gray-600">{description}</p>}
      {error && (
        <div id={errorId} className="text-sm text-red-600 flex items-center animate-in slide-in-from-top-1 duration-200" role="alert">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
