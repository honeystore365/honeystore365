import { BusinessError, ValidationError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import { createClientServer } from '@/lib/supabase/server';
import { Category, CreateProductData, Product, ProductFilters, ProductSearchParams, UpdateProductData } from '@/types/business';
import { PaginatedResult, ServiceResult } from '@/types/common';
import { ProductStatus } from '@/types/enums';
import { Tables } from '@/types/supabase';
import { CategoryService, ProductService } from './products.types';

type ProductRow = Tables<'products'>;
type CategoryRow = Tables<'categories'>;
type ProductImageRow = Tables<'product_images'>;
type ReviewRow = Tables<'reviews'>;

export class ProductServiceImpl implements ProductService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(operation: string, params?: any): string {
    return `${operation}_${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private mapProductRow(
    row: ProductRow,
    categories: Category[] = [],
    images: any[] = [],
    reviews: any[] = []
  ): Product {
    const averageRating =
      reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : undefined;

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      price: row.price,
      stock: row.stock,
      imageUrl: row.image_url || undefined,
      status: ProductStatus.ACTIVE, // Default status since it's not in the current schema
      categories,
      images: images.map(img => ({
        id: img.id,
        productId: img.product_id,
        imageUrl: img.image_url,
        altText: img.alt_text,
        isPrimary: img.is_primary || false,
        sortOrder: img.sort_order || 0,
        createdAt: new Date(img.created_at),
        updatedAt: new Date(img.created_at),
      })),
      averageRating,
      reviewCount: reviews.length,
      isActive: true, // Default since not in current schema
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    };
  }

  private mapCategoryRow(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      isActive: true, // Default since not in current schema
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    };
  }

  async getProducts(filters?: ProductSearchParams): Promise<ServiceResult<PaginatedResult<Product>>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getProducts', filters);

    try {
      // Check cache first
      const cached = this.getFromCache<PaginatedResult<Product>>(cacheKey);
      if (cached) {
        logger.debug('Products retrieved from cache', {
          action: 'getProducts',
          filters,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      let query = supabase.from('products').select(`
          *,
          product_categories!inner(
            categories(*)
          ),
          product_images(*),
          reviews(rating)
        `);

      // Apply filters
      if (filters?.categoryId) {
        query = query.eq('product_categories.category_id', filters.categoryId);
      }
      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.inStock) {
        query = query.gt('stock', 0);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Failed to fetch products', error, {
          action: 'getProducts',
          filters,
        });
        throw new BusinessError('Failed to fetch products', 'PRODUCTS_FETCH_ERROR');
      }

      const products =
        data?.map(row => {
          const categories = row.product_categories?.map((pc: any) => this.mapCategoryRow(pc.categories)) || [];
          return this.mapProductRow(row, categories, row.product_images, row.reviews);
        }) || [];

      const total = count || products.length;
      const totalPages = Math.ceil(total / limit);

      const result: PaginatedResult<Product> = {
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };

      // Cache the result
      this.setCache(cacheKey, result);

      logger.info('Products fetched successfully', {
        action: 'getProducts',
        count: products.length,
        duration: Date.now() - startTime,
        filters,
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('Error in getProducts', error as Error, {
        action: 'getProducts',
        filters,
      });

      if (error instanceof BusinessError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching products',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getProduct(id: string): Promise<ServiceResult<Product>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getProduct', { id });

    try {
      if (!id) {
        throw new ValidationError('Product ID is required', 'id', 'REQUIRED');
      }

      // Check cache first
      const cached = this.getFromCache<Product>(cacheKey);
      if (cached) {
        logger.debug('Product retrieved from cache', {
          action: 'getProduct',
          productId: id,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories(
            categories(*)
          ),
          product_images(*),
          reviews(rating, comment, customer_id, created_at)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Product not found', { action: 'getProduct', productId: id });
          throw new BusinessError('Product not found', 'PRODUCT_NOT_FOUND');
        }

        logger.error('Failed to fetch product', error, {
          action: 'getProduct',
          productId: id,
        });
        throw new BusinessError('Failed to fetch product', 'PRODUCT_FETCH_ERROR');
      }

      const categories = data.product_categories?.map((pc: any) => this.mapCategoryRow(pc.categories)) || [];

      const product = this.mapProductRow(data, categories, data.product_images, data.reviews);

      // Cache the result
      this.setCache(cacheKey, product);

      logger.info('Product fetched successfully', {
        action: 'getProduct',
        productId: id,
        duration: Date.now() - startTime,
      });

      return { success: true, data: product };
    } catch (error) {
      logger.error('Error in getProduct', error as Error, {
        action: 'getProduct',
        productId: id,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching the product',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async searchProducts(query: string, filters?: ProductFilters): Promise<ServiceResult<Product[]>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('searchProducts', { query, filters });

    try {
      if (!query || query.trim().length === 0) {
        throw new ValidationError('Search query is required', 'query', 'REQUIRED');
      }

      // Check cache first
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) {
        logger.debug('Search results retrieved from cache', {
          action: 'searchProducts',
          query,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      let dbQuery = supabase
        .from('products')
        .select(
          `
          *,
          product_categories(
            categories(*)
          ),
          product_images(*),
          reviews(rating)
        `
        )
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`);

      // Apply additional filters
      if (filters?.categoryId) {
        dbQuery = dbQuery.eq('product_categories.category_id', filters.categoryId);
      }
      if (filters?.minPrice) {
        dbQuery = dbQuery.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice) {
        dbQuery = dbQuery.lte('price', filters.maxPrice);
      }
      if (filters?.inStock) {
        dbQuery = dbQuery.gt('stock', 0);
      }

      const { data, error } = await dbQuery;

      if (error) {
        logger.error('Failed to search products', error, {
          action: 'searchProducts',
          query,
          filters,
        });
        throw new BusinessError('Failed to search products', 'PRODUCTS_SEARCH_ERROR');
      }

      const products =
        data?.map(row => {
          const categories = row.product_categories?.map((pc: any) => this.mapCategoryRow(pc.categories)) || [];
          return this.mapProductRow(row, categories, row.product_images, row.reviews);
        }) || [];

      // Cache the result
      this.setCache(cacheKey, products);

      logger.info('Products search completed', {
        action: 'searchProducts',
        query,
        count: products.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: products };
    } catch (error) {
      logger.error('Error in searchProducts', error as Error, {
        action: 'searchProducts',
        query,
        filters,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while searching products',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getProductsByCategory(categoryId: string, filters?: ProductFilters): Promise<ServiceResult<Product[]>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getProductsByCategory', { categoryId, filters });

    try {
      if (!categoryId) {
        throw new ValidationError('Category ID is required', 'categoryId', 'REQUIRED');
      }

      // Check cache first
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) {
        logger.debug('Category products retrieved from cache', {
          action: 'getProductsByCategory',
          categoryId,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      let query = supabase
        .from('products')
        .select(
          `
          *,
          product_categories!inner(
            categories(*)
          ),
          product_images(*),
          reviews(rating)
        `
        )
        .eq('product_categories.category_id', categoryId);

      // Apply additional filters
      if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.inStock) {
        query = query.gt('stock', 0);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch products by category', error, {
          action: 'getProductsByCategory',
          categoryId,
          filters,
        });
        throw new BusinessError('Failed to fetch products by category', 'PRODUCTS_CATEGORY_FETCH_ERROR');
      }

      const products =
        data?.map(row => {
          const categories = row.product_categories?.map((pc: any) => this.mapCategoryRow(pc.categories)) || [];
          return this.mapProductRow(row, categories, row.product_images, row.reviews);
        }) || [];

      // Cache the result
      this.setCache(cacheKey, products);

      logger.info('Products by category fetched successfully', {
        action: 'getProductsByCategory',
        categoryId,
        count: products.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: products };
    } catch (error) {
      logger.error('Error in getProductsByCategory', error as Error, {
        action: 'getProductsByCategory',
        categoryId,
        filters,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching products by category',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getFeaturedProducts(limit: number = 10): Promise<ServiceResult<Product[]>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getFeaturedProducts', { limit });

    try {
      // Check cache first
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) {
        logger.debug('Featured products retrieved from cache', {
          action: 'getFeaturedProducts',
          limit,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories(
            categories(*)
          ),
          product_images(*),
          reviews(rating)
        `
        )
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch featured products', error, {
          action: 'getFeaturedProducts',
          limit,
        });
        throw new BusinessError('Failed to fetch featured products', 'FEATURED_PRODUCTS_FETCH_ERROR');
      }

      const products =
        data?.map(row => {
          const categories = row.product_categories?.map((pc: any) => this.mapCategoryRow(pc.categories)) || [];
          return this.mapProductRow(row, categories, row.product_images, row.reviews);
        }) || [];

      // Cache the result
      this.setCache(cacheKey, products);

      logger.info('Featured products fetched successfully', {
        action: 'getFeaturedProducts',
        count: products.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: products };
    } catch (error) {
      logger.error('Error in getFeaturedProducts', error as Error, {
        action: 'getFeaturedProducts',
        limit,
      });

      if (error instanceof BusinessError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching featured products',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getRelatedProducts(productId: string, limit: number = 5): Promise<ServiceResult<Product[]>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getRelatedProducts', { productId, limit });

    try {
      if (!productId) {
        throw new ValidationError('Product ID is required', 'productId', 'REQUIRED');
      }

      // Check cache first
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) {
        logger.debug('Related products retrieved from cache', {
          action: 'getRelatedProducts',
          productId,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      // First get the product's categories
      const productResult = await this.getProduct(productId);
      if (!productResult.success || !productResult.data) {
        throw new BusinessError('Product not found for related products', 'PRODUCT_NOT_FOUND');
      }

      const categoryIds = productResult.data.categories.map(cat => cat.id);
      if (categoryIds.length === 0) {
        return { success: true, data: [] };
      }

      const supabase = await createClientServer();
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_categories!inner(
            categories(*)
          ),
          product_images(*),
          reviews(rating)
        `
        )
        .in('product_categories.category_id', categoryIds)
        .neq('id', productId)
        .gt('stock', 0)
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch related products', error, {
          action: 'getRelatedProducts',
          productId,
          limit,
        });
        throw new BusinessError('Failed to fetch related products', 'RELATED_PRODUCTS_FETCH_ERROR');
      }

      const products =
        data?.map(row => {
          const categories = row.product_categories?.map((pc: any) => this.mapCategoryRow(pc.categories)) || [];
          return this.mapProductRow(row, categories, row.product_images, row.reviews);
        }) || [];

      // Cache the result
      this.setCache(cacheKey, products);

      logger.info('Related products fetched successfully', {
        action: 'getRelatedProducts',
        productId,
        count: products.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: products };
    } catch (error) {
      logger.error('Error in getRelatedProducts', error as Error, {
        action: 'getRelatedProducts',
        productId,
        limit,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching related products',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async createProduct(data: CreateProductData): Promise<ServiceResult<Product>> {
    const startTime = Date.now();

    try {
      // Validation
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Product name is required', 'name', 'REQUIRED');
      }
      if (data.price <= 0) {
        throw new ValidationError('Product price must be greater than 0', 'price', 'INVALID');
      }
      if (data.stock < 0) {
        throw new ValidationError('Product stock cannot be negative', 'stock', 'INVALID');
      }

      const supabase = await createClientServer('service_role');

      // Create product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description,
          price: data.price,
          stock: data.stock,
          image_url: data.imageUrl,
        })
        .select()
        .single();

      if (productError) {
        logger.error('Failed to create product', productError, {
          action: 'createProduct',
          data,
        });
        throw new BusinessError('Failed to create product', 'PRODUCT_CREATE_ERROR');
      }

      // Create category associations
      if (data.categoryIds && data.categoryIds.length > 0) {
        const categoryAssociations = data.categoryIds.map(categoryId => ({
          product_id: productData.id,
          category_id: categoryId,
        }));

        const { error: categoryError } = await supabase.from('product_categories').insert(categoryAssociations);

        if (categoryError) {
          logger.error('Failed to create product category associations', categoryError, {
            action: 'createProduct',
            productId: productData.id,
            categoryIds: data.categoryIds,
          });
          // Note: Product is already created, so we don't throw here
        }
      }

      // Clear cache
      this.cache.clear();

      // Fetch the complete product data
      const result = await this.getProduct(productData.id);
      if (!result.success) {
        throw new BusinessError('Product created but failed to retrieve', 'PRODUCT_RETRIEVE_ERROR');
      }

      logger.info('Product created successfully', {
        action: 'createProduct',
        productId: productData.id,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Error in createProduct', error as Error, {
        action: 'createProduct',
        data,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the product',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async updateProduct(data: UpdateProductData): Promise<ServiceResult<Product>> {
    const startTime = Date.now();

    try {
      if (!data.id) {
        throw new ValidationError('Product ID is required', 'id', 'REQUIRED');
      }

      // Validation
      if (data.name !== undefined && data.name.trim().length === 0) {
        throw new ValidationError('Product name cannot be empty', 'name', 'INVALID');
      }
      if (data.price !== undefined && data.price <= 0) {
        throw new ValidationError('Product price must be greater than 0', 'price', 'INVALID');
      }
      if (data.stock !== undefined && data.stock < 0) {
        throw new ValidationError('Product stock cannot be negative', 'stock', 'INVALID');
      }

      const supabase = await createClientServer('service_role');

      // Update product
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.stock !== undefined) updateData.stock = data.stock;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;

      const { error: productError } = await supabase.from('products').update(updateData).eq('id', data.id);

      if (productError) {
        logger.error('Failed to update product', productError, {
          action: 'updateProduct',
          data,
        });
        throw new BusinessError('Failed to update product', 'PRODUCT_UPDATE_ERROR');
      }

      // Update category associations if provided
      if (data.categoryIds) {
        // Remove existing associations
        await supabase.from('product_categories').delete().eq('product_id', data.id);

        // Add new associations
        if (data.categoryIds.length > 0) {
          const categoryAssociations = data.categoryIds.map(categoryId => ({
            product_id: data.id,
            category_id: categoryId,
          }));

          const { error: categoryError } = await supabase.from('product_categories').insert(categoryAssociations);

          if (categoryError) {
            logger.error('Failed to update product category associations', categoryError, {
              action: 'updateProduct',
              productId: data.id,
              categoryIds: data.categoryIds,
            });
          }
        }
      }

      // Clear cache
      this.cache.clear();

      // Fetch the updated product data
      const result = await this.getProduct(data.id);
      if (!result.success) {
        throw new BusinessError('Product updated but failed to retrieve', 'PRODUCT_RETRIEVE_ERROR');
      }

      logger.info('Product updated successfully', {
        action: 'updateProduct',
        productId: data.id,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Error in updateProduct', error as Error, {
        action: 'updateProduct',
        data,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating the product',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async deleteProduct(id: string): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!id) {
        throw new ValidationError('Product ID is required', 'id', 'REQUIRED');
      }

      const supabase = await createClientServer('service_role');

      // Delete category associations first
      await supabase.from('product_categories').delete().eq('product_id', id);

      // Delete product images
      await supabase.from('product_images').delete().eq('product_id', id);

      // Delete the product
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) {
        logger.error('Failed to delete product', error, {
          action: 'deleteProduct',
          productId: id,
        });
        throw new BusinessError('Failed to delete product', 'PRODUCT_DELETE_ERROR');
      }

      // Clear cache
      this.cache.clear();

      logger.info('Product deleted successfully', {
        action: 'deleteProduct',
        productId: id,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in deleteProduct', error as Error, {
        action: 'deleteProduct',
        productId: id,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting the product',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  // BaseService interface methods (aliases)
  async getById(id: string): Promise<ServiceResult<Product>> {
    return this.getProduct(id);
  }

  async getAll(filters?: ProductFilters): Promise<ServiceResult<PaginatedResult<Product>>> {
    return this.getProducts(filters);
  }

  async create(data: CreateProductData): Promise<ServiceResult<Product>> {
    return this.createProduct(data);
  }

  async update(id: string, data: UpdateProductData): Promise<ServiceResult<Product>> {
    return this.updateProduct({ ...data, id });
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    return this.deleteProduct(id);
  }

  // SearchableService interface method (alias)
  async search(query: string, filters?: ProductFilters): Promise<ServiceResult<Product[]>> {
    return this.searchProducts(query, filters);
  }

  // Cache management methods
  async clearCache(key?: string): Promise<ServiceResult<void>> {
    try {
      if (key) {
        this.cache.delete(key);
        logger.info('Product service cache key cleared', { action: 'clearCache', key });
      } else {
        this.cache.clear();
        logger.info('Product service cache cleared', { action: 'clearCache' });
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Failed to clear product service cache', error as Error, { key });
      return {
        success: false,
        error: {
          message: 'Failed to clear cache',
          code: 'CACHE_CLEAR_ERROR',
        },
      };
    }
  }

  async refreshCache(key?: string): Promise<ServiceResult<void>> {
    try {
      if (key) {
        this.cache.delete(key);
        logger.info('Product service cache key refreshed', { action: 'refreshCache', key });
      } else {
        this.cache.clear();
        logger.info('Product service cache refreshed', { action: 'refreshCache' });
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Failed to refresh product service cache', error as Error, { key });
      return {
        success: false,
        error: {
          message: 'Failed to refresh cache',
          code: 'CACHE_REFRESH_ERROR',
        },
      };
    }
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export class CategoryServiceImpl implements CategoryService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes for categories

  private getCacheKey(operation: string, params?: any): string {
    return `category_${operation}_${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private mapCategoryRow(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      isActive: true, // Default since not in current schema
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    };
  }

  async getCategories(): Promise<ServiceResult<Category[]>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getCategories');

    try {
      // Check cache first
      const cached = this.getFromCache<Category[]>(cacheKey);
      if (cached) {
        logger.debug('Categories retrieved from cache', {
          action: 'getCategories',
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      const { data, error } = await supabase.from('categories').select('*').order('name');

      if (error) {
        logger.error('Failed to fetch categories', error, {
          action: 'getCategories',
        });
        throw new BusinessError('Failed to fetch categories', 'CATEGORIES_FETCH_ERROR');
      }

      const categories = data?.map(row => this.mapCategoryRow(row)) || [];

      // Cache the result
      this.setCache(cacheKey, categories);

      logger.info('Categories fetched successfully', {
        action: 'getCategories',
        count: categories.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: categories };
    } catch (error) {
      logger.error('Error in getCategories', error as Error, {
        action: 'getCategories',
      });

      if (error instanceof BusinessError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching categories',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getCategory(id: string): Promise<ServiceResult<Category>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getCategory', { id });

    try {
      if (!id) {
        throw new ValidationError('Category ID is required', 'id', 'REQUIRED');
      }

      // Check cache first
      const cached = this.getFromCache<Category>(cacheKey);
      if (cached) {
        logger.debug('Category retrieved from cache', {
          action: 'getCategory',
          categoryId: id,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();
      const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Category not found', { action: 'getCategory', categoryId: id });
          throw new BusinessError('Category not found', 'CATEGORY_NOT_FOUND');
        }

        logger.error('Failed to fetch category', error, {
          action: 'getCategory',
          categoryId: id,
        });
        throw new BusinessError('Failed to fetch category', 'CATEGORY_FETCH_ERROR');
      }

      const category = this.mapCategoryRow(data);

      // Cache the result
      this.setCache(cacheKey, category);

      logger.info('Category fetched successfully', {
        action: 'getCategory',
        categoryId: id,
        duration: Date.now() - startTime,
      });

      return { success: true, data: category };
    } catch (error) {
      logger.error('Error in getCategory', error as Error, {
        action: 'getCategory',
        categoryId: id,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching the category',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<Category>> {
    const startTime = Date.now();

    try {
      // Validation
      if (!data.name || data.name.trim().length === 0) {
        throw new ValidationError('Category name is required', 'name', 'REQUIRED');
      }

      const supabase = await createClientServer('service_role');

      const { data: categoryData, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          description: data.description,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create category', error, {
          action: 'createCategory',
          data,
        });
        throw new BusinessError('Failed to create category', 'CATEGORY_CREATE_ERROR');
      }

      const category = this.mapCategoryRow(categoryData);

      // Clear cache
      this.cache.clear();

      logger.info('Category created successfully', {
        action: 'createCategory',
        categoryId: categoryData.id,
        duration: Date.now() - startTime,
      });

      return { success: true, data: category };
    } catch (error) {
      logger.error('Error in createCategory', error as Error, {
        action: 'createCategory',
        data,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the category',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<ServiceResult<Category>> {
    const startTime = Date.now();

    try {
      if (!id) {
        throw new ValidationError('Category ID is required', 'id', 'REQUIRED');
      }

      // Validation
      if (data.name !== undefined && data.name.trim().length === 0) {
        throw new ValidationError('Category name cannot be empty', 'name', 'INVALID');
      }

      const supabase = await createClientServer('service_role');

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;

      const { error } = await supabase.from('categories').update(updateData).eq('id', id);

      if (error) {
        logger.error('Failed to update category', error, {
          action: 'updateCategory',
          categoryId: id,
          data,
        });
        throw new BusinessError('Failed to update category', 'CATEGORY_UPDATE_ERROR');
      }

      // Clear cache
      this.cache.clear();

      // Fetch the updated category
      const result = await this.getCategory(id);
      if (!result.success) {
        throw new BusinessError('Category updated but failed to retrieve', 'CATEGORY_RETRIEVE_ERROR');
      }

      logger.info('Category updated successfully', {
        action: 'updateCategory',
        categoryId: id,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      logger.error('Error in updateCategory', error as Error, {
        action: 'updateCategory',
        categoryId: id,
        data,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating the category',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async deleteCategory(id: string): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!id) {
        throw new ValidationError('Category ID is required', 'id', 'REQUIRED');
      }

      const supabase = await createClientServer('service_role');

      // Check if category has products
      const { data: products, error: checkError } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('category_id', id)
        .limit(1);

      if (checkError) {
        logger.error('Failed to check category products', checkError, {
          action: 'deleteCategory',
          categoryId: id,
        });
        throw new BusinessError('Failed to check category usage', 'CATEGORY_CHECK_ERROR');
      }

      if (products && products.length > 0) {
        throw new BusinessError('Cannot delete category with associated products', 'CATEGORY_HAS_PRODUCTS');
      }

      // Delete the category
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) {
        logger.error('Failed to delete category', error, {
          action: 'deleteCategory',
          categoryId: id,
        });
        throw new BusinessError('Failed to delete category', 'CATEGORY_DELETE_ERROR');
      }

      // Clear cache
      this.cache.clear();

      logger.info('Category deleted successfully', {
        action: 'deleteCategory',
        categoryId: id,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in deleteCategory', error as Error, {
        action: 'deleteCategory',
        categoryId: id,
      });

      if (error instanceof BusinessError || error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.code,

          },
        };
      }

      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting the category',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
    logger.info('Category service cache cleared', { action: 'clearCache' });
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instances
export const productService = new ProductServiceImpl();
export const categoryService = new CategoryServiceImpl();
