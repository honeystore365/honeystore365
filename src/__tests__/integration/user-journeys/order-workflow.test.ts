import * as checkoutActions from '@/actions/checkoutActions';
import { setupIntegrationTest } from '../../utils/test-env-setup';
import { createMockProduct, createMockUser } from '../../utils/test-utils';

// Mock the createClientServer function
jest.mock('@/lib/supabaseClientServer', () => ({
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

// Mock next/cookies
jest.mock('next/cookies', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

// Mock the revalidatePath function
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Setup the test environment
setupIntegrationTest();

describe('Order Workflow Integration Tests', () => {
  let mockSupabase: any;
  const mockUser = createMockUser();
  const mockProduct = createMockProduct();

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

  describe('Complete Order Workflow', () => {
    it('should handle complete order workflow: cart -> checkout -> order creation -> order deletion', async () => {
      // Setup test data
      const mockCustomer = {
        id: mockUser.id,
        first_name: mockUser.firstName,
        last_name: mockUser.lastName,
      };
      
      const mockAddress = {
        id: 'address-1',
        address_line_1: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: 'Test Country',
        phone_number: '+1234567890',
      };

      const mockCartItems = [
        {
          id: 'cart-item-1',
          quantity: 2,
          product: mockProduct,
        },
      ];

      let orders: any[] = [];
      let orderItems: any[] = [];
      let cartItems: any[] = [...mockCartItems];

      // Setup comprehensive mocks
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
        
        if (table === 'orders') {
          return {
            insert: jest.fn().mockImplementation((orderData) => {
              const newOrder = {
                id: `order-${orders.length + 1}`,
                ...orderData,
              };
              orders.push(newOrder);
              return {
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: newOrder,
                  error: null,
                }),
              };
            }),
            delete: jest.fn().mockImplementation(() => ({
              eq: jest.fn().mockImplementation((field, value) => {
                if (field === 'id') {
                  orders = orders.filter(order => order.id !== value);
                  orderItems = orderItems.filter(item => item.order_id !== value);
                }
                return {
                  mockResolvedValue: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                };
              }),
            })),
          };
        }
        
        if (table === 'order_items') {
          return {
            insert: jest.fn().mockImplementation((items) => {
              const newItems = items.map((item: any, index: number) => ({
                id: `order-item-${orderItems.length + index + 1}`,
                ...item,
              }));
              orderItems.push(...newItems);
              return {
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: newItems,
                  error: null,
                }),
              };
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
            delete: jest.fn().mockImplementation(() => {
              cartItems = []; // Clear cart after order
              return {
                eq: jest.fn().mockReturnThis(),
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              };
            }),
          };
        }
        
        return {};
      });

      // Step 1: Get customer details for checkout
      const customerDetails = await checkoutActions.getCustomerDetailsForCheckout();
      
      expect(customerDetails.error).toBeNull();
      expect(customerDetails.customer_id).toBe(mockUser.id);
      expect(customerDetails.first_name).toBe(mockUser.firstName);
      expect(customerDetails.address).toEqual(mockAddress);

      // Step 2: Create order
      const orderParams = {
        customerId: customerDetails.customer_id!,
        shippingAddressId: mockAddress.id,
        items: mockCartItems,
        totalAmount: 200, // 2 * 100
        deliveryFee: 20,
        paymentMethod: 'Cash on Delivery',
      };

      const orderResult = await checkoutActions.createOrder(orderParams);
      
      expect(orderResult.error).toBeNull();
      expect(orderResult.orderId).toBeDefined();
      expect(orders).toHaveLength(1);
      expect(orderItems).toHaveLength(1);
      expect(cartItems).toHaveLength(0); // Cart should be cleared

      // Step 3: Verify order was created correctly
      const createdOrder = orders[0];
      expect(createdOrder.customer_id).toBe(mockUser.id);
      expect(createdOrder.shipping_address_id).toBe(mockAddress.id);
      expect(createdOrder.total_amount).toBe(220); // 200 + 20 delivery fee
      expect(createdOrder.payment_method).toBe('Cash on Delivery');
      expect(createdOrder.status).toBe('Pending Confirmation');

      const createdOrderItem = orderItems[0];
      expect(createdOrderItem.order_id).toBe(createdOrder.id);
      expect(createdOrderItem.product_id).toBe(mockProduct.id);
      expect(createdOrderItem.quantity).toBe(2);
      expect(createdOrderItem.price).toBe(mockProduct.price);

      // Step 4: Delete order (cleanup/cancellation scenario)
      const deleteResult = await checkoutActions.deleteOrder(orderResult.orderId!);
      
      expect(deleteResult.success).toBe(true);
      expect(deleteResult.error).toBeNull();
      expect(orders).toHaveLength(0);
      expect(orderItems).toHaveLength(0);
    });

    it('should handle order creation with multiple items', async () => {
      // Arrange
      const mockProduct2 = createMockProduct({ 
        id: '2', 
        name: 'Premium Honey', 
        price: 150 
      });

      const mockCartItems = [
        {
          id: 'cart-item-1',
          quantity: 2,
          product: mockProduct,
        },
        {
          id: 'cart-item-2',
          quantity: 1,
          product: mockProduct2,
        },
      ];

      let orders: any[] = [];
      let orderItems: any[] = [];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: jest.fn().mockImplementation((orderData) => {
              const newOrder = {
                id: `order-${orders.length + 1}`,
                ...orderData,
              };
              orders.push(newOrder);
              return {
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: newOrder,
                  error: null,
                }),
              };
            }),
          };
        }
        
        if (table === 'order_items') {
          return {
            insert: jest.fn().mockImplementation((items) => {
              const newItems = items.map((item: any, index: number) => ({
                id: `order-item-${orderItems.length + index + 1}`,
                ...item,
              }));
              orderItems.push(...newItems);
              return {
                mockResolvedValue: jest.fn().mockResolvedValue({
                  data: newItems,
                  error: null,
                }),
              };
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
      const orderParams = {
        customerId: 'customer-1',
        shippingAddressId: 'address-1',
        items: mockCartItems,
        totalAmount: 350, // (100 * 2) + (150 * 1)
        deliveryFee: 25,
        paymentMethod: 'Cash on Delivery',
      };

      const orderResult = await checkoutActions.createOrder(orderParams);

      // Assert
      expect(orderResult.error).toBeNull();
      expect(orderResult.orderId).toBeDefined();
      expect(orders).toHaveLength(1);
      expect(orderItems).toHaveLength(2);

      const createdOrder = orders[0];
      expect(createdOrder.total_amount).toBe(375); // 350 + 25 delivery fee

      // Verify both order items were created
      expect(orderItems[0].product_id).toBe(mockProduct.id);
      expect(orderItems[0].quantity).toBe(2);
      expect(orderItems[0].price).toBe(mockProduct.price);

      expect(orderItems[1].product_id).toBe(mockProduct2.id);
      expect(orderItems[1].quantity).toBe(1);
      expect(orderItems[1].price).toBe(mockProduct2.price);
    });

    it('should handle order creation failure and rollback', async () => {
      // Arrange
      const mockCartItems = [
        {
          id: 'cart-item-1',
          quantity: 2,
          product: mockProduct,
        },
      ];

      let orders: any[] = [];
      const deleteOrderSpy = jest.fn();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'orders') {
          return {
            insert: jest.fn().mockImplementation((orderData) => {
              const newOrder = {
                id: `order-${orders.length + 1}`,
                ...orderData,
              };
              orders.push(newOrder);
              return {
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                  data: newOrder,
                  error: null,
                }),
              };
            }),
            delete: deleteOrderSpy.mockReturnThis(),
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
      const orderParams = {
        customerId: 'customer-1',
        shippingAddressId: 'address-1',
        items: mockCartItems,
        totalAmount: 200,
        deliveryFee: 20,
        paymentMethod: 'Cash on Delivery',
      };

      const orderResult = await checkoutActions.createOrder(orderParams);

      // Assert
      expect(orderResult.orderId).toBeNull();
      expect(orderResult.error).toBe('Failed to create order items.');
      expect(deleteOrderSpy).toHaveBeenCalled(); // Rollback should have been triggered
    });

    it('should handle unauthenticated user during checkout', async () => {
      // Arrange
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not authenticated' },
      });

      // Act
      const customerDetails = await checkoutActions.getCustomerDetailsForCheckout();

      // Assert
      expect(customerDetails.customer_id).toBeNull();
      expect(customerDetails.error).toBe('User not authenticated');
    });

    it('should handle customer without address during checkout', async () => {
      // Arrange
      const mockCustomer = {
        id: mockUser.id,
        first_name: mockUser.firstName,
        last_name: mockUser.lastName,
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
              data: [], // No addresses found
              error: null,
            }),
          };
        }
        
        return {};
      });

      // Act
      const customerDetails = await checkoutActions.getCustomerDetailsForCheckout();

      // Assert
      expect(customerDetails.customer_id).toBe(mockUser.id);
      expect(customerDetails.first_name).toBe(mockUser.firstName);
      expect(customerDetails.address).toBeNull();
      expect(customerDetails.error).toBeNull();
    });
  });
});