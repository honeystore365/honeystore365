// Zod schemas for all database entities

import { z } from 'zod';
import { ValidationMessages, ValidationPatterns } from './types';

// Base schema utilities
const createStringSchema = (options: {
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
  required?: boolean;
}) => {
  let schema = z.string();

  if (options.required !== false) {
    schema = schema.min(1, ValidationMessages.required);
  }

  if (options.min) {
    schema = schema.min(options.min, ValidationMessages.minLength(options.min));
  }

  if (options.max) {
    schema = schema.max(options.max, ValidationMessages.maxLength(options.max));
  }

  if (options.pattern) {
    schema = schema.regex(options.pattern, options.message || ValidationMessages.mixedText);
  }

  return schema;
};

const createNumberSchema = (options: { min?: number; max?: number; positive?: boolean; integer?: boolean }) => {
  let schema = z.number();

  if (options.min !== undefined) {
    schema = schema.min(options.min, ValidationMessages.min(options.min));
  }

  if (options.max !== undefined) {
    schema = schema.max(options.max, ValidationMessages.max(options.max));
  }

  if (options.positive) {
    schema = schema.positive(ValidationMessages.positive);
  }

  if (options.integer) {
    schema = schema.int(ValidationMessages.integer);
  }

  return schema;
};

// Customer/User schemas
export const CustomerSchema = z.object({
  id: z.string().uuid('معرف المستخدم غير صحيح'),
  email: createStringSchema({ pattern: ValidationPatterns.email, message: ValidationMessages.email }),
  first_name: createStringSchema({ min: 2, max: 50, pattern: ValidationPatterns.mixedText }),
  last_name: createStringSchema({ min: 2, max: 50, pattern: ValidationPatterns.mixedText }),
  created_at: z.string().datetime('تاريخ الإنشاء غير صحيح').optional(),
});

export const ProfileSchema = z.object({
  id: z.string().uuid('معرف الملف الشخصي غير صحيح'),
  username: createStringSchema({ min: 3, max: 30 }),
  avatar_url: z.string().url(ValidationMessages.url).nullable().optional(),
  website: z.string().url(ValidationMessages.url).nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

export const UserRoleSchema = z.object({
  user_id: z.string().uuid('معرف المستخدم غير صحيح'),
  role: z.enum(['admin', 'customer', 'moderator'], {
    errorMap: () => ({ message: 'نوع المستخدم غير صحيح' }),
  }),
});

// Address schema
export const AddressSchema = z.object({
  id: z.string().uuid('معرف العنوان غير صحيح').optional(),
  customer_id: z.string().uuid('معرف المستخدم غير صحيح').nullable().optional(),
  address_line_1: createStringSchema({ min: 5, max: 100 }),
  address_line_2: createStringSchema({ max: 100, required: false }).nullable().optional(),
  city: createStringSchema({ min: 2, max: 50 }),
  state: createStringSchema({ min: 2, max: 50 }),
  country: createStringSchema({ min: 2, max: 50 }),
  postal_code: createStringSchema({
    pattern: ValidationPatterns.postalCode,
    message: 'الرمز البريدي غير صحيح',
  }),
  created_at: z.string().datetime().optional(),
});

// Product schemas
export const CategorySchema = z.object({
  id: z.string().uuid('معرف الفئة غير صحيح').optional(),
  name: createStringSchema({ min: 2, max: 50 }),
  description: createStringSchema({ max: 500, required: false }).nullable().optional(),
  created_at: z.string().datetime().optional(),
});

export const ProductSchema = z.object({
  id: z.string().uuid('معرف المنتج غير صحيح').optional(),
  name: createStringSchema({ min: 2, max: 100 }),
  description: createStringSchema({ max: 1000, required: false }).nullable().optional(),
  price: createNumberSchema({ min: 0, positive: true }),
  stock: createNumberSchema({ min: 0, integer: true }),
  image_url: z.string().url(ValidationMessages.url).nullable().optional(),
  created_at: z.string().datetime().optional(),
});

// Cart schemas
export const CartSchema = z.object({
  id: z.string().uuid('معرف السلة غير صحيح').optional(),
  customer_id: z.string().uuid('معرف المستخدم غير صحيح').nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const CartItemSchema = z.object({
  id: z.string().uuid('معرف عنصر السلة غير صحيح').optional(),
  cart_id: z.string().uuid('معرف السلة غير صحيح').nullable().optional(),
  product_id: z.string().uuid('معرف المنتج غير صحيح').nullable().optional(),
  quantity: createNumberSchema({ min: 1, max: 100, integer: true }),
  created_at: z.string().datetime().optional(),
});

// Order schemas
export const OrderSchema = z.object({
  id: z.string().uuid('معرف الطلب غير صحيح').optional(),
  customer_id: z.string().uuid('معرف المستخدم غير صحيح').nullable().optional(),
  total_amount: createNumberSchema({ min: 0, positive: true }),
  order_date: z.string().datetime().optional(),
});

export const OrderItemSchema = z.object({
  id: z.string().uuid('معرف عنصر الطلب غير صحيح').optional(),
  order_id: z.string().uuid('معرف الطلب غير صحيح').nullable().optional(),
  product_id: z.string().uuid('معرف المنتج غير صحيح').nullable().optional(),
  quantity: createNumberSchema({ min: 1, max: 100, integer: true }),
  price: createNumberSchema({ min: 0, positive: true }),
});

// Payment schema
export const PaymentSchema = z.object({
  id: z.string().uuid('معرف الدفع غير صحيح').optional(),
  order_id: z.string().uuid('معرف الطلب غير صحيح').nullable().optional(),
  amount: createNumberSchema({ min: 0, positive: true }),
  payment_method: z.enum(['cash_on_delivery', 'credit_card', 'bank_transfer'], {
    errorMap: () => ({ message: 'طريقة الدفع غير صحيحة' }),
  }),
  transaction_id: createStringSchema({ min: 5, max: 100 }),
  created_at: z.string().datetime().optional(),
});

// Review schema
export const ReviewSchema = z.object({
  id: z.string().uuid('معرف المراجعة غير صحيح').optional(),
  customer_id: z.string().uuid('معرف المستخدم غير صحيح').nullable().optional(),
  product_id: z.string().uuid('معرف المنتج غير صحيح').nullable().optional(),
  rating: createNumberSchema({ min: 1, max: 5, integer: true }),
  comment: createStringSchema({ max: 1000, required: false }).nullable().optional(),
  created_at: z.string().datetime().optional(),
});

// Wishlist schemas
export const WishlistSchema = z.object({
  id: z.string().uuid('معرف قائمة الأمنيات غير صحيح').optional(),
  customer_id: z.string().uuid('معرف المستخدم غير صحيح').nullable().optional(),
  created_at: z.string().datetime().optional(),
});

export const WishlistItemSchema = z.object({
  id: z.string().uuid('معرف عنصر قائمة الأمنيات غير صحيح').optional(),
  wishlist_id: z.string().uuid('معرف قائمة الأمنيات غير صحيح').nullable().optional(),
  product_id: z.string().uuid('معرف المنتج غير صحيح').nullable().optional(),
  created_at: z.string().datetime().optional(),
});

// Input types (for forms and API)
export type CustomerInput = z.infer<typeof CustomerSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type UserRoleInput = z.infer<typeof UserRoleSchema>;
export type AddressInput = z.infer<typeof AddressSchema>;
export type CategoryInput = z.infer<typeof CategorySchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type CartInput = z.infer<typeof CartSchema>;
export type CartItemInput = z.infer<typeof CartItemSchema>;
export type OrderInput = z.infer<typeof OrderSchema>;
export type OrderItemInput = z.infer<typeof OrderItemSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;
export type ReviewInput = z.infer<typeof ReviewSchema>;
export type WishlistInput = z.infer<typeof WishlistSchema>;
export type WishlistItemInput = z.infer<typeof WishlistItemSchema>;

// Partial schemas for updates
export const CustomerUpdateSchema = CustomerSchema.partial();
export const ProfileUpdateSchema = ProfileSchema.partial();
export const AddressUpdateSchema = AddressSchema.partial();
export const ProductUpdateSchema = ProductSchema.partial();
export const CartUpdateSchema = CartSchema.partial();
export const CartItemUpdateSchema = CartItemSchema.partial();
export const OrderUpdateSchema = OrderSchema.partial();
export const OrderItemUpdateSchema = OrderItemSchema.partial();
export const PaymentUpdateSchema = PaymentSchema.partial();
export const ReviewUpdateSchema = ReviewSchema.partial();
export const WishlistUpdateSchema = WishlistSchema.partial();
export const WishlistItemUpdateSchema = WishlistItemSchema.partial();

// Complex validation schemas for business logic
export const AddToCartSchema = z.object({
  product_id: z.string().uuid('معرف المنتج غير صحيح'),
  quantity: createNumberSchema({ min: 1, max: 100, integer: true }),
});

export const CreateOrderSchema = z.object({
  customer_id: z.string().uuid('معرف المستخدم غير صحيح'),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid('معرف المنتج غير صحيح'),
        quantity: createNumberSchema({ min: 1, max: 100, integer: true }),
        price: createNumberSchema({ min: 0, positive: true }),
      })
    )
    .min(1, 'يجب أن يحتوي الطلب على منتج واحد على الأقل'),
  shipping_address: AddressSchema,
  payment_method: z.enum(['cash_on_delivery', 'credit_card', 'bank_transfer']),
  notes: createStringSchema({ max: 500, required: false }).optional(),
});

export const ProductFilterSchema = z.object({
  category_id: z.string().uuid().optional(),
  min_price: createNumberSchema({ min: 0, positive: true }).optional(),
  max_price: createNumberSchema({ min: 0, positive: true }).optional(),
  in_stock: z.boolean().optional(),
  search: createStringSchema({ min: 2, max: 100, required: false }).optional(),
  sort_by: z.enum(['name', 'price', 'created_at', 'rating']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: createNumberSchema({ min: 1, integer: true }).optional(),
  limit: createNumberSchema({ min: 1, max: 100, integer: true }).optional(),
});

export const ReviewFilterSchema = z.object({
  product_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  min_rating: createNumberSchema({ min: 1, max: 5, integer: true }).optional(),
  max_rating: createNumberSchema({ min: 1, max: 5, integer: true }).optional(),
  page: createNumberSchema({ min: 1, integer: true }).optional(),
  limit: createNumberSchema({ min: 1, max: 100, integer: true }).optional(),
});

// Export input types for complex schemas
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type ProductFilterInput = z.infer<typeof ProductFilterSchema>;
export type ReviewFilterInput = z.infer<typeof ReviewFilterSchema>;
