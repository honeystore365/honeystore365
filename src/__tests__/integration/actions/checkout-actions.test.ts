import * as checkoutActions from '@/actions/checkoutActions';
import { setupIntegrationTest } from '../../utils/test-env-setup';
import { createMockProduct, createMockUser } from '../../utils/test-utils';

// Mock the createClientServer function
jest.mock('@/lib/supabaseClientServer', () => ({
  createClientServer: jest.fn(),
}));

// Mock next/cookies
jest.mock('next/cookies', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

// Setup the test environment
setupIntegrationTest();

describe('Checkout Actions Integration Tests', () => {
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

  describe('getCustomerDetailsForCheckout', () => {
    it('should return customer details with address successfully', async () => {
      // Arrange
      const mockUser = createMockUser();
      const mockCustomer = {
        id: mockUser.id,
        first_name: mockUser.firstName,
        last_name: mockUser.lastName,
      };
      const mockAddress = {
        id: 'address-1',
        address_line_1: '123 Test St',
        address_line_2: 'Apt 4B',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: 'Test Country',
        phone_number: '+1234567890',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'customers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: mockCustomer,
              error: null,
            }),
          };
        }
        if (table === 'addresses') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            mockResolvedValue: jest.fn().mockResolvedValue({
              data: [mockAddress],
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const result = await checkoutActions.getCustomerDetailsForCheckout();

      // Assert
      expect(result).toEqual({
        customer_id: mockUser.id,
        first_name: mockUser.firstName,
        last_name: mockUser.lastName,
        address: mockAddress,
        error: null,
      });
    });

    it('should handle unauthenticated user', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not authenticated' },
      });

      // Act
      const result = await checkoutActions.getCustomerDetailsForCheckout();

      // Assert
      expect(result).toEqual({
        customer_id: null,
        first_name: null,
        last_name: null,
        address: null,
        error: 'User not authenticated',
      });
    });

    it('should handle customer not found', async () => {
      // Arrange
      const mockUser = createMockUser();
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'customers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Customer not found' },
            }),
          };
        }
        return {};
      });

      // Act
      const result = await checkoutActions.getCustomerDetailsForCheckout();

      // Assert
      expect(result.error).toContain('Failed to fetch customer details');
      expect(result.customer_id).toBeNull();
    });
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      // Arrange
      const mockProduct = createMockProduct();
      const orderParams = {
        customerId: 'customer-1',
        shippingAddressId: 'address-1',
        items: [
          {
            id: 'cart-item-1',
            quantity: 2,
            product: mockProduct,
          },
        ],
        totalAmount: 200,
        deliveryFee: 20,
        paymentMethod: 'Cash on Delivery',
      };

      const mockOrderId = 'order-123';

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockOrderId },
              error: null,
            }),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'order_items') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        if (table === 'carts') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'cart-1' },
              error: null,
            }),
          };
        }
        if (table === 'cart_items') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            mockResolvedValue: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const result = await checkoutActions.createOrder(orderParams);

      // Assert
      expect(result).toEqual({
        orderId: mockOrderId,
        error: null,
      });
    });

    it('should handle order creation failure', async () => {
      // Arrange
      const mockProduct = createMockProduct();
      const orderParams = {
        customerId: 'customer-1',
        shippingAddressId: 'address-1',
        items: [
          {
            id: 'cart-item-1',
            quantity: 2,
            product: mockProduct,
          },
        ],
        totalAmount: 200,
        deliveryFee: 20,
        paymentMethod: 'Cash on Delivery',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }
        return {};
      });

      // Act
      const result = await checkoutActions.createOrder(orderParams);

      // Assert
      expect(result).toEqual({
        orderId: null,
        error: 'Failed to create order.',
      });
    });

    it('should rollback order if order items creation fails', async () => {
      // Arrange
      const mockProduct = createMockProduct();
      const orderParams = {
        customerId: 'customer-1',
        shippingAddressId: 'address-1',
        items: [
          {
            id: 'cart-item-1',
            quantity: 2,
            product: mockProduct,
          },
        ],
        totalAmount: 200,
        deliveryFee: 20,
        paymentMethod: 'Cash on Delivery',
      };

      const mockOrderId = 'order-123';
      const deleteOrderSpy = jest.fn().mockReturnThis();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: mockOrderId },
              error: null,
            }),
            delete: deleteOrderSpy,
            eq: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'order_items') {
          return {
            insert: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Order items creation failed' },
            }),
          };
        }
        return {};
      });

      // Act
      const result = await checkoutActions.createOrder(orderParams);

      // Assert
      expect(result).toEqual({
        orderId: null,
        error: 'Failed to create order items.',
      });
      expect(deleteOrderSpy).toHaveBeenCalled();
    });
  });

  describe('deleteOrder', () => {
    it('should delete an order successfully', async () => {
      // Arrange
      const orderId = 'order-123';

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      // Act
      const result = await checkoutActions.deleteOrder(orderId);

      // Assert
      expect(result).toEqual({
        success: true,
        error: null,
      });
    });

    it('should handle order deletion failure', async () => {
      // Arrange
      const orderId = 'order-123';

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Order not found' },
            }),
          };
        }
        return {};
      });

      // Act
      const result = await checkoutActions.deleteOrder(orderId);

      // Assert
      expect(result).toEqual({
        success: false,
        error: 'Failed to delete order: Order not found',
      });
    });
  });
});