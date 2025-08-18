/**
 * Test configuration and constants
 */

// Test timeouts
export const TEST_TIMEOUTS = {
  UNIT: 5000,
  INTEGRATION: 10000,
  E2E: 30000,
} as const;

// Test data constants
export const TEST_DATA = {
  VALID_EMAIL: 'test@example.com',
  INVALID_EMAIL: 'invalid-email',
  VALID_PASSWORD: 'SecurePassword123!',
  WEAK_PASSWORD: '123',
  VALID_PHONE: '+1234567890',
  INVALID_PHONE: '123',
  VALID_POSTAL_CODE: '12345',
  INVALID_POSTAL_CODE: 'ABC',
} as const;

// Mock API endpoints
export const MOCK_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CART: '/api/cart',
  ORDERS: '/api/orders',
  AUTH: '/api/auth',
  PROFILE: '/api/profile',
  CATEGORIES: '/api/categories',
} as const;

// Test environment configuration
export const TEST_ENV = {
  SUPABASE_URL: 'http://localhost:54321',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  UPLOADTHING_SECRET: 'test-uploadthing-secret',
  UPLOADTHING_APP_ID: 'test-app-id',
} as const;

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  SERVICE_RESPONSE_TIME: 100, // ms
  COMPONENT_RENDER_TIME: 50, // ms
  API_RESPONSE_TIME: 200, // ms
} as const;

// Accessibility test configurations
export const A11Y_CONFIG = {
  WCAG_LEVEL: 'AA',
  TAGS: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  RULES: {
    'color-contrast': { enabled: true },
    'keyboard': { enabled: true },
    'aria-allowed-attr': { enabled: true },
    'aria-required-attr': { enabled: true },
  },
} as const;

// Test coverage thresholds
export const COVERAGE_THRESHOLDS = {
  STATEMENTS: 80,
  BRANCHES: 75,
  FUNCTIONS: 80,
  LINES: 80,
} as const;

// Mock user roles for testing
export const MOCK_USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

// Test database states
export const TEST_DB_STATES = {
  EMPTY: 'empty',
  WITH_PRODUCTS: 'with_products',
  WITH_USERS: 'with_users',
  WITH_ORDERS: 'with_orders',
  FULL: 'full',
} as const;

// Error codes for testing
export const TEST_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

// Test scenarios
export const TEST_SCENARIOS = {
  HAPPY_PATH: 'happy_path',
  ERROR_HANDLING: 'error_handling',
  EDGE_CASES: 'edge_cases',
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility',
  SECURITY: 'security',
} as const;