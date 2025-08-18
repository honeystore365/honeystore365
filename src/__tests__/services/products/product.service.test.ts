import { ProductServiceImpl } from '@/services/products/products.service';
import { mockSupabaseClient, resetSupabaseMocks } from '../../mocks/supabase';
import { setupUnitTest } from '../../utils/test-env-setup';
import { createMockProduct } from '../../utils/test-utils';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClientServer: jest.fn().mockImplementation(() => Promise.resolve(mockSupabaseClient)),
}));

// Setup the test environment
setupUnitTest();

describe('ProductService', () => {
  let productService: ProductServiceImpl;

  beforeEach(() => {
    resetSupabaseMocks();
    productService = new ProductServiceImpl();
    // Clear the cache before each test
    productService.clearCache();
  });

  describe('getProducts', () => {
    it('should return products when successful', async () => {
      // Arrange
      const mockProducts = [createMockProduct(), createMockProduct({ id: '2' })];
      const mockResponse = {
        data: mockProducts.map(product => ({
          ...product,
          created_at: product.createdAt,
          updated_at: product.updatedAt,
          image_url: product.imageUrl,
          product_categories: [
            {
              categories: {
                id: '1',
                name: 'Raw Honey',
                description: 'Pure raw honey',
                created_at: new Date().toISOString(),
              },
            },
          ],
          product_images: [],
          reviews: [],
        })),
        error: null,
        count: 2,
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await productService.getProducts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.data.length).toBe(2);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockSupabaseClient.select).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      // Act
      const result = await productService.getProducts();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to fetch products');
      expect(result.error?.code).toBe('PRODUCTS_FETCH_ERROR');
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        categoryId: '1',
        minPrice: 50,
        maxPrice: 200,
        inStock: true,
        search: 'honey',
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.gte.mockReturnThis();
      mockSupabaseClient.lte.mockReturnThis();
      mockSupabaseClient.gt.mockReturnThis();
      mockSupabaseClient.or.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      // Act
      await productService.getProducts(filters);

      // Assert
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('product_categories.category_id', '1');
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('price', 50);
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('price', 200);
      expect(mockSupabaseClient.gt).toHaveBeenCalledWith('stock', 0);
      expect(mockSupabaseClient.or).toHaveBeenCalledWith('name.ilike.%honey%,description.ilike.%honey%');
    });

    it('should use cache for repeated calls', async () => {
      // Arrange
      const mockProducts = [createMockProduct()];
      const mockResponse = {
        data: mockProducts.map(product => ({
          ...product,
          created_at: product.createdAt,
          updated_at: product.updatedAt,
          image_url: product.imageUrl,
          product_categories: [],
          product_images: [],
          reviews: [],
        })),
        error: null,
        count: 1,
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce(mockResponse);

      // Act
      await productService.getProducts(); // First call should hit the database
      mockSupabaseClient.from.mockClear(); // Clear the mock
      const result = await productService.getProducts(); // Second call should use cache

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled(); // Should not call the database again
    });
  });

  describe('getProduct', () => {
    it('should return a product when successful', async () => {
      // Arrange
      const mockProduct = createMockProduct();
      const mockResponse = {
        data: {
          ...mockProduct,
          created_at: mockProduct.createdAt,
          updated_at: mockProduct.updatedAt,
          image_url: mockProduct.imageUrl,
          product_categories: [],
          product_images: [],
          reviews: [],
        },
        error: null,
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await productService.getProduct('1');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should handle product not found', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      // Act
      const result = await productService.getProduct('999');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Product not found');
      expect(result.error?.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should handle validation error for empty product ID', async () => {
      // Act
      const result = await productService.getProduct('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Product ID is required');
    });
  });

  describe('searchProducts', () => {
    it('should return products matching search query', async () => {
      // Arrange
      const mockProducts = [createMockProduct(), createMockProduct({ id: '2' })];
      const mockResponse = {
        data: mockProducts.map(product => ({
          ...product,
          created_at: product.createdAt,
          updated_at: product.updatedAt,
          image_url: product.imageUrl,
          product_categories: [],
          product_images: [],
          reviews: [],
        })),
        error: null,
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.or.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce(mockResponse);

      // Act
      const result = await productService.searchProducts('honey');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(mockSupabaseClient.or).toHaveBeenCalledWith('name.ilike.%honey%,description.ilike.%honey%');
    });

    it('should handle validation error for empty search query', async () => {
      // Act
      const result = await productService.searchProducts('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Search query is required');
    });

    it('should apply additional filters to search', async () => {
      // Arrange
      const filters = {
        categoryId: '1',
        minPrice: 50,
        maxPrice: 200,
        inStock: true,
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.or.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.gte.mockReturnThis();
      mockSupabaseClient.lte.mockReturnThis();
      mockSupabaseClient.gt.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Act
      await productService.searchProducts('honey', filters);

      // Assert
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('product_categories.category_id', '1');
      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('price', 50);
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('price', 200);
      expect(mockSupabaseClient.gt).toHaveBeenCalledWith('stock', 0);
    });
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      // Arrange
      const newProductData = {
        name: 'New Honey',
        description: 'Fresh new honey',
        price: 150,
        stock: 20,
        imageUrl: '/images/new-honey.jpg',
        categoryIds: ['1', '2'],
      };

      const mockCreatedProduct = {
        id: '3',
        name: newProductData.name,
        description: newProductData.description,
        price: newProductData.price,
        stock: newProductData.stock,
        image_url: newProductData.imageUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock the insert operation
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: mockCreatedProduct,
        error: null,
      });

      // Mock the category association
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock the getProduct call that happens after creation
      const getProductSpy = jest.spyOn(productService, 'getProduct').mockResolvedValueOnce({
        success: true,
        data: {
          id: '3',
          name: newProductData.name,
          description: newProductData.description,
          price: newProductData.price,
          stock: newProductData.stock,
          imageUrl: newProductData.imageUrl,
          status: 'active',
          categories: [{ id: '1', name: 'Raw Honey', description: 'Pure raw honey', isActive: true, createdAt: new Date(), updatedAt: new Date() }],
          images: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Act
      const result = await productService.createProduct(newProductData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(newProductData.name);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        name: newProductData.name,
        description: newProductData.description,
        price: newProductData.price,
        stock: newProductData.stock,
        image_url: newProductData.imageUrl,
      });
      expect(getProductSpy).toHaveBeenCalledWith('3');
    });

    it('should validate product data before creation', async () => {
      // Arrange
      const invalidProductData = {
        name: '',
        description: 'Invalid product',
        price: -10,
        stock: -5,
        imageUrl: '/images/invalid.jpg',
      };

      // Act
      const result = await productService.createProduct(invalidProductData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Product name is required');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle database errors during product creation', async () => {
      // Arrange
      const newProductData = {
        name: 'New Honey',
        description: 'Fresh new honey',
        price: 150,
        stock: 20,
        imageUrl: '/images/new-honey.jpg',
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.single.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      // Act
      const result = await productService.createProduct(newProductData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to create product');
      expect(result.error?.code).toBe('PRODUCT_CREATE_ERROR');
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      // Arrange
      const updateData = {
        id: '1',
        name: 'Updated Honey',
        price: 120,
        stock: 15,
      };

      // Mock the update operation
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock the getProduct call that happens after update
      const getProductSpy = jest.spyOn(productService, 'getProduct').mockResolvedValueOnce({
        success: true,
        data: {
          id: '1',
          name: updateData.name,
          description: 'A delicious honey for testing',
          price: updateData.price,
          stock: updateData.stock,
          imageUrl: '/images/test-honey.jpg',
          status: 'active',
          categories: [],
          images: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Act
      const result = await productService.updateProduct(updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(updateData.name);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        name: updateData.name,
        price: updateData.price,
        stock: updateData.stock,
      });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
      expect(getProductSpy).toHaveBeenCalledWith('1');
    });

    it('should validate product data before update', async () => {
      // Arrange
      const invalidUpdateData = {
        id: '1',
        name: '',
        price: -10,
      };

      // Act
      const result = await productService.updateProduct(invalidUpdateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Product name cannot be empty');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle missing product ID', async () => {
      // Arrange
      const invalidUpdateData = {
        id: '',
        name: 'Updated Product',
      };

      // Act
      const result = await productService.updateProduct(invalidUpdateData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Product ID is required');
    });

    it('should update category associations if provided', async () => {
      // Arrange
      const updateData = {
        id: '1',
        name: 'Updated Honey',
        categoryIds: ['2', '3'],
      };

      // Mock the update operation
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.update.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock the delete operation for existing categories
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock the insert operation for new categories
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock the getProduct call
      jest.spyOn(productService, 'getProduct').mockResolvedValueOnce({
        success: true,
        data: {
          id: '1',
          name: updateData.name,
          description: 'A delicious honey for testing',
          price: 100,
          stock: 10,
          imageUrl: '/images/test-honey.jpg',
          status: 'active',
          categories: [
            { id: '2', name: 'Category 2', description: 'Description 2', isActive: true, createdAt: new Date(), updatedAt: new Date() },
            { id: '3', name: 'Category 3', description: 'Description 3', isActive: true, createdAt: new Date(), updatedAt: new Date() },
          ],
          images: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Act
      const result = await productService.updateProduct(updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith([
        { product_id: '1', category_id: '2' },
        { product_id: '1', category_id: '3' },
      ]);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      // Arrange
      // Mock the delete operations
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValue({
        data: null,
        error: null,
      });

      // Act
      const result = await productService.deleteProduct('1');

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('product_categories');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('product_images');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('products');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('product_id', '1');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '1');
    });

    it('should validate product ID before deletion', async () => {
      // Act
      const result = await productService.deleteProduct('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Product ID is required');
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      // Arrange
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.delete.mockReturnThis();
      mockSupabaseClient.eq.mockReturnThis();
      
      // Mock successful deletion of related entities
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: null,
      }).mockResolvedValueOnce({
        data: null,
        error: null,
      });
      
      // Mock error on product deletion
      mockSupabaseClient.then.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      // Act
      const result = await productService.deleteProduct('1');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Failed to delete product');
      expect(result.error?.code).toBe('PRODUCT_DELETE_ERROR');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      // Arrange
      const cacheSpy = jest.spyOn(productService, 'getCacheStats');
      
      // Act
      productService.clearCache();
      const stats = productService.getCacheStats();
      
      // Assert
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });

    it('should return cache stats', async () => {
      // Arrange
      const mockProducts = [createMockProduct()];
      const mockResponse = {
        data: mockProducts.map(product => ({
          ...product,
          created_at: product.createdAt,
          updated_at: product.updatedAt,
          image_url: product.imageUrl,
          product_categories: [],
          product_images: [],
          reviews: [],
        })),
        error: null,
        count: 1,
      };

      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.select.mockReturnThis();
      mockSupabaseClient.order.mockReturnThis();
      mockSupabaseClient.then.mockResolvedValueOnce(mockResponse);

      // Act
      await productService.getProducts(); // This should add an item to the cache
      const stats = productService.getCacheStats();
      
      // Assert
      expect(stats.size).toBe(1);
      expect(stats.keys.length).toBe(1);
      expect(stats.keys[0]).toContain('getProducts');
    });
  });
});