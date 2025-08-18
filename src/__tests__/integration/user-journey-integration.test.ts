/**
 * User Journey Integration Tests
 * Tests critical user workflows end-to-end
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

describe('User Journey Integration Tests', () => {
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

  describe('Complete Shopping Journey', () => {
    it('should handle complete shopping workflow: login -> add to cart -> view cart -> clear cart', async () => {
      // Step 1: User Login
      const mockUser = {
        id: 'user-1',
        email: 'customer@example.com',
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

      await authActions.signIn({
        email: 'customer@example.com',
        password: 'password123',
      });

      expect(redirectMock).toHaveBeenCalledWith('/profile');

      // Step 2: Add items to cart
      const mockProduct = {
        id: '1',
        name: 'Premium Honey',
        price: 150,
        stock: 10,
      };

      let cartItems: any[] = [];

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
            insert: jest.fn().mockImplementation((data) => {
              const newItem = {
                id: `cart-item-${cartItems.length + 1}`,
                ...data,
                products: mockProduct,
              };
              cartItems.push(newItem);
              return {
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: newItem,
                  error: null,
                }),
              };
            }),
            delete: jest.fn().mockImplementation(() => {
              cartItems = [];
              return {
                eq: jest.fn().mockReturnThis(),
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
            mockResolvedValue: jest.fn().mockResolvedValue({
              data: cartItems,
              error: null,
            }),
          };
        }
        return {};
      });

      const addResult = await cartActions.addItemToCart({
        productId: '1',
        quantity: 2,
      });

      expect(addResult.success).toBe(true);
      expect(cartItems).toHaveLength(1);

      // Step 3: View cart
      const viewResult = await cartActions.getCartItems();

      expect(viewResult.error).toBeNull();
      expect(viewResult.items).toHaveLength(1);
      expect(viewResult.total).toBe(300); // 2 * 150

      // Step 4: Clear cart
      const clearResult = await cartActions.clearCart();

      expect(clearResult.success).toBe(true);
      expect(cartItems).toHaveLength(0);
    });

    it('should handle admin user workflow', async () => {
      // Arrange
      const adminUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        user_metadata: { role: 'admin' },
      };

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: adminUser,
          session: {
            access_token: 'admin-token',
            refresh_token: 'admin-refresh',
          },
        },
        error: null,
      });

      const redirectMock = require('next/navigation').redirect;

      // Act
      await authActions.signIn({
        email: 'admin@example.com',
        password: 'admin123',
      });

      // Assert
      expect(redirectMock).toHaveBeenCalledWith('/admin');
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle cart operations with product stock issues', async () => {
      // Arrange
      const lowStockProduct = {
        id: '1',
        name: 'Limited Honey',
        price: 200,
        stock: 1, // Only 1 in stock
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: lowStockProduct,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act & Assert - Try to add more than available
      await expect(cartActions.addItemToCart({
        productId: '1',
        quantity: 5,
      })).rejects.toThrow('Insufficient stock');

      // Act - Add available quantity
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: lowStockProduct,
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

      const result = await cartActions.addItemToCart({
        productId: '1',
        quantity: 1,
      });

      expect(result.success).toBe(true);
    });

    it('should handle authentication failures gracefully', async () => {
      // Arrange
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const redirectMock = require('next/navigation').redirect;

      // Act
      await authActions.signIn({
        email: 'wrong@example.com',
        password: 'wrongpass',
      });

      // Assert
      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Invalid%20login%20credentials'
      );
    });

    it('should handle database connection failures', async () => {
      // Arrange
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act & Assert
      await expect(cartActions.getCartItems()).rejects.toThrow('Database connection failed');
    });
  });

  describe('Multi-User Scenarios', () => {
    it('should handle concurrent cart operations', async () => {
      // Arrange
      const mockProduct = {
        id: '1',
        name: 'Popular Honey',
        price: 100,
        stock: 10,
      };

      let cartItems1: any[] = [];
      let cartItems2: any[] = [];

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
            single: jest.fn().mockImplementation(() => {
              // Simulate different carts for different calls
              const callCount = mockSupabase.from.mock.calls.length;
              return {
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: { id: `cart-${callCount % 2 + 1}` },
                  error: null,
                }),
              };
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
            insert: jest.fn().mockImplementation((data) => {
              // Simulate adding to different carts
              const targetCart = data.cart_id === 'cart-1' ? cartItems1 : cartItems2;
              const newItem = {
                id: `cart-item-${targetCart.length + 1}`,
                ...data,
                products: mockProduct,
              };
              targetCart.push(newItem);
              return {
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: newItem,
                  error: null,
                }),
              };
            }),
          };
        }
        return {};
      });

      // Act - Simulate concurrent operations
      const promises = [
        cartActions.addItemToCart({ productId: '1', quantity: 2 }),
        cartActions.addItemToCart({ productId: '1', quantity: 3 }),
      ];

      const results = await Promise.all(promises);

      // Assert
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      // Each operation should succeed independently
    });
  });

  describe('Data Validation Workflows', () => {
    it('should validate user input throughout the workflow', async () => {
      // Test invalid product ID
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          };
        }
        return {};
      });

      await expect(cartActions.addItemToCart({
        productId: 'invalid-id',
        quantity: 1,
      })).rejects.toThrow('Product not found');

      // Test invalid email format
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid email format' },
      });

      const redirectMock = require('next/navigation').redirect;

      await authActions.signIn({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(redirectMock).toHaveBeenCalledWith(
        '/auth/login?message=Invalid%20email%20format'
      );
    });

    it('should handle edge cases in quantity validation', async () => {
      // Test zero quantity
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
        return {};
      });

      await expect(cartActions.addItemToCart({
        productId: '1',
        quantity: 0,
      })).rejects.toThrow('Quantity must be greater than 0');

      // Test negative quantity
      await expect(cartActions.addItemToCart({
        productId: '1',
        quantity: -1,
      })).rejects.toThrow('Quantity must be greater than 0');
    });
  });
});