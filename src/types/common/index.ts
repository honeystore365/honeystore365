// Common base types and interfaces

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata?: ServiceMetadata;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp?: Date;
}

export interface ServiceMetadata {
  requestId?: string;
  timestamp: Date;
  executionTime?: number;
  source?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
