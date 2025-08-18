// Service filter and search parameter types

import { FilterParams, PaginationParams } from '../common';
import { OrderStatus, PaymentMethod, ProductStatus, UserRole } from '../enums';

// Base filter interfaces
export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface PriceRangeFilter {
  minPrice?: number;
  maxPrice?: number;
}

export interface StatusFilter<T extends string> {
  status?: T;
  statuses?: T[];
}

// Product service filters
export interface ProductSearchFilters extends FilterParams, PriceRangeFilter {
  categoryId?: string;
  categoryIds?: string[];
  inStock?: boolean;
  status?: ProductStatus;
  tags?: string[];
  featured?: boolean;
  rating?: {
    min?: number;
    max?: number;
  };
}

// User service filters
export interface UserSearchFilters extends FilterParams, DateRangeFilter {
  role?: UserRole;
  roles?: UserRole[];
  isActive?: boolean;
  emailVerified?: boolean;
  hasOrders?: boolean;
}

// Order service filters
export interface OrderSearchFilters extends FilterParams, DateRangeFilter, PriceRangeFilter {
  customerId?: string;
  status?: OrderStatus;
  statuses?: OrderStatus[];
  paymentMethod?: PaymentMethod;
  paymentMethods?: PaymentMethod[];
  hasTracking?: boolean;
}

// Cart service filters
export interface CartSearchFilters extends FilterParams, DateRangeFilter {
  customerId?: string;
  hasItems?: boolean;
  abandoned?: boolean;
  minItems?: number;
  maxItems?: number;
}

// Advanced search parameters
export interface AdvancedSearchParams<T = any> extends PaginationParams {
  query?: string;
  filters?: T;
  sort?: SortOptions[];
  include?: string[];
  exclude?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
  nullsFirst?: boolean;
}

// Aggregation and analytics filters
export interface AnalyticsFilters extends DateRangeFilter {
  groupBy?: 'day' | 'week' | 'month' | 'year';
  metrics?: string[];
  dimensions?: string[];
}

// Export all filter types
export type ServiceFilters = ProductSearchFilters | UserSearchFilters | OrderSearchFilters | CartSearchFilters;
