import { useState, useCallback } from 'react';
import { UserFriendlyError } from '@/lib/errors/types';

interface ErrorState {
  error: UserFriendlyError | null;
  isLoading: boolean;
}

interface ErrorHandlingOptions {
  context?: Record<string, any>;
}

export function useErrorHandling(options?: ErrorHandlingOptions) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isLoading: false,
  });

  const clearError = useCallback(() => {
    setErrorState(prev => ({ ...prev, error: null }));
  }, []);

  const handleError = useCallback((error: Error | UserFriendlyError) => {
    // Convert regular Error to UserFriendlyError if needed
    const userFriendlyError: UserFriendlyError = 'severity' in error ? error : {
      message: error.message,
      severity: 'error' as const,
      code: error.name,
    };

    // Log error with context if provided
    if (options?.context) {
      console.error('Error with context:', { error: userFriendlyError, context: options.context });
    } else {
      console.error('Error:', userFriendlyError);
    }
    setErrorState(prev => ({ ...prev, error: userFriendlyError, isLoading: false }));
  }, [options?.context]);

  const setLoading = useCallback((loading: boolean) => {
    setErrorState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  return {
    error: errorState.error,
    isLoading: errorState.isLoading,
    clearError,
    handleError,
    setLoading,
  };
}

export function useAsyncOperation<T>(options?: ErrorHandlingOptions) {
  const { error, isLoading, handleError, setLoading, clearError } = useErrorHandling(options);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      clearError();
      const result = await operation();
      setLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      handleError(error);
      return null;
    }
  }, [setLoading, clearError, handleError]);

  return {
    execute,
    error,
    isLoading,
    clearError,
  };
}