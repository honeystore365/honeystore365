/**
 * Test environment setup utilities
 * This file contains utilities for setting up the test environment
 */

import { QueryClient } from '@tanstack/react-query';
import { resetSupabaseMocks } from '../mocks/supabase';

// Import MSW server conditionally
let server: any;
try {
  server = require('../mocks/server').server;
} catch (error) {
  console.warn('MSW server import failed:', error);
}

/**
 * Creates a new QueryClient for testing
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });

/**
 * Sets up the test environment for component tests
 */
export const setupComponentTest = () => {
  // Mock console.error to avoid noisy React warnings
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = (...args: any[]) => {
      if (
        /Warning.*not wrapped in act/i.test(args[0]) ||
        /Warning.*ReactDOM.render is no longer supported/i.test(args[0])
      ) {
        return;
      }
      originalConsoleError(...args);
    };
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });
};

/**
 * Sets up the test environment for integration tests
 */
export const setupIntegrationTest = () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    resetSupabaseMocks();
  });

  afterAll(() => {
    server.close();
  });
};

/**
 * Sets up the test environment for API tests
 */
export const setupApiTest = () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
};

/**
 * Sets up the test environment for unit tests
 */
export const setupUnitTest = () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
};

/**
 * Mocks the window.matchMedia function
 */
export const mockMatchMedia = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

/**
 * Mocks the IntersectionObserver API
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

/**
 * Mocks the ResizeObserver API
 */
export const mockResizeObserver = () => {
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
};

/**
 * Mocks the fetch API
 */
export const mockFetch = () => {
  global.fetch = jest.fn();
};

/**
 * Mocks the localStorage API
 */
export const mockLocalStorage = () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
};

/**
 * Mocks the sessionStorage API
 */
export const mockSessionStorage = () => {
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  });
};