import { logger } from '@/lib/logger';
import { BusinessError } from '@/lib/errors';

export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
}

export interface DiscountValidationResult {
  isValid: boolean;
  discount?: DiscountCode;
  discountAmount?: number;
  error?: string;
}

export class DiscountService {
  // Mock discount codes for demonstration
  private static mockDiscounts: DiscountCode[] = [
    {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 50,
      maxDiscount: 20,
      isActive: true,
      usedCount: 0,
      usageLimit: 100,
    },
    {
      code: 'SAVE5',
      type: 'fixed',
      value: 5,
      minOrderAmount: 25,
      isActive: true,
      usedCount: 0,
      usageLimit: 50,
    },
    {
      code: 'HONEY20',
      type: 'percentage',
      value: 20,
      minOrderAmount: 100,
      maxDiscount: 50,
      isActive: true,
      usedCount: 0,
      usageLimit: 25,
    },
  ];

  static async validateDiscountCode(code: string, orderAmount: number): Promise<DiscountValidationResult> {
    try {
      logger.info('Validating discount code', {
        component: 'DiscountService',
        action: 'validateDiscountCode',
        code,
        orderAmount,
      });

      // Find the discount code
      const discount = this.mockDiscounts.find(d => d.code.toLowerCase() === code.toLowerCase());

      if (!discount) {
        return {
          isValid: false,
          error: 'Invalid discount code',
        };
      }

      // Check if discount is active
      if (!discount.isActive) {
        return {
          isValid: false,
          error: 'Discount code is no longer active',
        };
      }

      // Check expiration
      if (discount.expiresAt && new Date() > discount.expiresAt) {
        return {
          isValid: false,
          error: 'Discount code has expired',
        };
      }

      // Check usage limit
      if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
        return {
          isValid: false,
          error: 'Discount code usage limit reached',
        };
      }

      // Check minimum order amount
      if (discount.minOrderAmount && orderAmount < discount.minOrderAmount) {
        return {
          isValid: false,
          error: `Minimum order amount of ${discount.minOrderAmount} required`,
        };
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discount.type === 'percentage') {
        discountAmount = (orderAmount * discount.value) / 100;
        if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
          discountAmount = discount.maxDiscount;
        }
      } else {
        discountAmount = discount.value;
      }

      logger.info('Discount code validated successfully', {
        component: 'DiscountService',
        action: 'validateDiscountCode',
        code,
        discountAmount,
      });

      return {
        isValid: true,
        discount,
        discountAmount,
      };
    } catch (error) {
      logger.error('Failed to validate discount code', error as Error, {
        component: 'DiscountService',
        action: 'validateDiscountCode',
        code,
      });

      throw new BusinessError('Failed to validate discount code', 'DISCOUNT_VALIDATION_ERROR');
    }
  }

  static async applyDiscountCode(code: string): Promise<void> {
    try {
      const discount = this.mockDiscounts.find(d => d.code.toLowerCase() === code.toLowerCase());
      if (discount) {
        discount.usedCount += 1;
        logger.info('Discount code applied', {
          component: 'DiscountService',
          action: 'applyDiscountCode',
          code,
          newUsedCount: discount.usedCount,
        });
      }
    } catch (error) {
      logger.error('Failed to apply discount code', error as Error, {
        component: 'DiscountService',
        action: 'applyDiscountCode',
        code,
      });
    }
  }
}