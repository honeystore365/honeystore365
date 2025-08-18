// Orders service specific types
import {
  CheckoutData,
  CheckoutResult,
  CreateOrderData,
  Order,
  OrderStats,
  UpdateOrderStatusData,
} from '@/types/business';
import { PaginatedResult, ServiceResult } from '@/types/common';
import { CacheableService, OrderSearchFilters } from '@/types/services';

export interface OrderService extends CacheableService {
  createOrder(data: CreateOrderData): Promise<ServiceResult<Order>>;
  getOrder(id: string): Promise<ServiceResult<Order>>;
  getOrders(filters?: OrderSearchFilters): Promise<ServiceResult<PaginatedResult<Order>>>;
  getUserOrders(userId: string, filters?: OrderSearchFilters): Promise<ServiceResult<Order[]>>;
  updateOrderStatus(data: UpdateOrderStatusData): Promise<ServiceResult<Order>>;
  cancelOrder(orderId: string, reason?: string): Promise<ServiceResult<void>>;
  getOrderStats(filters?: Partial<OrderSearchFilters>): Promise<ServiceResult<OrderStats>>;
}

export interface CheckoutService {
  processCheckout(data: CheckoutData): Promise<ServiceResult<CheckoutResult>>;
  validateCheckout(data: CheckoutData): Promise<ServiceResult<boolean>>;
  calculateOrderTotal(cartId: string, discountCode?: string): Promise<ServiceResult<number>>;
}
