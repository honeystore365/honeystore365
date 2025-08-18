import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import React, { ReactElement } from 'react';

// Mock messages for testing
const messages = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  navigation: {
    home: 'Home',
    products: 'Products',
    cart: 'Cart',
    profile: 'Profile',
  },
  products: {
    title: 'Products',
    description: 'Description',
    price: 'Price',
    addToCart: 'Add to Cart',
  },
};

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale='ar' messages={messages}>
        {children}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockProduct = (overrides = {}) => ({
  id: '1',
  name: 'Test Honey',
  description: 'Test honey description',
  price: 100,
  stock: 10,
  imageUrl: '/test-image.jpg',
  category: {
    id: '1',
    name: 'Natural Honey',
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCart = (overrides = {}) => ({
  id: '1',
  customerId: '1',
  items: [],
  totalAmount: 0,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockOrder = (overrides = {}) => ({
  id: '1',
  customerId: '1',
  items: [],
  totalAmount: 0,
  status: 'pending' as const,
  shippingAddress: {
    street: 'Test Street',
    city: 'Test City',
    postalCode: '12345',
    country: 'Test Country',
  },
  paymentMethod: 'cash_on_delivery' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCartItem = (overrides = {}) => ({
  id: '1',
  cartId: '1',
  productId: '1',
  product: createMockProduct(),
  quantity: 1,
  price: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockOrderItem = (overrides = {}) => ({
  id: '1',
  orderId: '1',
  productId: '1',
  product: createMockProduct(),
  quantity: 1,
  price: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAddress = (overrides = {}) => ({
  id: '1',
  userId: '1',
  street: 'Test Street',
  city: 'Test City',
  state: 'Test State',
  postalCode: '12345',
  country: 'Test Country',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCategory = (overrides = {}) => ({
  id: '1',
  name: 'Natural Honey',
  description: 'Pure natural honey products',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Test utilities for async operations
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

// Mock service responses
export const createMockServiceSuccess = <T>(data: T) => ({
  success: true as const,
  data,
  error: null,
});

export const createMockServiceError = (message: string, code?: string) => ({
  success: false as const,
  data: null,
  error: {
    message,
    code: code || 'UNKNOWN_ERROR',
    details: null,
  },
});

// Form testing utilities
export const fillForm = async (fields: Record<string, string>) => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  
  for (const [label, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(label, 'i'));
    await user.clear(field);
    await user.type(field, value);
  }
  
  return user;
};

export const submitForm = async (buttonText = /submit|save|confirm/i) => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  const submitButton = screen.getByRole('button', { name: buttonText });
  await user.click(submitButton);
  return user;
};
