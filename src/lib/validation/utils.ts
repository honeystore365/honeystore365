// Validation utility functions

import { z } from 'zod';
import { ValidationMessages, ValidationPatterns, type FieldValidator, type SchemaValidator } from './types';

// Email validation
export const validateEmail = (email: string): boolean => {
  return ValidationPatterns.email.test(email);
};

// Phone number validation
export const validatePhoneNumber = (phone: string): boolean => {
  return ValidationPatterns.phone.test(phone);
};

// Password strength validation
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  issues: string[];
} => {
  const issues: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (password.length < 8) {
    issues.push('يجب أن تحتوي على 8 أحرف على الأقل');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }

  if (!/\d/.test(password)) {
    issues.push('يجب أن تحتوي على رقم واحد على الأقل');
  }

  if (!/[@$!%*?&]/.test(password)) {
    issues.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
  }

  // Determine strength
  if (issues.length === 0) {
    strength = 'strong';
  } else if (issues.length <= 2) {
    strength = 'medium';
  }

  return {
    isValid: issues.length === 0,
    strength,
    issues,
  };
};

// URL validation
export const validateUrl = (url: string): boolean => {
  return ValidationPatterns.url.test(url);
};

// Postal code validation
export const validatePostalCode = (postalCode: string): boolean => {
  return ValidationPatterns.postalCode.test(postalCode);
};

// Price validation
export const validatePrice = (price: number): boolean => {
  return price >= 0 && Number.isFinite(price);
};

// Quantity validation
export const validateQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity > 0 && quantity <= 1000;
};

// Rating validation
export const validateRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// Arabic text validation
export const validateArabicText = (text: string): boolean => {
  return ValidationPatterns.arabicText.test(text);
};

// English text validation
export const validateEnglishText = (text: string): boolean => {
  return ValidationPatterns.englishText.test(text);
};

// Mixed text validation (Arabic + English + numbers)
export const validateMixedText = (text: string): boolean => {
  return ValidationPatterns.mixedText.test(text);
};

// Create field validator from Zod schema
export const createFieldValidator = <T>(schema: z.ZodSchema<T>): FieldValidator => {
  return (value: unknown) => {
    try {
      schema.parse(value);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors[0]?.message || 'قيمة غير صحيحة',
        };
      }
      return {
        success: false,
        error: 'خطأ في التحقق من صحة البيانات',
      };
    }
  };
};

// Create form validator from Zod schema
export const createFormValidator = <T>(schema: z.ZodSchema<T>): SchemaValidator<T> => {
  return (data: unknown, options = {}) => {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          path: err.path,
        }));

        return {
          success: false,
          errors,
        };
      }
      return {
        success: false,
        errors: [
          {
            field: 'root',
            message: 'خطأ في التحقق من صحة البيانات',
            code: 'validation_error',
          },
        ],
      };
    }
  };
};

// Sanitize input text
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

// Normalize Arabic text
export const normalizeArabicText = (text: string): string => {
  return text
    .replace(/ي/g, 'ى') // Normalize Yaa
    .replace(/ة/g, 'ه') // Normalize Taa Marbouta
    .replace(/أ|إ|آ/g, 'ا') // Normalize Alif variations
    .trim();
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Add country code if missing (assuming Saudi Arabia +966)
  if (digits.length === 9 && digits.startsWith('5')) {
    return `+966${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('05')) {
    return `+966${digits.substring(1)}`;
  }

  if (digits.length === 12 && digits.startsWith('966')) {
    return `+${digits}`;
  }

  return phone;
};

// Format price for display
export const formatPrice = (price: number, currency = 'SAR'): string => {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

// Validate file upload
export const validateFileUpload = (
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}
): { isValid: boolean; error?: string } => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  } = options;

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
};

// Validate multiple files
export const validateMultipleFiles = (
  files: FileList | File[],
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}
): { isValid: boolean; errors: string[] } => {
  const { maxFiles = 5 } = options;
  const errors: string[] = [];
  const fileArray = Array.from(files);

  if (fileArray.length > maxFiles) {
    errors.push(`يمكن رفع ${maxFiles} ملفات كحد أقصى`);
  }

  fileArray.forEach((file, index) => {
    const validation = validateFileUpload(file, options);
    if (!validation.isValid && validation.error) {
      errors.push(`الملف ${index + 1}: ${validation.error}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Create debounced validator for real-time validation
export const createDebouncedValidator = <T>(
  validator: (value: T) => Promise<{ isValid: boolean; error?: string }>,
  delay = 300
) => {
  let timeoutId: NodeJS.Timeout;

  return (value: T): Promise<{ isValid: boolean; error?: string }> => {
    return new Promise(resolve => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await validator(value);
        resolve(result);
      }, delay);
    });
  };
};

// Validate business rules
export const validateBusinessRules = {
  // Check if product is in stock
  productInStock: (stock: number, requestedQuantity: number): boolean => {
    return stock >= requestedQuantity;
  },

  // Check if user can review product (must have purchased it)
  canReviewProduct: (hasPurchased: boolean, hasExistingReview: boolean): boolean => {
    return hasPurchased && !hasExistingReview;
  },

  // Check if order can be cancelled
  canCancelOrder: (orderStatus: string, orderDate: Date): boolean => {
    const hoursSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);
    return orderStatus === 'pending' && hoursSinceOrder < 24;
  },

  // Check if discount code is valid
  isDiscountValid: (
    code: { isActive: boolean; expiryDate: Date; usageLimit: number; usageCount: number },
    orderAmount: number,
    minOrderAmount?: number
  ): boolean => {
    const now = new Date();
    return (
      code.isActive &&
      code.expiryDate > now &&
      code.usageCount < code.usageLimit &&
      (!minOrderAmount || orderAmount >= minOrderAmount)
    );
  },
};

// Common validation schemas for reuse
export const CommonValidationSchemas = {
  uuid: z.string().uuid('المعرف غير صحيح'),
  email: z.string().email(ValidationMessages.email),
  phone: z.string().regex(ValidationPatterns.phone, ValidationMessages.phone),
  url: z.string().url(ValidationMessages.url),
  positiveNumber: z.number().positive(ValidationMessages.positive),
  nonNegativeNumber: z.number().min(0, 'القيمة يجب أن تكون موجبة أو صفر'),
  positiveInteger: z.number().int().positive('القيمة يجب أن تكون رقم صحيح موجب'),
  rating: z.number().int().min(1).max(5, 'التقييم يجب أن يكون بين 1 و 5'),
  percentage: z.number().min(0).max(100, 'النسبة يجب أن تكون بين 0 و 100'),
  arabicText: z.string().regex(ValidationPatterns.arabicText, ValidationMessages.arabicText),
  englishText: z.string().regex(ValidationPatterns.englishText, ValidationMessages.englishText),
  mixedText: z.string().regex(ValidationPatterns.mixedText, ValidationMessages.mixedText),
};
