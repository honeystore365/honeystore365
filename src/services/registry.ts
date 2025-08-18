// Service registry and factory for dependency injection

import { ServiceConfig, ServiceHealth } from '@/types/services';
import { AuthService } from './auth/auth.types';
import { CartService } from './cart/cart.types';
import { CheckoutService, OrderService } from './orders/orders.types';
import { CategoryService, ProductService } from './products/products.types';

// Service registry interface
export interface ServiceRegistry {
  auth: AuthService;
  cart: CartService;
  products: ProductService;
  categories: CategoryService;
  orders: OrderService;
  checkout: CheckoutService;
}

// Service factory interface
export interface ServiceFactory {
  createAuthService(config?: ServiceConfig): AuthService;
  createCartService(config?: ServiceConfig): CartService;
  createProductService(config?: ServiceConfig): ProductService;
  createCategoryService(config?: ServiceConfig): CategoryService;
  createOrderService(config?: ServiceConfig): OrderService;
  createCheckoutService(config?: ServiceConfig): CheckoutService;
}

// Service manager for lifecycle management
export interface ServiceManager {
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getHealth(): Promise<ServiceHealth>;
  getService<T extends keyof ServiceRegistry>(serviceName: T): ServiceRegistry[T];
  registerService<T extends keyof ServiceRegistry>(serviceName: T, service: ServiceRegistry[T]): void;
}

// Default service configuration
export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  enableCache: true,
  cacheTimeout: 300000, // 5 minutes
  enableLogging: true,
  enableMetrics: true,
  retryAttempts: 3,
  timeout: 30000, // 30 seconds
};

// Service dependency injection container
export class ServiceContainer implements ServiceManager {
  private services: Partial<ServiceRegistry> = {};
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize services in dependency order
    // TODO: Implement actual service initialization in task 4
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    // Cleanup services
    this.services = {};
    this.initialized = false;
  }

  async getHealth(): Promise<ServiceHealth> {
    const checks = Object.keys(this.services).map(serviceName => ({
      name: serviceName,
      status: 'pass' as const,
      message: 'Service is healthy',
      timestamp: new Date(),
    }));

    return {
      status: 'healthy',
      checks,
      uptime: process.uptime(),
      version: '1.0.0',
    };
  }

  getService<T extends keyof ServiceRegistry>(serviceName: T): ServiceRegistry[T] {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${String(serviceName)} not registered`);
    }
    return service;
  }

  registerService<T extends keyof ServiceRegistry>(serviceName: T, service: ServiceRegistry[T]): void {
    this.services[serviceName] = service;
  }
}

// Global service container instance
export const serviceContainer = new ServiceContainer();
