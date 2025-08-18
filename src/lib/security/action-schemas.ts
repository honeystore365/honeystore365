import { z } from 'zod';

/**
 * Validation schemas for server actions
 */

// Auth action schemas
export const SignInSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
});

// Cart action schemas
export const AddToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(100, 'Quantity too large'),
});

export const UpdateCartItemSchema = z.object({
  cartItemId: z.string().uuid('Invalid cart item ID'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative').max(100, 'Quantity too large'),
});

export const RemoveCartItemSchema = z.object({
  cartItemId: z.string().uuid('Invalid cart item ID'),
});

// Profile action schemas
export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(100, 'Address too long'),
  addressLine2: z.string().max(100, 'Address too long').optional(),
  city: z.string().min(1, 'City is required').max(50, 'City name too long'),
  state: z.string().min(1, 'State is required').max(50, 'State name too long'),
  postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code too long'),
  country: z.string().min(1, 'Country is required').max(50, 'Country name too long'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format'),
});

// Order action schemas
export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('Invalid product ID'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        price: z.number().positive('Price must be positive'),
      })
    )
    .min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    addressLine1: z.string().min(1, 'Address line 1 is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  paymentMethod: z.enum(['cash_on_delivery', 'credit_card', 'bank_transfer']),
  notes: z.string().max(500, 'Notes too long').optional(),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// Product action schemas (for admin)
export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  isActive: z.boolean().default(true),
});

export const UpdateProductSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  name: z.string().min(1, 'Product name is required').max(100, 'Product name too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  price: z.number().positive('Price must be positive').optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  isActive: z.boolean().optional(),
});

// Category action schemas (for admin)
export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  parentId: z.string().uuid('Invalid parent category ID').optional(),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  name: z.string().min(1, 'Category name is required').max(50, 'Category name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  parentId: z.string().uuid('Invalid parent category ID').optional(),
  isActive: z.boolean().optional(),
});

// Generic schemas
export const IdSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const PaginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit too large').default(20),
});

export const SearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  ...PaginationSchema.shape,
});

// Type exports
export type SignInInput = z.infer<typeof SignInSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type RemoveCartItemInput = z.infer<typeof RemoveCartItemSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type IdInput = z.infer<typeof IdSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;