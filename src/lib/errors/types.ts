// Types d'erreur pour l'affichage utilisateur

export interface UserFriendlyError {
  message: string;
  code?: string;
  severity: 'info' | 'warning' | 'error';
  field?: string;
  details?: Record<string, any>;
  translationKey?: string;
}

export interface ValidationError extends UserFriendlyError {
  field: string;
  severity: 'error';
}

export interface NetworkError extends UserFriendlyError {
  severity: 'error';
  code: string;
}

export interface BusinessError extends UserFriendlyError {
  severity: 'warning' | 'error';
  code: string;
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Error categories
export type ErrorCategory = 'auth' | 'validation' | 'network' | 'business' | 'system' | 'permission' | 'cart' | 'order' | 'product';

// Error recovery strategies
export type ErrorRecoveryStrategy = 'retry' | 'fallback' | 'redirect' | 'ignore' | 'manual';

// Error context for logging and debugging
export interface ErrorContext {
  action: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
  side?: 'client' | 'server';
  attempt?: number;
}

// API error response structure
export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId?: string;
}

// Service result wrapper
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: UserFriendlyError;
}