// Main exports for the error management system

// Types
export type {
  APIErrorResponse,
  ErrorCategory,
  ErrorContext,
  ErrorRecoveryStrategy,
  ErrorSeverity,
  ServiceResult,
  UserFriendlyError,
} from './types';

// Custom error classes
export {
  AppError,
  AuthError,
  BusinessError,
  CartEmptyError,
  InsufficientStockError,
  NetworkError,
  OrderNotFoundError,
  PermissionError,
  ProductNotFoundError,
  SystemError,
  ValidationError,
  createAuthError,
  createNetworkError,
  createSystemError,
  createValidationError,
} from './custom-errors';

// Error handler
export {
  errorHandler,
  handleClientError,
  handleServerError,
  handleServiceError,
  logError,
  shouldRetry,
  wrapAsync,
  wrapSync,
} from './error-handler';

// React error boundary
export { AsyncErrorBoundary, ErrorBoundary, useErrorHandler, withErrorBoundary } from './error-boundary';

// Re-export default error handler
export { default } from './error-handler';
