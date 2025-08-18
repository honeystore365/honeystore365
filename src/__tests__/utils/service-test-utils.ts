import { jest } from '@jest/globals';
import { mockSupabaseClient, resetSupabaseMocks } from '../mocks/supabase';

/**
 * Utility functions for testing services
 */

// Service test setup
export const setupServiceTest = () => {
  beforeEach(() => {
    resetSupabaseMocks();
  });
};

// Mock service dependencies
export const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

export const mockErrorHandler = {
  logError: jest.fn(),
  handleClientError: jest.fn(),
  handleServerError: jest.fn(),
};

// Database operation mocks
export const mockDatabaseSuccess = <T>(data: T) => {
  mockSupabaseClient.then.mockResolvedValueOnce({
    data,
    error: null,
    status: 200,
    statusText: 'OK',
  });
};

export const mockDatabaseError = (message: string, code = 'DATABASE_ERROR') => {
  mockSupabaseClient.then.mockResolvedValueOnce({
    data: null,
    error: {
      message,
      code,
      details: null,
      hint: null,
    },
    status: 400,
    statusText: 'Bad Request',
  });
};

// Authentication mocks
export const mockAuthenticatedUser = (userId = 'test-user-id') => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email: 'test@example.com',
        user_metadata: {
          firstName: 'Test',
          lastName: 'User',
        },
        app_metadata: {
          role: 'customer',
        },
      },
    },
    error: null,
  });
};

export const mockUnauthenticatedUser = () => {
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  });
};

// Validation test helpers
export const testValidationError = async (
  serviceMethod: () => Promise<any>,
  expectedErrorMessage: string
) => {
  const result = await serviceMethod();
  expect(result.success).toBe(false);
  expect(result.error?.message).toContain(expectedErrorMessage);
};

export const testValidationSuccess = async (
  serviceMethod: () => Promise<any>,
  expectedData?: any
) => {
  const result = await serviceMethod();
  expect(result.success).toBe(true);
  if (expectedData) {
    expect(result.data).toEqual(expectedData);
  }
};

// Performance testing utilities
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

export const expectExecutionTimeUnder = async (
  fn: () => Promise<any>,
  maxTimeMs: number
) => {
  const executionTime = await measureExecutionTime(fn);
  expect(executionTime).toBeLessThan(maxTimeMs);
};

// Cache testing utilities
export const mockCacheHit = <T>(data: T) => {
  // Mock cache implementation would go here
  return data;
};

export const mockCacheMiss = () => {
  // Mock cache miss implementation
  return null;
};

// Error scenario testing
export const testErrorScenarios = {
  networkError: () => {
    mockSupabaseClient.then.mockRejectedValue(new Error('Network error'));
  },
  
  timeoutError: () => {
    mockSupabaseClient.then.mockImplementation(
      () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      )
    );
  },
  
  unauthorizedError: () => {
    mockDatabaseError('Unauthorized', 'UNAUTHORIZED');
  },
  
  forbiddenError: () => {
    mockDatabaseError('Forbidden', 'FORBIDDEN');
  },
  
  notFoundError: () => {
    mockDatabaseError('Not found', 'NOT_FOUND');
  },
  
  validationError: (field: string) => {
    mockDatabaseError(`Validation failed for ${field}`, 'VALIDATION_ERROR');
  },
};

// Cleanup utilities
export const cleanupServiceTest = () => {
  afterEach(() => {
    jest.clearAllMocks();
    resetSupabaseMocks();
  });
};