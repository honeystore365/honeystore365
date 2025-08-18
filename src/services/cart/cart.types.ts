// Cart service specific types
import { AddToCartData, Cart, CartValidationResult, UpdateCartItemData } from '@/types/business';
import { ServiceResult } from '@/types/common';
import { CacheableService, CartSearchFilters } from '@/types/services';

export interface CartService extends CacheableService {
  getCart(customerId: string): Promise<ServiceResult<Cart>>;
  addItem(customerId: string, data: AddToCartData): Promise<ServiceResult<void>>;
  updateItem(customerId: string, data: UpdateCartItemData): Promise<ServiceResult<void>>;
  removeItem(customerId: string, itemId: string): Promise<ServiceResult<void>>;
  clearCart(customerId: string): Promise<ServiceResult<void>>;
  validateCart(customerId: string): Promise<ServiceResult<CartValidationResult>>;
  getOrCreateCart(customerId: string): Promise<ServiceResult<Cart>>;
  searchCarts(filters?: CartSearchFilters): Promise<ServiceResult<Cart[]>>;
}

export interface CartOperationResult {
  success: boolean;
  cart?: Cart;
  error?: string;
}
