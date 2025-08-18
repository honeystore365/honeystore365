'use client';

// React Error Boundary for catching and handling React component errors

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler } from './error-handler';
import { ErrorContext } from './types';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorId: string, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: Partial<ErrorContext>;
  isolate?: boolean; // If true, only catches errors from direct children
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorContext: ErrorContext = {
      action: 'react_component_error',
      component: this.constructor.name,
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        ...this.props.context,
      },
    };

    // Log the error using our error handler
    errorHandler.logError(error, errorContext);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorId, this.retry);
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} errorId={this.state.errorId} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
interface DefaultErrorFallbackProps {
  error: Error;
  errorId: string;
  retry: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, errorId, retry }) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className='min-h-[400px] flex items-center justify-center p-6'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-lg border border-red-200 p-6 text-center'>
        <div className='mb-4'>
          <div className='mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4'>
            <svg className='w-6 h-6 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>حدث خطأ غير متوقع</h3>
          <p className='text-gray-600 mb-4'>نعتذر، حدث خطأ أثناء تحميل هذا الجزء من الصفحة</p>
        </div>

        {isDevelopment && (
          <div className='mb-4 p-3 bg-gray-50 rounded text-left text-sm'>
            <p className='font-mono text-red-600 mb-2'>{error.message}</p>
            <p className='text-gray-500 text-xs'>Error ID: {errorId}</p>
          </div>
        )}

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={retry}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.reload()}
            className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors'
          >
            إعادة تحميل الصفحة
          </button>
        </div>

        <p className='text-xs text-gray-500 mt-4'>إذا استمر الخطأ، يرجى الاتصال بالدعم الفني</p>
      </div>
    </div>
  );
};

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for error boundary context
export function useErrorHandler() {
  const throwError = (error: Error) => {
    // This will be caught by the nearest error boundary
    throw error;
  };

  const handleError = (error: Error, context?: Partial<ErrorContext>) => {
    const errorContext: ErrorContext = {
      action: 'manual_error_handling',
      component: 'useErrorHandler',
      ...context,
    };

    const userFriendlyError = errorHandler.handleClientError(error, errorContext);

    // You can integrate this with your toast/notification system
    console.error('Handled error:', userFriendlyError);

    return userFriendlyError;
  };

  return {
    throwError,
    handleError,
  };
}

// Async error boundary for handling async errors in components
export class AsyncErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorContext: ErrorContext = {
      action: 'async_component_error',
      component: 'AsyncErrorBoundary',
      metadata: {
        componentStack: errorInfo.componentStack,
        asyncError: true,
        ...this.props.context,
      },
    };

    errorHandler.logError(error, errorContext);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorId, this.retry);
      }

      return <DefaultErrorFallback error={this.state.error} errorId={this.state.errorId} retry={this.retry} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
