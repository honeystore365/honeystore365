// Service-specific types and interfaces

import { FilterParams, PaginatedResult, ServiceResult } from '../common';

// Re-export filter types
export * from './filters';

// Generic service interfaces
export interface BaseService<T, TCreate, TUpdate, TFilters = FilterParams> {
  getById(id: string): Promise<ServiceResult<T>>;
  getAll(filters?: TFilters): Promise<ServiceResult<PaginatedResult<T>>>;
  create(data: TCreate): Promise<ServiceResult<T>>;
  update(id: string, data: TUpdate): Promise<ServiceResult<T>>;
  delete(id: string): Promise<ServiceResult<void>>;
}

// Search and filter interfaces
export interface SearchableService<T, TFilters = FilterParams> {
  search(query: string, filters?: TFilters): Promise<ServiceResult<T[]>>;
}

export interface CacheableService {
  clearCache(key?: string): Promise<ServiceResult<void>>;
  refreshCache(key?: string): Promise<ServiceResult<void>>;
}

// Batch operation interfaces
export interface BatchService<T, TCreate, TUpdate> {
  createMany(data: TCreate[]): Promise<ServiceResult<T[]>>;
  updateMany(updates: Array<{ id: string; data: TUpdate }>): Promise<ServiceResult<T[]>>;
  deleteMany(ids: string[]): Promise<ServiceResult<void>>;
}

// Service operation context
export interface ServiceContext {
  userId?: string;
  userRole?: string;
  requestId?: string;
  timestamp: Date;
  source: 'web' | 'api' | 'admin' | 'system';
}

// Service configuration
export interface ServiceConfig {
  enableCache?: boolean;
  cacheTimeout?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

// Service health check
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    timestamp: Date;
  }>;
  uptime: number;
  version: string;
}
