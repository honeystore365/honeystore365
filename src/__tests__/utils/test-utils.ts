/**
 * Test utilities for rendering components and creating mock data
 */
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from './test-env-setup';

/**
 * Custom render function that includes providers
 */
export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient }
) {
  const queryClient = options?.queryClient || createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...options }),
    user: userEvent.setup(),
  };
}

/**
 * Create a mock service success response
 */
export function createMockServiceSuccess<T>(data: T) {
  return {
    success: true,
    data,
    error: null,
  };
}

/**
 * Create a mock service error response
 */
export function createMockServiceError(message: string, code?: string) {
  return {
    success: false,
    data: null,
    error: {
      message,
      code: code || 'UNKNOWN_ERROR',
    },
  };
}

/**
 * Create a mock product
 */
export function createMockProduct(overrides?: Partial<any>) {
  return {
    id: '1',
    name: 'Test Honey',
    description: 'A delicious honey for testing',
    price: 100,
    stock: 10,
    imageUrl: '/images/test-honey.jpg',
    category: { id: '1', name: 'Raw Honey' },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock user
 */
export function createMockUser(overrides?: Partial<any>) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock cart
 */
export function createMockCart(overrides?: Partial<any>) {
  return {
    id: 'cart-1',
    customerId: 'user-1',
    items: [createMockProduct({ quantity: 1 })],
    totalAmount: 100,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock order
 */
export function createMockOrder(overrides?: Partial<any>) {
  return {
    id: 'order-1',
    customerId: 'user-1',
    items: [createMockProduct({ quantity: 1 })],
    totalAmount: 100,
    status: 'pending',
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
    },
    paymentMethod: 'cash_on_delivery',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';