import * as cartActions from '@/actions/cartActions';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClientServer: jest.fn(),
}));
jest.mock('@/lib/security', () => ({
  createAuthenticatedAction: jest.fn((_actionName, _schema) => (handler) => (input) =>
    handler(input, { userId: 'test-user-id' })
  ),
}));
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Cart Actions Integration Tests', () => {
  let createClientServerMock: jest.Mock;
  let fromMock: jest.Mock;
  let selectMock: jest.Mock;
  let eqMock: jest.Mock;
  let singleMock: jest.Mock;
  let insertMock: jest.Mock;
  let updateMock: jest.Mock;
  let deleteMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup a clean mock chain for each test
    createClientServerMock = jest.requireMock('@/lib/supabase/server').createClientServer;
    singleMock = jest.fn();
    eqMock = jest.fn().mockReturnThis();
    selectMock = jest.fn().mockReturnThis();
    insertMock = jest.fn().mockResolvedValue({ data: [{ id: 'new-item-1' }], error: null });
    updateMock = jest.fn().mockResolvedValue({ data: null, error: null });
    deleteMock = jest.fn().mockResolvedValue({ data: null, error: null });

    fromMock = jest.fn().mockReturnValue({
      select: selectMock,
      eq: eqMock,
      single: singleMock,
      insert: insertMock,
      update: updateMock,
      delete: deleteMock,
    });

    createClientServerMock.mockReturnValue({ from: fromMock });

    // Default cart mock
    const cartSelectMock = jest.fn().mockReturnThis();
    const cartEqMock = jest.fn().mockReturnThis();
    const cartSingleMock = jest.fn().mockResolvedValue({ data: { id: 'cart-1' }, error: null });
    fromMock.mockImplementation((tableName) => {
      if (tableName === 'carts') {
        return { select: cartSelectMock, eq: cartEqMock, single: cartSingleMock };
      }
      return {
        select: selectMock,
        eq: eqMock,
        single: singleMock,
        insert: insertMock,
        update: updateMock,
        delete: deleteMock,
      };
    });
  });

  const mockProduct = (product: any) => {
    const productSingleMock = jest.fn().mockResolvedValue({ data: product, error: null });
    const productEqMock = jest.fn().mockReturnThis();
    const productSelectMock = jest.fn().mockReturnValue({ eq: productEqMock, single: productSingleMock });

    // When 'products' table is requested, return the specific mock
    fromMock.mockImplementation((tableName) => {
      if (tableName === 'products') {
        return { select: productSelectMock };
      }
      return fromMock.mock.results[0].value; // Return default mock for other tables
    });
  };

  const mockCartItem = (item: any) => {
     const itemSingleMock = jest.fn().mockResolvedValue({ data: item, error: null });
     const itemEqMock = jest.fn().mockReturnThis();
     const itemSelectMock = jest.fn().mockReturnValue({ eq: itemEqMock, single: itemSingleMock });
     fromMock.mockImplementation((tableName) => {
       if (tableName === 'cart_items') {
         return { select: itemSelectMock, eq: itemEqMock, single: itemSingleMock, update: updateMock, delete: deleteMock };
       }
       return fromMock.mock.results[0].value;
     });
  };

  describe('addItemToCart', () => {
    it('should add a new item to the cart', async () => {
      // Arrange
      mockProduct({ id: '1', name: 'Test Honey', price: 100, stock: 10 });
      mockCartItem(null); // No existing item
      const input = { productId: '1', quantity: 2 };

      // Act
      const result = await cartActions.addItemToCart(input);

      // Assert
      expect(result).toEqual({ success: true, message: 'Item added to cart.' });
      expect(insertMock).toHaveBeenCalled();
    });

    it('should return error for insufficient stock', async () => {
        // Arrange
        mockProduct({ id: '1', stock: 5 }); // Only 5 in stock
        mockCartItem(null);
        const input = { productId: '1', quantity: 10 };

        // Act
        const result = await cartActions.addItemToCart(input);

        // Assert
        expect(result).toEqual({ success: false, message: 'Insufficient stock for Test Honey.' });
    });
  });

  describe('removeCartItem', () => {
    it('should remove an item from the cart', async () => {
      // Arrange
      mockCartItem({ id: 'cart-item-1', carts: { customer_id: 'test-user-id' } });
      const input = { cartItemId: 'cart-item-1' };

      // Act
      const result = await cartActions.removeCartItem(input);

      // Assert
      expect(result).toEqual({ success: true, message: 'Item removed from cart.' });
      expect(deleteMock).toHaveBeenCalled();
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update the quantity of a cart item', async () => {
      // Arrange
       mockCartItem({
         id: 'cart-item-1',
         quantity: 2,
         product_id: '1',
         carts: { customer_id: 'test-user-id' },
         products: { stock: 10, name: 'Test Honey' },
       });
      const input = { cartItemId: 'cart-item-1', quantity: 3 };

      // Act
      const result = await cartActions.updateCartItemQuantity(input);

      // Assert
      expect(result).toEqual({ success: true, message: 'Item quantity updated.' });
      expect(updateMock).toHaveBeenCalledWith({ quantity: 3 });
    });

    it('should remove the item if quantity is 0', async () => {
      // Arrange
      const input = { cartItemId: 'cart-item-1', quantity: 0 };
      mockCartItem({ id: 'cart-item-1', carts: { customer_id: 'test-user-id' } });

      // Act
      const result = await cartActions.updateCartItemQuantity(input);

      // Assert
      expect(deleteMock).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Item removed from cart.' });
    });
  });

  describe('clearCart', () => {
    it('should clear all items from the cart', async () => {
      // Act
      const result = await cartActions.clearCart();

      // Assert
      expect(result).toEqual({ success: true, message: 'Cart cleared successfully.' });
      expect(deleteMock).toHaveBeenCalled();
    });
  });
});