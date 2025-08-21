import * as cartActions from '@/actions/cartActions';
import { createMockProduct, createMockUser } from '../../utils/test-utils';

// Mock the createClientServer function
jest.mock('@/lib/supabase/server', () => ({
  createClientServer: jest.fn(),
}));

// Mock the security module
jest.mock('@/lib/security', () => {
  const original = jest.requireActual('@/lib/security');
  return {
    ...original,
    createAuthenticatedAction: (name: string, schema?: any) => {
      return (handler: any) => {
        return async (input: any) => {
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

describe('Cart Workflow Integration Tests', () => {
  let mockSupabase: any;
  const mockUser = createMockUser();
  const mockProduct = createMockProduct();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh mock for each test
    mockSupabase = {
      from: jest.fn(),
    };
    
    (require('@/lib/supabaseClientServer').createClientServer as jest.Mock)
      .mockResolvedValue(mockSupabase);
  });

  describe('Complete Cart Workflow', () => {
    it('should handle complete cart workflow: add -> update -> view -> remove', async () => {
      // Setup mocks for the entire workflow
      let cartItems: any[] = [];
      let cartId = 'cart-1';

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
              data: { id: cartId },
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
            single: jest.fn().mockImplementation(() => {
              const existingItem = cartItems.find(item => 
                item.product_id === mockProduct.id && item.cart_id === cartId
              );
              return {
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: existingItem || null,
                  error: existingItem ? null : { code: 'PGRST116' },
                }),
              };
            }),
            insert: jest.fn().mockImplementation((data) => {
              const newItem = {
                id: `cart-item-${cartItems.length + 1}`,
                cart_id: cartId,
                product_id: data.product_id,
                quantity: data.quantity,
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
            update: jest.fn().mockImplementation((data) => {
              const itemIndex = cartItems.findIndex(item => item.id === data.id);
              if (itemIndex >= 0) {
                cartItems[itemIndex] = { ...cartItems[itemIndex], ...data };
              }
              return {
                eq: jest.fn().mockReturnThis(),
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
            delete: jest.fn().mockImplementation(() => {
              return {
                eq: jest.fn().mockImplementation((field, value) => {
                  if (field === 'id') {
                    cartItems = cartItems.filter(item => item.id !== value);
                  }
                  return {
                    mockResolvedValue: jest.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  };
                }),
              };
            }),
            mockResolvedValue: jest.fn().mockResolvedValue({
              data: cartItems.map(item => ({
                ...item,
                products: mockProduct,
              })),
              error: null,
            }),
          };
        }
        
        return {};
      });

      // Step 1: Add item to cart
      const addResult = await cartActions.addItemToCart({
        productId: mockProduct.id,
        quantity: 2,
      });
      
      expect(addResult.success).toBe(true);
      expect(addResult.message).toBe('Item added to cart.');

      // Step 2: Update item quantity
      const cartItemId = cartItems[0]?.id;
      expect(cartItemId).toBeDefined();

      const updateResult = await cartActions.updateCartItemQuantity({
        cartItemId,
        quantity: 3,
      });
      
      expect(updateResult.success).toBe(true);
      expect(updateResult.message).toBe('Item quantity updated.');

      // Step 3: View cart items
      const viewResult = await cartActions.getCartItems();
      
      expect(viewResult.error).toBeNull();
      expect(viewResult.items).toHaveLength(1);
      expect(viewResult.total).toBeGreaterThan(0);

      // Step 4: Remove item from cart
      const removeResult = await cartActions.removeCartItem({
        cartItemId,
      });
      
      expect(removeResult.success).toBe(true);
      expect(removeResult.message).toBe('Item removed from cart.');

      // Step 5: Verify cart is empty
      const finalViewResult = await cartActions.getCartItems();
      expect(finalViewResult.items).toHaveLength(0);
      expect(finalViewResult.total).toBe(0);
    });

    it('should handle adding multiple different products to cart', async () => {
      // Arrange
      const mockProduct2 = createMockProduct({ 
        id: '2', 
        name: 'Another Honey', 
        price: 150 
      });
      
      let cartItems: any[] = [];
      const cartId = 'cart-1';

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockImplementation((field, value) => ({
              single: jest.fn().mockResolvedValue({
                data: value === '1' ? mockProduct : mockProduct2,
                error: null,
              }),
            })),
          };
        }
        
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: cartId },
              error: null,
            }),
          };
        }
        
        if (table === 'cart_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockImplementation(() => ({
              mockResolvedValue: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            })),
            insert: jest.fn().mockImplementation((data) => {
              const newItem = {
                id: `cart-item-${cartItems.length + 1}`,
                cart_id: cartId,
                product_id: data.product_id,
                quantity: data.quantity,
              };
              cartItems.push(newItem);
              return {
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: newItem,
                  error: null,
                }),
              };
            }),
            mockResolvedValue: jest.fn().mockResolvedValue({
              data: cartItems.map(item => ({
                ...item,
                products: item.product_id === '1' ? mockProduct : mockProduct2,
              })),
              error: null,
            }),
          };
        }
        
        return {};
      });

      // Act - Add first product
      const addResult1 = await cartActions.addItemToCart({
        productId: mockProduct.id,
        quantity: 2,
      });

      // Act - Add second product
      const addResult2 = await cartActions.addItemToCart({
        productId: mockProduct2.id,
        quantity: 1,
      });

      // Act - View cart
      const viewResult = await cartActions.getCartItems();

      // Assert
      expect(addResult1.success).toBe(true);
      expect(addResult2.success).toBe(true);
      expect(viewResult.items).toHaveLength(2);
      expect(viewResult.total).toBe(350); // (100 * 2) + (150 * 1)
    });

    it('should handle stock validation during cart operations', async () => {
      // Arrange
      const lowStockProduct = createMockProduct({ 
        stock: 2 // Only 2 items in stock
      });

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
          };
        }
        
        return {};
      });

      // Act & Assert - Try to add more than available stock
      await expect(cartActions.addItemToCart({
        productId: lowStockProduct.id,
        quantity: 5, // More than available stock (2)
      })).rejects.toThrow('Insufficient stock');
    });

    it('should handle cart clearing workflow', async () => {
      // Arrange
      let cartItems = [
        {
          id: 'cart-item-1',
          cart_id: 'cart-1',
          product_id: mockProduct.id,
          quantity: 2,
          products: mockProduct,
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
            delete: jest.fn().mockImplementation(() => {
              cartItems = []; // Clear all items
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

      // Act - Clear cart
      const clearResult = await cartActions.clearCart();

      // Act - View cart after clearing
      const viewResult = await cartActions.getCartItems();

      // Assert
      expect(clearResult.success).toBe(true);
      expect(clearResult.message).toBe('Cart cleared successfully.');
      expect(viewResult.items).toHaveLength(0);
      expect(viewResult.total).toBe(0);
    });
  });
});