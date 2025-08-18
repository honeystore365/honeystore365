import { CartServiceImpl } from '@/services/cart/cart.service';
import { productService } from '@/services/products/products.service';
import { mockSupabaseClient, resetSupabaseMocks } from '../../mocks/supabase';
import { setupUnitTest } from '../../utils/test-env-setup';
import { createMockProduct } from '../../utils/test-utils';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClientServer: jest.fn().mockImplementation(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock the product service
jest.mock('@/services/products/products.service', () => ({
  productService: {
    getProduct: jest.fn(),
  },
}));

// Setup the test environment
setupUnitTest();

describe('CartService', () => {
  let cartService: CartServiceImpl;
  const customerId = 'user-1';

  beforeEach(() => {
    resetSupabaseMocks();
    cartService = new CartServiceImpl();
    // Clear the cache before each test
    cartService.clearCache();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart when found', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customer_id: customerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cart_items: [
          {
            id: 'item-1',
            cart_id: 'cart-1',
            product_id: 'product-1',
            quantity: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            products: {
              id: 'product-1',
              name: 'Test Honey',
              description: 'A delicious honey for testing',
              price: 100,
              stock: 10,
              image_url: '/images/test-honey.jpg',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        ],
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.limit.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: mockCart,
        error: null,
      });

      // Act
      const result = await cartService.getOrCreateCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('cart-1');
      expect(result.data?.customerId).toBe(customerId);
      expect(result.data?.items.length).toBe(1);
      expect(result.data?.totalAmount).toBe(200); // 2 * 100
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('carts');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('customer_id', customerId);
    });

    it('should create new cart when none exists', async () => {
      // Arrange
      const mockNewCart = {
        id: 'new-cart-1',
        customer_id: customerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cart_items: [],
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.limit.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: mockNewCart,
        error: null,
      });

      // Act
      const result = await cartService.getOrCreateCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('new-cart-1');
      expect(result.data?.customerId).toBe(customerId);
      expect(result.data?.items.length).toBe(0);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        customer_id: customerId,
      });
    });

    it('should handle validation error for empty customer ID', async () => {
      // Act
      const result = await cartService.getOrCreateCart('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Customer ID is required');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.limit.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      });

      // Act
      const result = await cartService.getOrCreateCart(customerId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to fetch cart');
      expect(result.error?.code).toBe('CART_FETCH_ERROR');
    });

    it('should use cache for repeated calls', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customer_id: customerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cart_items: [],
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.limit.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: mockCart,
        error: null,
      });

      // Act
      await cartService.getOrCreateCart(customerId); // First call should hit the database
      mockSupabaseClient.from.mockClear(); // Clear the mock
      const result = await cartService.getOrCreateCart(customerId); // Second call should use cache

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled(); // Should not call the database again
    });
  });

  describe('addItem', () => {
    it('should add a new item to cart successfully', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 2;
      const mockProduct = createMockProduct({ id: productId, stock: 10 });

      // Mock product service
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockProduct,
      });

      // Mock getOrCreateCart
      const getOrCreateCartSpy = jest.spyOn(cartService, 'getOrCreateCart').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'cart-1',
          customerId,
          items: [],
          totalAmount: 0,
          totalItems: 0,
          status: 'active',
          expiresAt: new Date(),
          finalAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Mock check for existing item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      // Mock insert new item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock update cart timestamp
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      const result = await cartService.addItem(customerId, { productId, quantity });

      // Assert
      expect(result.success).toBe(true);
      expect(getOrCreateCartSpy).toHaveBeenCalledWith(customerId);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        cart_id: 'cart-1',
        product_id: productId,
        quantity,
      });
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should update quantity if item already exists in cart', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 2;
      const existingQuantity = 3;
      const mockProduct = createMockProduct({ id: productId, stock: 10 });

      // Mock product service
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockProduct,
      });

      // Mock getOrCreateCart
      jest.spyOn(cartService, 'getOrCreateCart').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'cart-1',
          customerId,
          items: [
            {
              id: 'item-1',
              cartId: 'cart-1',
              productId,
              product: mockProduct,
              quantity: existingQuantity,
              unitPrice: 100,
              totalPrice: 300,
              addedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          totalAmount: 300,
          totalItems: 3,
          status: 'active',
          expiresAt: new Date(),
          finalAmount: 300,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Mock check for existing item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: { id: 'item-1', quantity: existingQuantity },
        error: null,
      });

      // Mock update item quantity
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock update cart timestamp
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      const result = await cartService.addItem(customerId, { productId, quantity });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ quantity: existingQuantity + quantity });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'item-1');
    });

    it('should validate product exists before adding to cart', async () => {
      // Arrange
      const productId = 'nonexistent-product';
      const quantity = 2;

      // Mock product service to return not found
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: {
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
        },
      });

      // Act
      const result = await cartService.addItem(customerId, { productId, quantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Product not found');
      expect(result.error?.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should validate sufficient stock before adding to cart', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 20; // More than available stock
      const mockProduct = createMockProduct({ id: productId, stock: 10 });

      // Mock product service
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockProduct,
      });

      // Act
      const result = await cartService.addItem(customerId, { productId, quantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Insufficient stock');
      expect(result.error?.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should validate quantity is positive', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 0; // Invalid quantity

      // Act
      const result = await cartService.addItem(customerId, { productId, quantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Quantity must be greater than 0');
    });

    it('should validate quantity does not exceed maximum', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 101; // Exceeds maximum of 100

      // Act
      const result = await cartService.addItem(customerId, { productId, quantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Quantity cannot exceed 100');
    });

    it('should check total quantity against stock when adding to existing item', async () => {
      // Arrange
      const productId = 'product-1';
      const quantity = 6;
      const existingQuantity = 5;
      const mockProduct = createMockProduct({ id: productId, stock: 10 });

      // Mock product service
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockProduct,
      });

      // Mock getOrCreateCart
      jest.spyOn(cartService, 'getOrCreateCart').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'cart-1',
          customerId,
          items: [
            {
              id: 'item-1',
              cartId: 'cart-1',
              productId,
              product: mockProduct,
              quantity: existingQuantity,
              unitPrice: 100,
              totalPrice: 500,
              addedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          totalAmount: 500,
          totalItems: 5,
          status: 'active',
          expiresAt: new Date(),
          finalAmount: 500,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Mock check for existing item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: { id: 'item-1', quantity: existingQuantity },
        error: null,
      });

      // Act
      const result = await cartService.addItem(customerId, { productId, quantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Total quantity would exceed stock');
      expect(result.error?.code).toBe('INSUFFICIENT_STOCK');
    });
  });

  describe('updateItem', () => {
    it('should update item quantity successfully', async () => {
      // Arrange
      const itemId = 'item-1';
      const newQuantity = 3;

      // Mock get cart item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: {
          id: itemId,
          cart_id: 'cart-1',
          product_id: 'product-1',
          quantity: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          carts: {
            customer_id: customerId,
          },
          products: {
            id: 'product-1',
            name: 'Test Honey',
            description: 'A delicious honey for testing',
            price: 100,
            stock: 10,
            image_url: '/images/test-honey.jpg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        error: null,
      });

      // Mock update item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock update cart timestamp
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      const result = await cartService.updateItem(customerId, { itemId, quantity: newQuantity });

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ quantity: newQuantity });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', itemId);
    });

    it('should validate item exists', async () => {
      // Arrange
      const itemId = 'nonexistent-item';
      const newQuantity = 3;

      // Mock get cart item - not found
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      // Act
      const result = await cartService.updateItem(customerId, { itemId, quantity: newQuantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Cart item not found');
      expect(result.error?.code).toBe('CART_ITEM_NOT_FOUND');
    });

    it('should validate item belongs to customer', async () => {
      // Arrange
      const itemId = 'item-1';
      const newQuantity = 3;
      const differentCustomerId = 'different-user';

      // Mock get cart item - belongs to different customer
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: {
          id: itemId,
          cart_id: 'cart-2',
          product_id: 'product-1',
          quantity: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          carts: {
            customer_id: differentCustomerId,
          },
          products: {
            id: 'product-1',
            name: 'Test Honey',
            stock: 10,
          },
        },
        error: null,
      });

      // Act
      const result = await cartService.updateItem(customerId, { itemId, quantity: newQuantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Unauthorized cart access');
      expect(result.error?.code).toBe('UNAUTHORIZED_CART_ACCESS');
    });

    it('should validate sufficient stock for new quantity', async () => {
      // Arrange
      const itemId = 'item-1';
      const newQuantity = 15; // More than available stock

      // Mock get cart item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: {
          id: itemId,
          cart_id: 'cart-1',
          product_id: 'product-1',
          quantity: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          carts: {
            customer_id: customerId,
          },
          products: {
            id: 'product-1',
            name: 'Test Honey',
            description: 'A delicious honey for testing',
            price: 100,
            stock: 10, // Only 10 in stock
            image_url: '/images/test-honey.jpg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        error: null,
      });

      // Act
      const result = await cartService.updateItem(customerId, { itemId, quantity: newQuantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Insufficient stock');
      expect(result.error?.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should validate quantity is positive', async () => {
      // Arrange
      const itemId = 'item-1';
      const newQuantity = 0; // Invalid quantity

      // Act
      const result = await cartService.updateItem(customerId, { itemId, quantity: newQuantity });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Quantity must be greater than 0');
    });
  });

  describe('removeItem', () => {
    it('should remove item successfully', async () => {
      // Arrange
      const itemId = 'item-1';

      // Mock get cart item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: {
          id: itemId,
          cart_id: 'cart-1',
          product_id: 'product-1',
          quantity: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          carts: {
            customer_id: customerId,
          },
        },
        error: null,
      });

      // Mock delete item
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock update cart timestamp
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      const result = await cartService.removeItem(customerId, itemId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', itemId);
    });

    it('should validate item exists', async () => {
      // Arrange
      const itemId = 'nonexistent-item';

      // Mock get cart item - not found
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      // Act
      const result = await cartService.removeItem(customerId, itemId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Cart item not found');
      expect(result.error?.code).toBe('CART_ITEM_NOT_FOUND');
    });

    it('should validate item belongs to customer', async () => {
      // Arrange
      const itemId = 'item-1';
      const differentCustomerId = 'different-user';

      // Mock get cart item - belongs to different customer
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: {
          id: itemId,
          cart_id: 'cart-2',
          product_id: 'product-1',
          quantity: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          carts: {
            customer_id: differentCustomerId,
          },
        },
        error: null,
      });

      // Act
      const result = await cartService.removeItem(customerId, itemId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Unauthorized cart access');
      expect(result.error?.code).toBe('UNAUTHORIZED_CART_ACCESS');
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart successfully', async () => {
      // Arrange
      // Mock getOrCreateCart
      jest.spyOn(cartService, 'getOrCreateCart').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'cart-1',
          customerId,
          items: [
            {
              id: 'item-1',
              cartId: 'cart-1',
              productId: 'product-1',
              product: createMockProduct(),
              quantity: 2,
              unitPrice: 100,
              totalPrice: 200,
              addedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          totalAmount: 200,
          totalItems: 2,
          status: 'active',
          expiresAt: new Date(),
          finalAmount: 200,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Mock delete all items
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock update cart timestamp
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Act
      const result = await cartService.clearCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('cart_id', 'cart-1');
    });

    it('should handle failure to get cart', async () => {
      // Arrange
      // Mock getOrCreateCart failure
      jest.spyOn(cartService, 'getOrCreateCart').mockResolvedValueOnce({
        success: false,
        error: {
          message: 'Failed to get cart',
          code: 'CART_ACCESS_ERROR',
          severity: 'error',
        },
      });

      // Act
      const result = await cartService.clearCart(customerId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to get cart');
      expect(result.error?.code).toBe('CART_ACCESS_ERROR');
      expect(mockSupabaseClient.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during clear operation', async () => {
      // Arrange
      // Mock getOrCreateCart
      jest.spyOn(cartService, 'getOrCreateCart').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'cart-1',
          customerId,
          items: [],
          totalAmount: 0,
          totalItems: 0,
          status: 'active',
          expiresAt: new Date(),
          finalAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Mock delete all items - error
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      // Act
      const result = await cartService.clearCart(customerId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to clear cart');
      expect(result.error?.code).toBe('CART_CLEAR_ERROR');
    });
  });

  describe('validateCart', () => {
    it('should validate cart successfully with no issues', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customerId,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            product: createMockProduct({ id: 'product-1', stock: 10 }),
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
            addedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalAmount: 200,
        totalItems: 2,
        status: 'active',
        expiresAt: new Date(),
        finalAmount: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getCart
      jest.spyOn(cartService, 'getCart').mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      // Mock product service for current product data
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: createMockProduct({ id: 'product-1', stock: 10, price: 100 }),
      });

      // Act
      const result = await cartService.validateCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.errors.length).toBe(0);
      expect(result.data?.warnings.length).toBe(0);
    });

    it('should detect out of stock products', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customerId,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            product: createMockProduct({ id: 'product-1', stock: 5 }),
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
            addedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalAmount: 200,
        totalItems: 2,
        status: 'active',
        expiresAt: new Date(),
        finalAmount: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getCart
      jest.spyOn(cartService, 'getCart').mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      // Mock product service for current product data - out of stock
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: createMockProduct({ id: 'product-1', stock: 0, price: 100 }),
      });

      // Act
      const result = await cartService.validateCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(false);
      expect(result.data?.errors.length).toBe(1);
      expect(result.data?.errors[0].type).toBe('out_of_stock');
      expect(result.data?.warnings.length).toBe(0);
    });

    it('should detect insufficient stock', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customerId,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            product: createMockProduct({ id: 'product-1', stock: 10 }),
            quantity: 8,
            unitPrice: 100,
            totalPrice: 800,
            addedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalAmount: 800,
        totalItems: 8,
        status: 'active',
        expiresAt: new Date(),
        finalAmount: 800,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getCart
      jest.spyOn(cartService, 'getCart').mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      // Mock product service for current product data - less stock than requested
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: createMockProduct({ id: 'product-1', stock: 5, price: 100 }),
      });

      // Act
      const result = await cartService.validateCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(false);
      expect(result.data?.errors.length).toBe(1);
      expect(result.data?.errors[0].type).toBe('insufficient_stock');
      expect(result.data?.errors[0].currentStock).toBe(5);
      expect(result.data?.errors[0].requestedQuantity).toBe(8);
    });

    it('should warn about low stock', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customerId,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            product: createMockProduct({ id: 'product-1', stock: 10 }),
            quantity: 3,
            unitPrice: 100,
            totalPrice: 300,
            addedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalAmount: 300,
        totalItems: 3,
        status: 'active',
        expiresAt: new Date(),
        finalAmount: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getCart
      jest.spyOn(cartService, 'getCart').mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      // Mock product service for current product data - low stock
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: createMockProduct({ id: 'product-1', stock: 3, price: 100 }),
      });

      // Act
      const result = await cartService.validateCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.errors.length).toBe(0);
      expect(result.data?.warnings.length).toBe(1);
      expect(result.data?.warnings[0].type).toBe('low_stock');
      expect(result.data?.warnings[0].details?.currentStock).toBe(3);
    });

    it('should detect price changes', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customerId,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            product: createMockProduct({ id: 'product-1', stock: 10, price: 100 }),
            quantity: 2,
            unitPrice: 100, // Original price
            totalPrice: 200,
            addedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalAmount: 200,
        totalItems: 2,
        status: 'active',
        expiresAt: new Date(),
        finalAmount: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getCart
      jest.spyOn(cartService, 'getCart').mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      // Mock product service for current product data - price increased
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: createMockProduct({ id: 'product-1', stock: 10, price: 120 }),
      });

      // Act
      const result = await cartService.validateCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(true);
      expect(result.data?.errors.length).toBe(0);
      expect(result.data?.warnings.length).toBe(1);
      expect(result.data?.warnings[0].type).toBe('price_increase');
      expect(result.data?.warnings[0].details?.oldPrice).toBe(100);
      expect(result.data?.warnings[0].details?.newPrice).toBe(120);
    });

    it('should detect unavailable products', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customerId,
        items: [
          {
            id: 'item-1',
            cartId: 'cart-1',
            productId: 'product-1',
            product: createMockProduct({ id: 'product-1' }),
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
            addedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        totalAmount: 200,
        totalItems: 2,
        status: 'active',
        expiresAt: new Date(),
        finalAmount: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getCart
      jest.spyOn(cartService, 'getCart').mockResolvedValueOnce({
        success: true,
        data: mockCart,
      });

      // Mock product service for current product data - product not found
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: {
          message: 'Product not found',
          code: 'PRODUCT_NOT_FOUND',
        },
      });

      // Act
      const result = await cartService.validateCart(customerId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.isValid).toBe(false);
      expect(result.data?.errors.length).toBe(1);
      expect(result.data?.errors[0].type).toBe('product_unavailable');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      // Arrange
      const cacheSpy = jest.spyOn(cartService, 'getCacheStats');
      
      // Act
      cartService.clearCache();
      const stats = cartService.getCacheStats();
      
      // Assert
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });

    it('should clear customer-specific cache', async () => {
      // Arrange
      const mockCart = {
        id: 'cart-1',
        customer_id: customerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cart_items: [],
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.limit.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: mockCart,
        error: null,
      });

      // Act
      await cartService.getOrCreateCart(customerId); // This should add an item to the cache
      
      // Mock the clearCustomerCache method
      const clearCustomerCacheSpy = jest.spyOn(cartService as any, 'clearCustomerCache');
      
      // Simulate adding an item which should clear the customer cache
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });
      
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });
      
      // Mock product service
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: createMockProduct({ id: 'product-1', stock: 10 }),
      });
      
      // Mock getOrCreateCart
      jest.spyOn(cartService, 'getOrCreateCart').mockResolvedValueOnce({
        success: true,
        data: {
          id: 'cart-1',
          customerId,
          items: [],
          totalAmount: 0,
          totalItems: 0,
          status: 'active',
          expiresAt: new Date(),
          finalAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      
      await cartService.addItem(customerId, { productId: 'product-1', quantity: 1 });
      
      // Assert
      expect(clearCustomerCacheSpy).toHaveBeenCalledWith(customerId);
    });
  });
});