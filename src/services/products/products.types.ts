// Products service specific types
import { Category, CreateProductData, Product, UpdateProductData } from '@/types/business';
import { PaginatedResult, ServiceResult } from '@/types/common';
import { BaseService, CacheableService, ProductSearchFilters, SearchableService } from '@/types/services';

export interface ProductService
  extends BaseService<Product, CreateProductData, UpdateProductData, ProductSearchFilters>,
    SearchableService<Product, ProductSearchFilters>,
    CacheableService {
  getProducts(filters?: ProductSearchFilters): Promise<ServiceResult<PaginatedResult<Product>>>;
  getProduct(id: string): Promise<ServiceResult<Product>>;
  searchProducts(query: string, filters?: ProductSearchFilters): Promise<ServiceResult<Product[]>>;
  getProductsByCategory(categoryId: string, filters?: ProductSearchFilters): Promise<ServiceResult<Product[]>>;
  getFeaturedProducts(limit?: number): Promise<ServiceResult<Product[]>>;
  getRelatedProducts(productId: string, limit?: number): Promise<ServiceResult<Product[]>>;
}

export interface CategoryService {
  getCategories(): Promise<ServiceResult<Category[]>>;
  getCategory(id: string): Promise<ServiceResult<Category>>;
  createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Category>>;
  updateCategory(id: string, data: Partial<Category>): Promise<ServiceResult<Category>>;
  deleteCategory(id: string): Promise<ServiceResult<void>>;
}
