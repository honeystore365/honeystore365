import { BaseEntity } from '../common';
import { Tables } from '../database';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../enums';
import { Product } from './product';
import { Address, User } from './user';

// Base Supabase types
export type OrderRow = Tables<'orders'>;
export type OrderItemRow = Tables<'order_items'>;
export type PaymentRow = Tables<'payments'>;

// Extended business types
export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
}

export interface Payment extends BaseEntity {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  gatewayResponse?: Record<string, any>;
  processedAt?: Date;
  failureReason?: string;
}

export interface OrderTracking {
  status: OrderStatus;
  timestamp: Date;
  location?: string;
  notes?: string;
  updatedBy?: string;
}

export interface Order extends BaseEntity {
  customerId: string;
  customer: User;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: PaymentMethod;
  payment?: Payment;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  tracking: OrderTracking[];
  orderDate: Date;
}

// Order creation and updates
export interface CreateOrderData {
  customerId: string;
  items: CreateOrderItemData[];
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  discountCode?: string;
}

export interface CreateOrderItemData {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface UpdateOrderStatusData {
  orderId: string;
  status: OrderStatus;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

// Order filters and search
export interface OrderFilters {
  customerId?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: 'orderDate' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Order statistics
export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: Order[];
}

// Checkout process
export interface CheckoutData {
  cartId: string;
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  discountCode?: string;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  paymentUrl?: string;
  error?: string;
}
