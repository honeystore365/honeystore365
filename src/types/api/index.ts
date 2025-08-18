// API-specific types and interfaces

import { PaginatedResult, ServiceResult } from '../common';

// Generic API response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
}

export interface ValidationError extends APIError {
  field: string;
  value?: any;
}

// Request/Response wrappers
export type APIServiceResult<T> = ServiceResult<T>;
export type APIPaginatedResult<T> = ServiceResult<PaginatedResult<T>>;

// HTTP method types
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API endpoint configuration
export interface APIEndpoint {
  method: HTTPMethod;
  path: string;
  requiresAuth?: boolean;
  roles?: string[];
}

// Request context
export interface RequestContext {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Rate limiting
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

// API versioning
export interface APIVersion {
  version: string;
  deprecated?: boolean;
  sunsetDate?: Date;
}
