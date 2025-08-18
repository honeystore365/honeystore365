import { DELETE } from '@/app/api/cart/remove/route';
import { PUT } from '@/app/api/cart/update/route';
import { GET } from '@/app/api/cart/view/route';
import { setupIntegrationTest } from '../../utils/test-env-setup';
import { createMockProduct, createMockUser } from '../../utils/test-utils';

// Mock the createClientServer function
jest.mock('@/lib/supabaseClientServer', () => ({
  createClientServer: jest.fn(),
}));

// Setup the test environment
setupIntegrationTest();

describe('Cart API Integration Tests', () => {
  let mockSupabase: any;
  let mockRequest: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh mock for each test
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };
    
    (require('@/lib/supabaseClientServer').createClientServer as jest.Mock)
      .mockResolvedValue(mockSupabase);

    // Mock request object
    mockRequest = new Request('http://localhost:3000/api/cart/view');
  });

  describe('GET /api/cart/view', () => {
    it('should return cart with items successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const mockProduct = createMockProduct();
      const mockCart = {
        id: 'cart-1',
        customer_id: mockUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cart_items: [
          {
            id: 'cart-item-1',
            cart_id: 'cart-1',
            product_id: mockProduct.id,
            quantity: 2,
            created_at: new Date().toISOString(),
            products: mockProduct,
          },
        ],
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockCart,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.cart).toEqual(mockCart);
      expect(result.totalAmount).toBe(200); // 2 * 100 (product price)
    });

    it('should return empty cart when no cart exists', async () => {
      // Arrange
      const mockUser = createMockUser();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No rows found
            }),
          };
        }
        return {};
      });

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.cart).toBeNull();
      expect(result.totalAmount).toBe(0);
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(result.error).toBe('User not authenticated');
    });

    it('should handle database errors', async () => {
      // Arrange
      const mockUser = createMockUser();

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'DB_ERROR' },
            }),
          };
        }
        return {};
      });

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('PUT /api/cart/update', () => {
    it('should update cart item quantity successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const requestBody = {
        cartItemId: 'cart-item-1',
        quantity: 3,
      };

      const mockRequestWithBody = new Request('http://localhost:3000/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'cart-item-1',
                carts: { customer_id: mockUser.id },
                products: { stock: 10 },
              },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
            mockResolvedValue: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const response = await PUT(mockRequestWithBody);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Cart item updated successfully');
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      const requestBody = {
        cartItemId: 'cart-item-1',
        quantity: 3,
      };

      const mockRequestWithBody = new Request('http://localhost:3000/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const response = await PUT(mockRequestWithBody);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(result.error).toBe('User not authenticated');
    });
  });

  describe('DELETE /api/cart/remove', () => {
    it('should remove cart item successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const requestBody = {
        cartItemId: 'cart-item-1',
      };

      const mockRequestWithBody = new Request('http://localhost:3000/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'cart-item-1',
                carts: { customer_id: mockUser.id },
              },
              error: null,
            }),
            delete: jest.fn().mockReturnThis(),
            mockResolvedValue: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const response = await DELETE(mockRequestWithBody);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Cart item removed successfully');
    });

    it('should return 401 for unauthenticated user', async () => {
      // Arrange
      const requestBody = {
        cartItemId: 'cart-item-1',
      };

      const mockRequestWithBody = new Request('http://localhost:3000/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Act
      const response = await DELETE(mockRequestWithBody);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(result.error).toBe('User not authenticated');
    });

    it('should return 404 for non-existent cart item', async () => {
      // Arrange
      const mockUser = createMockUser();
      const requestBody = {
        cartItemId: 'non-existent-item',
      };

      const mockRequestWithBody = new Request('http://localhost:3000/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'cart_items') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // No rows found
            }),
          };
        }
        return {};
      });

      // Act
      const response = await DELETE(mockRequestWithBody);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(result.error).toBe('Cart item not found');
    });
  });
});