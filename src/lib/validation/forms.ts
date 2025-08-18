// Form-specific validation schemas

import { z } from 'zod';
import { ValidationMessages, ValidationPatterns } from './types';

// Authentication forms
export const LoginFormSchema = z.object({
  email: z.string().min(1, ValidationMessages.required).email(ValidationMessages.email),
  password: z.string().min(1, ValidationMessages.required).min(6, ValidationMessages.password),
  remember: z.boolean().optional(),
});

export const RegisterFormSchema = z
  .object({
    email: z.string().min(1, ValidationMessages.required).email(ValidationMessages.email),
    password: z
      .string()
      .min(8, ValidationMessages.password)
      .regex(ValidationPatterns.strongPassword, ValidationMessages.strongPassword),
    confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور'),
    firstName: z
      .string()
      .min(1, ValidationMessages.required)
      .min(2, ValidationMessages.minLength(2))
      .max(50, ValidationMessages.maxLength(50))
      .regex(ValidationPatterns.mixedText, ValidationMessages.mixedText),
    lastName: z
      .string()
      .min(1, ValidationMessages.required)
      .min(2, ValidationMessages.minLength(2))
      .max(50, ValidationMessages.maxLength(50))
      .regex(ValidationPatterns.mixedText, ValidationMessages.mixedText),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'يجب الموافقة على الشروط والأحكام',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'كلمة المرور وتأكيدها غير متطابقين',
    path: ['confirmPassword'],
  });

export const ForgotPasswordFormSchema = z.object({
  email: z.string().min(1, ValidationMessages.required).email(ValidationMessages.email),
});

export const ResetPasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, ValidationMessages.password)
      .regex(ValidationPatterns.strongPassword, ValidationMessages.strongPassword),
    confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور'),
    token: z.string().min(1, 'رمز إعادة التعيين مطلوب'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'كلمة المرور وتأكيدها غير متطابقين',
    path: ['confirmPassword'],
  });

// Profile forms
export const ProfileFormSchema = z.object({
  firstName: z
    .string()
    .min(1, ValidationMessages.required)
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50))
    .regex(ValidationPatterns.mixedText, ValidationMessages.mixedText),
  lastName: z
    .string()
    .min(1, ValidationMessages.required)
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50))
    .regex(ValidationPatterns.mixedText, ValidationMessages.mixedText),
  email: z.string().min(1, ValidationMessages.required).email(ValidationMessages.email),
  phone: z.string().regex(ValidationPatterns.phone, ValidationMessages.phone).optional().or(z.literal('')),
  dateOfBirth: z.string().datetime(ValidationMessages.date).optional().or(z.literal('')),
  bio: z.string().max(500, ValidationMessages.maxLength(500)).optional().or(z.literal('')),
  website: z.string().url(ValidationMessages.url).optional().or(z.literal('')),
  avatar: z.string().url(ValidationMessages.url).optional().or(z.literal('')),
});

export const ChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
    newPassword: z
      .string()
      .min(8, ValidationMessages.password)
      .regex(ValidationPatterns.strongPassword, ValidationMessages.strongPassword),
    confirmNewPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور الجديدة'),
  })
  .refine(data => data.newPassword === data.confirmNewPassword, {
    message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين',
    path: ['confirmNewPassword'],
  });

// Address forms
export const AddressFormSchema = z.object({
  addressLine1: z
    .string()
    .min(1, ValidationMessages.required)
    .min(5, ValidationMessages.minLength(5))
    .max(100, ValidationMessages.maxLength(100)),
  addressLine2: z.string().max(100, ValidationMessages.maxLength(100)).optional().or(z.literal('')),
  city: z
    .string()
    .min(1, ValidationMessages.required)
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50)),
  state: z
    .string()
    .min(1, ValidationMessages.required)
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50)),
  country: z
    .string()
    .min(1, ValidationMessages.required)
    .min(2, ValidationMessages.minLength(2))
    .max(50, ValidationMessages.maxLength(50)),
  postalCode: z
    .string()
    .min(1, ValidationMessages.required)
    .regex(ValidationPatterns.postalCode, 'الرمز البريدي غير صحيح'),
  isDefault: z.boolean().optional(),
});

// Product forms (for admin)
export const ProductFormSchema = z.object({
  name: z
    .string()
    .min(1, ValidationMessages.required)
    .min(2, ValidationMessages.minLength(2))
    .max(100, ValidationMessages.maxLength(100)),
  description: z.string().max(1000, ValidationMessages.maxLength(1000)).optional().or(z.literal('')),
  price: z.number().min(0, 'السعر يجب أن يكون موجب').max(999999, 'السعر مرتفع جداً'),
  stock: z.number().int(ValidationMessages.integer).min(0, 'الكمية يجب أن تكون موجبة'),
  categoryId: z.string().uuid('فئة المنتج غير صحيحة').min(1, 'يرجى اختيار فئة المنتج'),
  images: z
    .array(z.string().url(ValidationMessages.url))
    .min(1, 'يجب إضافة صورة واحدة على الأقل')
    .max(5, 'يمكن إضافة 5 صور كحد أقصى'),
  isActive: z.boolean().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10, 'يمكن إضافة 10 علامات كحد أقصى').optional(),
});

// Review forms
export const ReviewFormSchema = z.object({
  rating: z
    .number()
    .int(ValidationMessages.integer)
    .min(1, 'يجب اختيار تقييم من 1 إلى 5')
    .max(5, 'التقييم الأقصى هو 5'),
  comment: z
    .string()
    .min(10, 'التعليق يجب أن يحتوي على 10 أحرف على الأقل')
    .max(1000, ValidationMessages.maxLength(1000)),
  productId: z.string().uuid('معرف المنتج غير صحيح'),
  title: z
    .string()
    .min(5, ValidationMessages.minLength(5))
    .max(100, ValidationMessages.maxLength(100))
    .optional()
    .or(z.literal('')),
});

// Contact forms
export const ContactFormSchema = z.object({
  name: z
    .string()
    .min(1, ValidationMessages.required)
    .min(2, ValidationMessages.minLength(2))
    .max(100, ValidationMessages.maxLength(100))
    .regex(ValidationPatterns.mixedText, ValidationMessages.mixedText),
  email: z.string().min(1, ValidationMessages.required).email(ValidationMessages.email),
  phone: z.string().regex(ValidationPatterns.phone, ValidationMessages.phone).optional().or(z.literal('')),
  subject: z
    .string()
    .min(1, ValidationMessages.required)
    .min(5, ValidationMessages.minLength(5))
    .max(200, ValidationMessages.maxLength(200)),
  message: z
    .string()
    .min(1, ValidationMessages.required)
    .min(20, ValidationMessages.minLength(20))
    .max(2000, ValidationMessages.maxLength(2000)),
  category: z.enum(['general', 'support', 'complaint', 'suggestion', 'order'], {
    errorMap: () => ({ message: 'يرجى اختيار فئة الرسالة' }),
  }),
});

// Newsletter subscription
export const NewsletterFormSchema = z.object({
  email: z.string().min(1, ValidationMessages.required).email(ValidationMessages.email),
  preferences: z.array(z.enum(['products', 'offers', 'news', 'tips'])).optional(),
});

// Search forms
export const SearchFormSchema = z
  .object({
    query: z
      .string()
      .min(1, ValidationMessages.required)
      .min(2, ValidationMessages.minLength(2))
      .max(100, ValidationMessages.maxLength(100)),
    category: z.string().uuid().optional().or(z.literal('')),
    minPrice: z.number().min(0, ValidationMessages.positive).optional(),
    maxPrice: z.number().min(0, ValidationMessages.positive).optional(),
    sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'newest', 'rating']).optional(),
  })
  .refine(
    data => {
      if (data.minPrice && data.maxPrice) {
        return data.minPrice <= data.maxPrice;
      }
      return true;
    },
    {
      message: 'الحد الأدنى للسعر يجب أن يكون أقل من الحد الأقصى',
      path: ['maxPrice'],
    }
  );

// Cart forms
export const AddToCartFormSchema = z.object({
  productId: z.string().uuid('معرف المنتج غير صحيح'),
  quantity: z
    .number()
    .int(ValidationMessages.integer)
    .min(1, 'الكمية يجب أن تكون 1 على الأقل')
    .max(100, 'الكمية الأقصى هي 100'),
  selectedVariant: z.string().optional(),
});

export const UpdateCartItemFormSchema = z.object({
  itemId: z.string().uuid('معرف العنصر غير صحيح'),
  quantity: z
    .number()
    .int(ValidationMessages.integer)
    .min(0, 'الكمية يجب أن تكون موجبة')
    .max(100, 'الكمية الأقصى هي 100'),
});

// Checkout forms
export const CheckoutFormSchema = z.object({
  shippingAddress: AddressFormSchema,
  billingAddress: AddressFormSchema.optional(),
  useSameAddress: z.boolean().optional(),
  paymentMethod: z.enum(['cash_on_delivery', 'credit_card', 'bank_transfer'], {
    errorMap: () => ({ message: 'يرجى اختيار طريقة الدفع' }),
  }),
  notes: z.string().max(500, ValidationMessages.maxLength(500)).optional().or(z.literal('')),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'يجب الموافقة على الشروط والأحكام',
  }),
});

// Export form input types
export type LoginFormInput = z.infer<typeof LoginFormSchema>;
export type RegisterFormInput = z.infer<typeof RegisterFormSchema>;
export type ForgotPasswordFormInput = z.infer<typeof ForgotPasswordFormSchema>;
export type ResetPasswordFormInput = z.infer<typeof ResetPasswordFormSchema>;
export type ProfileFormInput = z.infer<typeof ProfileFormSchema>;
export type ChangePasswordFormInput = z.infer<typeof ChangePasswordFormSchema>;
export type AddressFormInput = z.infer<typeof AddressFormSchema>;
export type ProductFormInput = z.infer<typeof ProductFormSchema>;
export type ReviewFormInput = z.infer<typeof ReviewFormSchema>;
export type ContactFormInput = z.infer<typeof ContactFormSchema>;
export type NewsletterFormInput = z.infer<typeof NewsletterFormSchema>;
export type SearchFormInput = z.infer<typeof SearchFormSchema>;
export type AddToCartFormInput = z.infer<typeof AddToCartFormSchema>;
export type UpdateCartItemFormInput = z.infer<typeof UpdateCartItemFormSchema>;
export type CheckoutFormInput = z.infer<typeof CheckoutFormSchema>;
