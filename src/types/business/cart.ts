import { BaseEntity } from '../common';
import { Tables } from '../database';
import { CartStatus } from '../enums';
import { Product } from './product';

// Base Supabase types
export type CartRow = Tables<'carts'>;
export type CartItemRow = Tables<'cart_items'>;

// Extended business types
export interface CartItem extends BaseEntity {
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: Date;
}

export interface Cart extends BaseEntity {
  customerId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  status: CartStatus;
  expiresAt: Date;
  discountCode?: string;
  discountAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  finalAmount: number;
}

// Cart operations
export interface AddToCartData {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemData {
  itemId: string;
  quantity: number;
}

export interface ApplyDiscountData {
  cartId: string;
  discountCode: string;
}

// Cart summary for checkout
export interface CartSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  itemCount: number;
}

// Cart validation
export interface CartValidationResult {
  isValid: boolean;
  errors: CartValidationError[];
  warnings: CartValidationWarning[];
}

export interface CartValidationError {
  itemId: string;
  productId: string;
  type: 'out_of_stock' | 'insufficient_stock' | 'product_unavailable' | 'price_changed';
  message: string;
  currentStock?: number;
  requestedQuantity?: number;
}

export interface CartValidationWarning {
  itemId: string;
  productId: string;
  type: 'low_stock' | 'price_increase';
  message: string;
  details?: Record<string, any>;
}
