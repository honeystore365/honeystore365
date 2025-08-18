'use client';

// User-friendly error display components with localization support

import { UserFriendlyError } from '@/lib/errors/types';
import { useCommonTranslations } from '@/lib/i18n/hooks';
import React from 'react';

interface ErrorDisplayProps {
  error: UserFriendlyError;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

// Main error display component
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, onDismiss, className = '' }) => {
  const { errors, common } = useCommonTranslations();
  const getSeverityStyles = (severity: UserFriendlyError['severity']) => {
    switch (severity) {
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          iconPath:
            'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
        };
      case 'error':
      default:
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
        };
    }
  };

  const styles = getSeverityStyles(error.severity);

  return (
    <div
      className={`rounded-md border p-4 ${styles.container} ${className}`}
      role={error.severity === 'error' ? 'alert' : 'status'}
      aria-live={error.severity === 'error' ? 'assertive' : 'polite'}
      aria-atomic='true'
    >
      <div className='flex'>
        <div className='flex-shrink-0'>
          <svg
            className={`h-5 w-5 ${styles.icon}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-hidden='true'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d={styles.iconPath} />
          </svg>
        </div>
        <div className='mr-3 flex-1'>
          <p className='text-sm font-medium'>{error.message}</p>
          {error.code && (
            <p className='mt-1 text-xs opacity-75'>
              {errors.errorCode}: {error.code}
            </p>
          )}
        </div>
        <div className='mr-auto flex-shrink-0'>
          <div className='flex space-x-2 space-x-reverse'>
            {onRetry && (
              <button
                onClick={onRetry}
                className='text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded'
                aria-label='إعادة المحاولة'
              >
                {common.retry}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className='text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded'
                aria-label='إغلاق رسالة الخطأ'
              >
                {common.close}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline error display for form fields
interface InlineErrorProps {
  error?: UserFriendlyError | string;
  className?: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ error, className = '' }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return <p className={`text-sm text-red-600 mt-1 ${className}`}>{errorMessage}</p>;
};

// Toast-style error notification
interface ErrorToastProps {
  error: UserFriendlyError;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ error, onClose, autoClose = true, autoCloseDelay = 5000 }) => {
  const { errors } = useCommonTranslations();
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoClose, autoCloseDelay, onClose]);

  const getSeverityStyles = (severity: UserFriendlyError['severity']) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-600 text-white';
      case 'warning':
        return 'bg-yellow-600 text-white';
      case 'error':
      default:
        return 'bg-red-600 text-white';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ${getSeverityStyles(
        error.severity
      )}`}
      role={error.severity === 'error' ? 'alert' : 'status'}
      aria-live={error.severity === 'error' ? 'assertive' : 'polite'}
      aria-atomic='true'
    >
      <div className='p-4'>
        <div className='flex items-start'>
          <div className='flex-1'>
            <p className='text-sm font-medium'>{error.message}</p>
            {error.code && (
              <p className='mt-1 text-xs opacity-75'>
                {errors.errorCode}: {error.code}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className='mr-2 flex-shrink-0 text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white rounded'
            aria-label='إغلاق الإشعار'
          >
            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Error page component for full-page errors
interface ErrorPageProps {
  error: UserFriendlyError;
  onRetry?: () => void;
  onGoHome?: () => void;
  title?: string;
  description?: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, onRetry, onGoHome, title, description }) => {
  const { errors, common } = useCommonTranslations();
  const defaultTitle = title || errors.generic;
  const defaultDescription = description || errors.generic;
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8 text-center'>
        <div>
          <div className='mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center'>
            <svg className='h-12 w-12 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <h2 className='mt-6 text-3xl font-extrabold text-gray-900'>{defaultTitle}</h2>
          <p className='mt-2 text-sm text-gray-600'>{defaultDescription}</p>
        </div>

        <div className='bg-white p-6 rounded-lg shadow'>
          <ErrorDisplay error={error} />
        </div>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          {onRetry && (
            <button
              onClick={onRetry}
              className='w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              {common.retry}
            </button>
          )}
          {onGoHome && (
            <button
              onClick={onGoHome}
              className='w-full sm:w-auto px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              {common.goHome}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading error component for async operations
interface LoadingErrorProps {
  error: UserFriendlyError;
  onRetry?: () => void;
  isLoading?: boolean;
}

export const LoadingError: React.FC<LoadingErrorProps> = ({ error, onRetry, isLoading = false }) => {
  const { common } = useCommonTranslations();
  return (
    <div className='flex flex-col items-center justify-center p-8 text-center'>
      <div className='mb-4'>
        <svg className='h-12 w-12 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      </div>
      <h3 className='text-lg font-medium text-gray-900 mb-2'>{common.error}</h3>
      <p className='text-gray-600 mb-4'>{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isLoading}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          {isLoading ? `${common.loading}...` : common.retry}
        </button>
      )}
    </div>
  );
};

// Form error summary component
interface FormErrorSummaryProps {
  errors: UserFriendlyError[];
  title?: string;
  className?: string;
}

export const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({ errors, title, className = '' }) => {
  const { forms } = useCommonTranslations();
  const defaultTitle = title || forms.validationError;
  if (errors.length === 0) return null;

  return (
    <div
      className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}
      role='alert'
      aria-live='assertive'
      aria-atomic='true'
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
          <h3 className='text-sm font-medium text-red-800'>{defaultTitle}</h3>
          <div className='mt-2 text-sm text-red-700'>
            <ul className='list-disc list-inside space-y-1' role='list'>
              {errors.map((error, index) => (
                <li key={index} role='listitem'>
                  {error.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
