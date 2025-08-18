// Custom error classes for different types of application errors

import { APIErrorResponse, ErrorCategory, ErrorRecoveryStrategy, ErrorSeverity } from './types';

// Base application error class
export abstract class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;
  public readonly recoveryStrategy?: ErrorRecoveryStrategy;

  constructor(
    message: string,
    code: string,
    severity: ErrorSeverity = 'medium',
    category: ErrorCategory,
    context?: Record<string, any>,
    recoveryStrategy?: ErrorRecoveryStrategy
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.timestamp = new Date();
    this.context = context;
    this.recoveryStrategy = recoveryStrategy;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Convert to user-friendly error
  abstract toUserFriendlyError(): {
    message: string;
    code: string;
    severity: 'info' | 'warning' | 'error';
    translationKey?: string;
    translationParams?: Record<string, string>;
  };

  // Convert to API error response
  toAPIErrorResponse(): APIErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.context,
      },
      timestamp: this.timestamp.toISOString(),
    };
  }
}

// Business logic errors
export class BusinessError extends AppError {
  constructor(message: string, code: string, severity: ErrorSeverity = 'medium', context?: Record<string, any>) {
    super(message, code, severity, 'business', context, 'fallback');
  }

  toUserFriendlyError() {
    return {
      message: this.message,
      code: this.code,
      severity: 'error' as const,
      translationKey: `errors.business.${this.code}`,
      translationParams: this.context as Record<string, string>,
    };
  }
}

// Validation errors
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly validationRule?: string;

  constructor(message: string, code: string, field?: string, validationRule?: string, context?: Record<string, any>) {
    super(
      message,
      code,
      'low',
      'validation',
      { ...context, field, validationRule },
      'manual'
    );
    this.field = field;
    this.validationRule = validationRule;
  }

  toUserFriendlyError() {
    return {
      message: this.message,
      code: this.code,
      severity: 'warning' as const,
      translationKey: `errors.validation.${this.code}`,
      translationParams: {
        field: this.field || '',
        ...(this.context as Record<string, string>),
      },
    };
  }
}

// Network and API errors
export class NetworkError extends AppError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(message: string, code: string, statusCode?: number, endpoint?: string, context?: Record<string, any>) {
    const retryable = statusCode ? statusCode >= 500 || statusCode === 429 : true;

    super(
      message,
      code,
      'high',
      'network',
      { ...context, statusCode, endpoint },
      retryable ? 'retry' : 'fallback'
    );

    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }

  toUserFriendlyError() {
    const severity: 'error' | 'warning' = this.statusCode && this.statusCode >= 500 ? 'error' : 'warning';

    return {
      message: this.statusCode === 404 ? 'المورد المطلوب غير موجود' : 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى',
      code: this.code,
      severity,
      translationKey: `errors.network.${this.code}`,
      translationParams: {
        statusCode: this.statusCode?.toString() || '',
        endpoint: this.endpoint || '',
      },
    };
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message: string, code: string, severity: ErrorSeverity = 'high', context?: Record<string, any>) {
    super(message, code, severity, 'auth', context, 'redirect');
  }

  toUserFriendlyError() {
    return {
      message: 'يرجى تسجيل الدخول للمتابعة',
      code: this.code,
      severity: 'error' as const,
      translationKey: `errors.auth.${this.code}`,
      translationParams: this.context as Record<string, string>,
    };
  }
}

// Permission errors
export class PermissionError extends AppError {
  public readonly requiredPermission?: string;
  public readonly userRole?: string;

  constructor(
    message: string,
    code: string,
    requiredPermission?: string,
    userRole?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      code,
      'high',
      'permission',
      {
        ...context,
        requiredPermission,
        userRole,
      },
      'redirect'
    );

    this.requiredPermission = requiredPermission;
    this.userRole = userRole;
  }

  toUserFriendlyError() {
    return {
      message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
      code: this.code,
      severity: 'error' as const,
      translationKey: `errors.permission.${this.code}`,
      translationParams: {
        requiredPermission: this.requiredPermission || '',
        userRole: this.userRole || '',
        ...(this.context as Record<string, string>),
      },
    };
  }
}

// System errors (database, external services, etc.)
export class SystemError extends AppError {
  public readonly service?: string;

  constructor(
    message: string,
    code: string,
    service?: string,
    severity: ErrorSeverity = 'critical',
    context?: Record<string, any>
  ) {
    super(
      message,
      code,
      severity,
      'system',
      { ...context, service },
      'retry'
    );

    this.service = service;
  }

  toUserFriendlyError() {
    return {
      message: 'حدث خطأ في النظام، يرجى المحاولة لاحقاً',
      code: this.code,
      severity: 'error' as const,
      translationKey: `errors.system.${this.code}`,
      translationParams: {
        service: this.service || '',
        ...(this.context as Record<string, string>),
      },
    };
  }
}

// Specific business errors for the honey e-commerce application
export class ProductNotFoundError extends BusinessError {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`, 'PRODUCT_NOT_FOUND', 'medium', { productId });
  }

  toUserFriendlyError() {
    return {
      message: 'المنتج المطلوب غير موجود',
      code: this.code,
      severity: 'error' as const,
      translationKey: 'errors.product.notFound',
      translationParams: { productId: this.context?.productId || '' },
    };
  }
}

export class InsufficientStockError extends BusinessError {
  constructor(productId: string, requestedQuantity: number, availableStock: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requestedQuantity}, Available: ${availableStock}`,
      'INSUFFICIENT_STOCK',
      'medium',
      { productId, requestedQuantity, availableStock }
    );
  }

  toUserFriendlyError() {
    return {
      message: `الكمية المطلوبة غير متوفرة. الكمية المتاحة: ${this.context?.availableStock}`,
      code: this.code,
      severity: 'error' as const,
      translationKey: 'errors.product.insufficientStock',
      translationParams: {
        requestedQuantity: this.context?.requestedQuantity?.toString() || '',
        availableStock: this.context?.availableStock?.toString() || '',
      },
    };
  }
}

export class CartEmptyError extends BusinessError {
  constructor() {
    super('Cart is empty', 'CART_EMPTY', 'low');
  }

  toUserFriendlyError() {
    return {
      message: 'السلة فارغة',
      code: this.code,
      severity: 'error' as const,
      translationKey: 'errors.cart.empty',
      translationParams: {},
    };
  }
}

export class OrderNotFoundError extends BusinessError {
  constructor(orderId: string) {
    super(`Order with ID ${orderId} not found`, 'ORDER_NOT_FOUND', 'medium', { orderId });
  }

  toUserFriendlyError() {
    return {
      message: 'الطلب المطلوب غير موجود',
      code: this.code,
      severity: 'error' as const,
      translationKey: 'errors.order.notFound',
      translationParams: { orderId: this.context?.orderId || '' },
    };
  }
}

// Error factory functions for common scenarios
export const createValidationError = (field: string, rule: string, message?: string) => {
  return new ValidationError(
    message || `Validation failed for field ${field}`,
    `VALIDATION_${rule.toUpperCase()}`,
    field,
    rule
  );
};

export const createNetworkError = (statusCode: number, endpoint: string, message?: string) => {
  return new NetworkError(message || `Network request failed`, `NETWORK_${statusCode}`, statusCode, endpoint);
};

export const createAuthError = (code: string, message?: string) => {
  return new AuthError(message || 'Authentication failed', code);
};

export const createSystemError = (service: string, code: string, message?: string) => {
  return new SystemError(message || `System error in ${service}`, code, service);
};
