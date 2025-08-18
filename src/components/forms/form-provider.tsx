'use client';

// Form provider with validation integration

import { cn } from '@/lib/utils';
import {
  useFormValidation as useValidation,
  type UseFormValidationOptions,
  type UseFormValidationReturn,
} from '@/lib/validation/hooks';
import React, { createContext, useContext } from 'react';
import { z } from 'zod';

// Form context
interface FormContextValue<T> extends UseFormValidationReturn<T> {
  schema: z.ZodSchema<T>;
}

const FormContext = createContext<FormContextValue<any> | null>(null);

// Enhanced form provider component with better validation integration
interface FormProviderProps<T> extends UseFormValidationOptions<T> {
  children: React.ReactNode;
  onSubmit: (data: T) => void | Promise<void>;
  onError?: (errors: any[]) => void;
  className?: string;
  showFormErrors?: boolean;
  autoFocus?: boolean;
  preventSubmitOnEnter?: boolean;
}

export function FormProvider<T>({
  children,
  onSubmit,
  onError,
  className = '',
  showFormErrors = true,
  autoFocus = true,
  preventSubmitOnEnter = false,
  ...validationOptions
}: FormProviderProps<T>) {
  const formMethods = useValidation<T>(validationOptions);
  const [submitAttempted, setSubmitAttempted] = React.useState(false);

  const contextValue: FormContextValue<T> = {
    ...formMethods,
    schema: validationOptions.schema,
  };

  const handleSubmit = formMethods.handleSubmit(
    async (data: T) => {
      setSubmitAttempted(true);
      await onSubmit(data);
    },
    errors => {
      setSubmitAttempted(true);
      onError?.(errors);
    }
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (preventSubmitOnEnter && e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  // Auto-focus first field with error or first input
  React.useEffect(() => {
    if (autoFocus && submitAttempted && Object.keys(formMethods.formState.errors).length > 0) {
      const firstErrorField = Object.keys(formMethods.formState.errors)[0];
      const element = document.getElementById(`field-${firstErrorField}`);
      element?.focus();
    }
  }, [autoFocus, submitAttempted, formMethods.formState.errors]);

  const formErrors = Object.values(formMethods.formState.errors).filter(Boolean);

  return (
    <FormContext.Provider value={contextValue}>
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className={cn('space-y-6', className)} noValidate>
        {showFormErrors && submitAttempted && formErrors.length > 0 && (
          <div
            className='bg-red-50 border border-red-200 rounded-md p-4 animate-in slide-in-from-top-2 duration-300'
            role='alert'
            aria-live='assertive'
          >
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-red-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>
              <div className='mr-3'>
                <h3 className='text-sm font-medium text-red-800'>يرجى تصحيح الأخطاء التالية:</h3>
                <div className='mt-2 text-sm text-red-700'>
                  <ul className='list-disc list-inside space-y-1'>
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Hook to use form context
export function useFormValidation(): FormContextValue<any> {
  const context = useContext(FormContext);

  if (!context) {
    throw new Error('useFormValidation must be used within a FormProvider');
  }

  return context;
}

// Enhanced form section component (moved to form-fields.tsx for better organization)
// This is kept for backward compatibility but should use FormSection from form-fields.tsx
interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className='space-y-1'>
          <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
          {description && <p className='text-sm text-gray-600'>{description}</p>}
        </div>
      )}
      <div className='space-y-4'>{children}</div>
    </div>
  );
}

// Form actions component for submit/cancel buttons
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function FormActions({ children, className = '', align = 'right' }: FormActionsProps) {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return <div className={`flex gap-3 ${alignmentClasses[align]} ${className}`}>{children}</div>;
}

// Enhanced submit button component with better loading states and accessibility
interface SubmitButtonProps {
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  showValidationState?: boolean;
}

export function SubmitButton({
  children,
  loadingText = 'جاري الحفظ...',
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  icon,
  showValidationState = true,
}: SubmitButtonProps) {
  const { formState } = useFormValidation();
  const { isSubmitting, isValid, errors } = formState;
  const hasErrors = Object.keys(errors).length > 0;

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-sm',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500 shadow-sm',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10',
    lg: 'px-6 py-3 text-lg h-12',
  };

  const getButtonState = () => {
    if (isSubmitting) return 'submitting';
    if (showValidationState && hasErrors) return 'invalid';
    if (showValidationState && isValid) return 'valid';
    return 'idle';
  };

  const buttonState = getButtonState();

  return (
    <button
      type='submit'
      disabled={disabled || isSubmitting}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200 transform',
        'hover:scale-[1.02] active:scale-[0.98]',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        buttonState === 'invalid' && 'ring-2 ring-red-200',
        buttonState === 'valid' && 'ring-2 ring-green-200',
        className
      )}
      aria-describedby={hasErrors ? 'form-errors' : undefined}
    >
      {isSubmitting ? (
        <>
          <svg className='animate-spin -ml-1 mr-2 h-4 w-4' fill='none' viewBox='0 0 24 24' aria-hidden='true'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            />
          </svg>
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className='mr-2'>{icon}</span>}
          <span>{children}</span>
          {showValidationState && buttonState === 'valid' && (
            <svg className='ml-2 h-4 w-4 text-green-400' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
          )}
        </>
      )}
    </button>
  );
}

// Cancel button component
interface CancelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function CancelButton({ children, onClick, className = '' }: CancelButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`
        px-4 py-2 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        transition-colors duration-200
        ${className}
      `}
    >
      {children}
    </button>
  );
}
