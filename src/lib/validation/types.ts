// Validation types and interfaces

import { z } from 'zod';

// Base validation result interface
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// Field-specific validation result
export interface FieldValidationResult {
  success: boolean;
  error?: string;
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  path?: (string | number)[];
}

// Validation options
export interface ValidationOptions {
  abortEarly?: boolean;
  stripUnknown?: boolean;
  locale?: 'ar' | 'en';
}

// Schema validation function type
export type SchemaValidator<T> = (data: unknown, options?: ValidationOptions) => ValidationResult<T>;

// Field validation function type
export type FieldValidator = (value: unknown) => FieldValidationResult;

// Create validation result helper
export function createValidationResult<T>(
  success: true, 
  data: T, 
  errors?: ValidationError[]
): ValidationResult<T>;
export function createValidationResult<T>(
  success: false, 
  data?: undefined, 
  errors?: ValidationError[]
): ValidationResult<T>;
export function createValidationResult<T>(success: boolean, data?: T, errors?: ValidationError[]): ValidationResult<T> {
  return {
    success,
    data,
    errors,
  };
}

// Convert Zod errors to our validation error format
export function formatValidationErrors(zodError: z.ZodError, locale: 'ar' | 'en' = 'ar'): ValidationError[] {
  return zodError.errors.map(error => ({
    field: error.path.join('.'),
    message: getLocalizedErrorMessage(error, locale),
    code: error.code,
    path: error.path,
  }));
}

// Get localized error messages
function getLocalizedErrorMessage(error: z.ZodIssue, locale: 'ar' | 'en'): string {
  const messages = {
    ar: {
      required_error: 'هذا الحقل مطلوب',
      invalid_type: 'نوع البيانات غير صحيح',
      too_small: 'القيمة صغيرة جداً',
      too_big: 'القيمة كبيرة جداً',
      invalid_string: 'النص غير صحيح',
      invalid_email: 'البريد الإلكتروني غير صحيح',
      invalid_url: 'الرابط غير صحيح',
      invalid_date: 'التاريخ غير صحيح',
      custom: 'قيمة غير صحيحة',
    },
    en: {
      required_error: 'This field is required',
      invalid_type: 'Invalid data type',
      too_small: 'Value is too small',
      too_big: 'Value is too big',
      invalid_string: 'Invalid string',
      invalid_email: 'Invalid email address',
      invalid_url: 'Invalid URL',
      invalid_date: 'Invalid date',
      custom: 'Invalid value',
    },
  };

  const localizedMessages = messages[locale];

  switch (error.code) {
    case 'invalid_type':
      if (error.received === 'undefined') {
        return localizedMessages.required_error;
      }
      return localizedMessages.invalid_type;
    case 'too_small':
      if (error.type === 'string') {
        return `يجب أن يحتوي على ${error.minimum} أحرف على الأقل`;
      }
      if (error.type === 'number') {
        return `يجب أن تكون القيمة ${error.minimum} على الأقل`;
      }
      return localizedMessages.too_small;
    case 'too_big':
      if (error.type === 'string') {
        return `يجب أن لا يتجاوز ${error.maximum} حرف`;
      }
      if (error.type === 'number') {
        return `يجب أن لا تتجاوز القيمة ${error.maximum}`;
      }
      return localizedMessages.too_big;
    case 'invalid_string':
      if (error.validation === 'email') {
        return localizedMessages.invalid_email;
      }
      if (error.validation === 'url') {
        return localizedMessages.invalid_url;
      }
      return localizedMessages.invalid_string;
    case 'invalid_date':
      return localizedMessages.invalid_date;
    case 'custom':
      return error.message || localizedMessages.custom;
    default:
      return error.message || localizedMessages.custom;
  }
}

// Validate a single field
export function validateField<T>(
  schema: z.ZodSchema<T>,
  value: unknown,
  options?: ValidationOptions
): FieldValidationResult {
  try {
    schema.parse(value);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = formatValidationErrors(error, options?.locale);
      return {
        success: false,
        error: validationErrors[0]?.message || 'قيمة غير صحيحة',
      };
    }
    return {
      success: false,
      error: 'خطأ في التحقق من صحة البيانات',
    };
  }
}

// Validate entire schema
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: ValidationOptions
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return createValidationResult(true, validatedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = formatValidationErrors(error, options?.locale);
      return createValidationResult(false, undefined, validationErrors);
    }
    return createValidationResult(false, undefined, [
      {
        field: 'root',
        message: 'خطأ في التحقق من صحة البيانات',
        code: 'validation_error',
      },
    ]);
  }
}

// Common validation patterns
export const ValidationPatterns = {
  // Arabic and English text
  arabicText: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s]+$/,
  englishText: /^[a-zA-Z\s]+$/,
  mixedText: /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\sa-zA-Z0-9\s\-_.,!?]+$/,

  // Contact information
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^(\+?[0-9]{1,4})?[0-9]{8,15}$/,

  // Address patterns
  postalCode: /^[0-9]{5,10}$/,

  // Product patterns
  price: /^\d+(\.\d{1,2})?$/,
  sku: /^[A-Z0-9\-_]{3,20}$/,

  // URL patterns
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,

  // Password patterns
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;

// Common validation messages in Arabic
export const ValidationMessages = {
  required: 'هذا الحقل مطلوب',
  email: 'يرجى إدخال بريد إلكتروني صحيح',
  phone: 'يرجى إدخال رقم هاتف صحيح',
  password: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل',
  strongPassword: 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز',
  minLength: (min: number) => `يجب أن يحتوي على ${min} أحرف على الأقل`,
  maxLength: (max: number) => `يجب أن لا يتجاوز ${max} حرف`,
  min: (min: number) => `يجب أن تكون القيمة ${min} على الأقل`,
  max: (max: number) => `يجب أن لا تتجاوز القيمة ${max}`,
  positive: 'يجب أن تكون القيمة موجبة',
  integer: 'يجب أن تكون القيمة رقم صحيح',
  url: 'يرجى إدخال رابط صحيح',
  date: 'يرجى إدخال تاريخ صحيح',
  arabicText: 'يرجى إدخال نص باللغة العربية فقط',
  englishText: 'يرجى إدخال نص باللغة الإنجليزية فقط',
  mixedText: 'النص يحتوي على أحرف غير مسموحة',
} as const;
