import { BaseEntity } from '../common';
import { Tables } from '../database';
import { ProductStatus } from '../enums';

// Base Supabase product type
export type ProductRow = Tables<'products'>;
export type CategoryRow = Tables<'categories'>;
export type ProductImageRow = Tables<'product_images'>;
export type ReviewRow = Tables<'reviews'>;

// Extended business types
export interface ProductMetadata {
  origin?: string;
  harvestDate?: Date;
  certifications?: string[];
  nutritionalInfo?: NutritionalInfo;
  weight?: number;
  dimensions?: ProductDimensions;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
}

export interface ProductImage extends BaseEntity {
  productId: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  status: ProductStatus;
  categories: Category[];
  images: ProductImage[];
  metadata?: ProductMetadata;
  averageRating?: number;
  reviewCount?: number;
  isActive: boolean;
}

export interface Review extends BaseEntity {
  productId: string;
  customerId: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  customerName?: string;
}

// Filter and search types
export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: ProductStatus;
  search?: string;
  sortBy?: 'name' | 'price' | 'created_at' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSearchParams extends ProductFilters {
  page?: number;
  limit?: number;
}

// Create/Update types
export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryIds: string[];
  metadata?: ProductMetadata;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
  status?: ProductStatus;
}
