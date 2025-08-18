/**
 * API Integration Tests
 * Tests the integration of API routes with authentication and database operations
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

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
    })),
  },
}));

describe('API Integration Tests', () => {
  let mockSupabase: any;

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
  });

  describe('Cart API Routes', () => {
    it('should handle GET /api/cart/view with authenticated user', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      const mockCart = {
        id: 'cart-1',
        customer_id: mockUser.id,
        cart_items: [
          {
            id: 'cart-item-1',
            quantity: 2,
            products: {
              id: '1',
              name: 'Test Honey',
              price: 100,
            },
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

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.cart).toEqual(mockCart);
      expect(result.totalAmount).toBe(200); // 2 * 100
    });

    it('should handle GET /api/cart/view with unauthenticated user', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(result.error).toBe('User not authenticated');
    });

    it('should handle GET /api/cart/view with empty cart', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
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
              data: null,
              error: { code: 'PGRST116' }, // No rows found
            }),
          };
        }
        return {};
      });

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(result.cart).toBeNull();
      expect(result.totalAmount).toBe(0);
    });

    it('should handle database errors in cart API', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
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
              data: null,
              error: { message: 'Database connection failed', code: 'DB_ERROR' },
            }),
          };
        }
        return {};
      });

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.error).toBe('Database connection failed');
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should handle user authentication across multiple API calls', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      // Mock consistent authentication across calls
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock cart data
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'cart-1',
                customer_id: mockUser.id,
                cart_items: [],
              },
              error: null,
            }),
          };
        }
        return {};
      });

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act - Make multiple API calls
      const response1 = await GET(mockRequest);
      const response2 = await GET(mockRequest);

      // Assert - Both calls should succeed with same user
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(2);
    });

    it('should handle session expiration', async () => {
      // Arrange
      mockSupabase.auth.getUser
        .mockResolvedValueOnce({
          data: { user: { id: 'user-1' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { user: null },
          error: { message: 'Session expired' },
        });

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act - First call succeeds, second fails
      const response1 = await GET(mockRequest);
      const response2 = await GET(mockRequest);

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(401);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network timeouts gracefully', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        });
      });

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act & Assert
      await expect(GET(mockRequest)).rejects.toThrow('Network timeout');
    });

    it('should handle malformed requests', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation(() => {
        throw new Error('Invalid query parameters');
      });

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act
      const response = await GET(mockRequest);
      const result = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(result.error).toBe('Invalid query parameters');
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain data consistency across operations', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      let cartItems: any[] = [];

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
              data: {
                id: 'cart-1',
                customer_id: mockUser.id,
                cart_items: cartItems,
              },
              error: null,
            }),
          };
        }
        return {};
      });

      // Import the route handler
      const { GET } = require('@/app/api/cart/view/route');
      const mockRequest = new Request('http://localhost:3000/api/cart/view');

      // Act - Check empty cart
      const response1 = await GET(mockRequest);
      const result1 = await response1.json();

      // Simulate adding an item
      cartItems.push({
        id: 'cart-item-1',
        quantity: 1,
        products: { id: '1', name: 'Test Honey', price: 100 },
      });

      // Act - Check cart with item
      const response2 = await GET(mockRequest);
      const result2 = await response2.json();

      // Assert
      expect(result1.totalAmount).toBe(0);
      expect(result2.totalAmount).toBe(100);
      expect(result2.cart.cart_items).toHaveLength(1);
    });
  });
});