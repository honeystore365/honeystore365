/**
 * Basic Integration Tests
 * Tests the integration between different parts of the application
 */

// Mock environment variables first
process.env.NODE_ENV = 'development';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.UPLOADTHING_TOKEN = 'test-uploadthing-token';
process.env.UPLOADTHING_SECRET = 'test-uploadthing-secret';

// Mock the createClientServer function
jest.mock('@/lib/supabaseClientServer', () => ({
  createClientServer: jest.fn(),
}));

// Mock the security module
jest.mock('@/lib/security', () => {
  const original = jest.requireActual('@/lib/security');
  return {
    ...original,
    createAuthenticatedAction: (name: string) => {
      return (handler: any) => {
        return async (input: any) => {
          return handler(input, { userId: 'test-user-id', actionName: name, timestamp: new Date() });
        };
      };
    },
    createPublicAction: (name: string) => {
      return (handler: any) => {
        return async (input: any) => {
          return handler(input, { actionName: name, timestamp: new Date() });
        };
      };
    },
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import * as authActions from '@/actions/authActions';
import * as cartActions from '@/actions/cartActions';

describe('Basic Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh mock for each test
    mockSupabase = {
      auth: {
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    
    (require('@/lib/supabaseClientServer').createClientServer as jest.Mock)
      .mockResolvedValue(mockSupabase);
  });

  describe('Authentication Integration', () => {
    it('should handle user login successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: { role: 'customer' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockUser,
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
          },
        },
        error: null,
      });

      const redirectMock = require('next/navigation').redirect;

      // Act
      await authActions.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(redirectMock).toHaveBeenCalledWith('/profile');
    });

    it('should handle login failure', async () => {
      // Arrange
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const redirectMock = require('next/navigation').redirect;

      // Act
      await authActions.signIn({
        email: 'wrong@example.com',
        password: 'wrongpass',
      });

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Invalid%20credentials'
      );
    });
  });

  describe('Cart Operations Integration', () => {
    it('should add item to cart successfully', async () => {
      // Arrange
      const mockProduct = {
        id: '1',
        name: 'Test Honey',
        price: 100,
        stock: 10,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockProduct,
              error: null,
            }),
          };
        }
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'cart-1' },
              error: null,
            }),
          };
        }
        if (table === 'cart_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
            insert: jest.fn().mockResolvedValue({
              data: { id: 'cart-item-1' },
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const result = await cartActions.addItemToCart({
        productId: '1',
        quantity: 2,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Item added to cart.');
    });

    it('should handle insufficient stock', async () => {
      // Arrange
      const mockProduct = {
        id: '1',
        name: 'Test Honey',
        price: 100,
        stock: 1, // Only 1 in stock
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockProduct,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(cartActions.addItemToCart({
        productId: '1',
        quantity: 5, // More than available
      })).rejects.toThrow('Insufficient stock');
    });

    it('should get cart items successfully', async () => {
      // Arrange
      const mockCartItems = [
        {
          id: 'cart-item-1',
          quantity: 2,
          products: {
            id: '1',
            name: 'Test Honey',
            price: 100,
          },
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'cart-1' },
              error: null,
            }),
          };
        }
        if (table === 'cart_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            mockResolvedValue: jest.fn().mockResolvedValue({
              data: mockCartItems,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const result = await cartActions.getCartItems();

      // Assert
      expect(result.error).toBeNull();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(200); // 2 * 100
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act & Assert
      await expect(cartActions.addItemToCart({
        productId: '1',
        quantity: 1,
      })).rejects.toThrow('Database connection failed');
    });

    it('should handle authentication errors', async () => {
      // Arrange
      mockSupabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Network error')
      );

      // Act & Assert
      await expect(authActions.signIn({
        email: 'test@example.com',
        password: 'password123',
      })).rejects.toThrow('Network error');
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate product data before adding to cart', async () => {
      // Arrange
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null, // Product not found
              error: { code: 'PGRST116' },
            }),
          };
        }
        return {};
      });

      // Act & Assert
      await expect(cartActions.addItemToCart({
        productId: 'non-existent',
        quantity: 1,
      })).rejects.toThrow('Product not found');
    });

    it('should validate email format in authentication', async () => {
      // Arrange
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      });

      const redirectMock = require('next/navigation').redirect;

      // Act
      await authActions.signIn({
        email: 'invalid-email',
        password: 'password123',
      });

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Invalid%20email%20format'
      );
    });
  });
});