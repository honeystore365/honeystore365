import * as cartActions from '@/actions/cartActions';
import { setupIntegrationTest } from '../../utils/test-env-setup';

// Mock the createClientServer function
jest.mock('@/lib/supabaseClientServer', () => ({
  createClientServer: jest.fn().mockImplementation(() => ({
    from: jest.fn().mockImplementation((table) => {
      if (table === 'products') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: '1',
              name: 'Test Honey',
              price: 100,
              stock: 10,
            },
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
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
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
          update: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
          delete: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
    }),
  })),
}));

// Mock the security module
jest.mock('@/lib/security', () => {
  const original = jest.requireActual('@/lib/security');
  return {
    ...original,
    createAuthenticatedAction: (name: string, schema?: any) => {
      return (handler: any) => {
        return async (input: any) => {
          // Simplified mock that bypasses authentication
          return handler(input, { userId: 'test-user-id', actionName: name, timestamp: new Date() });
        };
      };
    },
  };
});

// Mock the revalidatePath function
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Setup the test environment
setupIntegrationTest();

describe('Cart Actions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addItemToCart', () => {
    it('should add a new item to the cart', async () => {
      // Arrange
      const input = { productId: '1', quantity: 2 };

      // Act
      const result = await cartActions.addItemToCart(input);

      // Assert
      expect(result).toEqual({ success: true, message: 'Item added to cart.' });
    });

    it('should handle insufficient stock', async () => {
      // Arrange
      const input = { productId: '1', quantity: 20 }; // More than available stock

      // Mock the product with low stock
      jest.mock('@/lib/supabaseClientServer', () => ({
        createClientServer: jest.fn().mockImplementation(() => ({
          from: jest.fn().mockImplementation((table) => {
            if (table === 'products') {
              return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: '1',
                    name: 'Test Honey',
                    price: 100,
                    stock: 5, // Only 5 in stock
                  },
                  error: null,
                }),
              };
            }
            // Other mocks remain the same
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }),
        })),
      }));

      // Act & Assert
      await expect(cartActions.addItemToCart(input)).rejects.toThrow('Insufficient stock');
    });
  });

  describe('getCartItems', () => {
    it('should retrieve cart items successfully', async () => {
      // Arrange
      // Mock the cart items query
      jest.mock('@/lib/supabaseClientServer', () => ({
        createClientServer: jest.fn().mockImplementation(() => ({
          from: jest.fn().mockImplementation((table) => {
            if (table === 'cart_items') {
              return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis(),
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: [
                    {
                      id: 'cart-item-1',
                      quantity: 2,
                      products: {
                        id: '1',
                        name: 'Test Honey',
                        price: 100,
                        stock: 10,
                      },
                    },
                  ],
                  error: null,
                }),
              };
            }
            // Other mocks remain the same
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: { id: 'cart-1' },
                error: null,
              }),
            };
          }),
        })),
      }));

      // Act
      const result = await cartActions.getCartItems();

      // Assert
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result.error).toBeNull();
    });
  });

  describe('removeCartItem', () => {
    it('should remove an item from the cart', async () => {
      // Arrange
      const input = { cartItemId: 'cart-item-1' };

      // Mock the cart item query to return a valid item
      jest.mock('@/lib/supabaseClientServer', () => ({
        createClientServer: jest.fn().mockImplementation(() => ({
          from: jest.fn().mockImplementation((table) => {
            if (table === 'cart_items') {
              return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'cart-item-1',
                    carts: { customer_id: 'test-user-id' },
                  },
                  error: null,
                }),
                delete: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }
            // Other mocks remain the same
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }),
        })),
      }));

      // Act
      const result = await cartActions.removeCartItem(input);

      // Assert
      expect(result).toEqual({ success: true, message: 'Item removed from cart.' });
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update the quantity of a cart item', async () => {
      // Arrange
      const input = { cartItemId: 'cart-item-1', quantity: 3 };

      // Mock the cart item query to return a valid item
      jest.mock('@/lib/supabaseClientServer', () => ({
        createClientServer: jest.fn().mockImplementation(() => ({
          from: jest.fn().mockImplementation((table) => {
            if (table === 'cart_items') {
              return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'cart-item-1',
                    quantity: 2,
                    product_id: '1',
                    carts: { customer_id: 'test-user-id' },
                    products: { stock: 10, name: 'Test Honey' },
                  },
                  error: null,
                }),
                update: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }
            // Other mocks remain the same
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }),
        })),
      }));

      // Act
      const result = await cartActions.updateCartItemQuantity(input);

      // Assert
      expect(result).toEqual({ success: true, message: 'Item quantity updated.' });
    });

    it('should remove the item if quantity is 0', async () => {
      // Arrange
      const input = { cartItemId: 'cart-item-1', quantity: 0 };

      // Mock removeCartItem to verify it's called
      const removeCartItemSpy = jest.spyOn(cartActions, 'removeCartItem')
        .mockResolvedValue({ success: true, message: 'Item removed from cart.' });

      // Act
      const result = await cartActions.updateCartItemQuantity(input);

      // Assert
      expect(removeCartItemSpy).toHaveBeenCalledWith({ cartItemId: 'cart-item-1' });
      expect(result).toEqual({ success: true, message: 'Item removed from cart.' });
    });
  });

  describe('clearCart', () => {
    it('should clear all items from the cart', async () => {
      // Arrange
      // Mock the cart items delete query
      jest.mock('@/lib/supabaseClientServer', () => ({
        createClientServer: jest.fn().mockImplementation(() => ({
          from: jest.fn().mockImplementation((table) => {
            if (table === 'cart_items') {
              return {
                delete: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
                eq: jest.fn().mockReturnThis(),
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
            // Other mocks remain the same
            return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            };
          }),
        })),
      }));

      // Act
      const result = await cartActions.clearCart();

      // Assert
      expect(result).toEqual({ success: true, message: 'Cart cleared successfully.' });
    });
  });
});