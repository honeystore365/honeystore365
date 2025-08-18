import { BusinessError, ValidationError } from '@/lib/errors/custom-errors';
import { logger } from '@/lib/logger';
import { createClientServer } from '@/lib/supabase/server';
import {
    AddToCartData,
    Cart,
    CartItem,
    CartValidationError,
    CartValidationResult,
    CartValidationWarning,
    UpdateCartItemData,
} from '@/types/business';
import { ServiceResult } from '@/types/common';
import { CartStatus, ProductStatus } from '@/types/enums';
import { Tables } from '@/types/supabase';
import { productService } from '../products/products.service';
import { CartService } from './cart.types';

type CartRow = Tables<'carts'>;
type CartItemRow = Tables<'cart_items'>;

export class CartServiceImpl implements CartService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutes for cart data

  private getCacheKey(operation: string, customerId: string, params?: any): string {
    return `cart_${customerId}_${operation}_${JSON.stringify(params || {})}`;
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

  private clearCustomerCache(customerId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(`cart_${customerId}_`));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private async mapCartRow(cartRow: CartRow, items: any[] = []): Promise<Cart> {
    const cartItems: CartItem[] = [];
    let totalAmount = 0;
    let totalItems = 0;

    for (const item of items) {
      const product = item.products;
      if (product) {
        const unitPrice = product.price || 0;
        const totalPrice = unitPrice * item.quantity;

        cartItems.push({
          id: item.id,
          cartId: cartRow.id,
          productId: item.product_id,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            imageUrl: product.image_url,
            status: ProductStatus.ACTIVE,
            categories: [],
            images: [],
            isActive: true,
            createdAt: new Date(product.created_at),
            updatedAt: new Date(product.created_at),
          },
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          addedAt: new Date(item.created_at),
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.created_at),
        });

        totalAmount += totalPrice;
        totalItems += item.quantity;
      }
    }

    return {
      id: cartRow.id,
      customerId: cartRow.customer_id || '',
      items: cartItems,
      totalAmount,
      totalItems,
      status: CartStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      finalAmount: totalAmount,
      createdAt: new Date(cartRow.created_at),
      updatedAt: new Date(cartRow.updated_at),
    };
  }

  async getOrCreateCart(customerId: string): Promise<ServiceResult<Cart>> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey('getOrCreateCart', customerId);

    try {
      if (!customerId) {
        throw new ValidationError('Customer ID is required', 'customerId', 'REQUIRED');
      }

      // Check cache first
      const cached = this.getFromCache<Cart>(cacheKey);
      if (cached) {
        logger.debug('Cart retrieved from cache', {
          action: 'getOrCreateCart',
          customerId,
          cacheHit: true,
        });
        return { success: true, data: cached };
      }

      const supabase = await createClientServer();

      // Try to get existing cart
      let { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select(
          `
          *,
          cart_items (
            *,
            products (*)
          )
        `
        )
        .eq('customer_id', customerId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // If no cart exists, create one
      if (cartError && cartError.code === 'PGRST116') {
        const { data: newCartData, error: createError } = await supabase
          .from('carts')
          .insert({
            customer_id: customerId,
          })
          .select(
            `
            *,
            cart_items (
              *,
              products (*)
            )
          `
          )
          .single();

        if (createError) {
          logger.error('Failed to create cart', createError, {
            action: 'getOrCreateCart',
            customerId,
          });
          throw new BusinessError('Failed to create cart', 'CART_CREATE_ERROR');
        }

        cartData = newCartData;
      } else if (cartError) {
        logger.error('Failed to fetch cart', cartError, {
          action: 'getOrCreateCart',
          customerId,
        });
        throw new BusinessError('Failed to fetch cart', 'CART_FETCH_ERROR');
      }

      const cart = await this.mapCartRow(cartData, cartData.cart_items || []);

      // Cache the result
      this.setCache(cacheKey, cart);

      logger.info('Cart retrieved/created successfully', {
        action: 'getOrCreateCart',
        customerId,
        cartId: cart.id,
        itemCount: cart.items.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: cart };
    } catch (error) {
      logger.error('Error in getOrCreateCart', error as Error, {
        action: 'getOrCreateCart',
        customerId,
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
          message: 'An unexpected error occurred while retrieving cart',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async getCart(customerId: string): Promise<ServiceResult<Cart>> {
    return this.getOrCreateCart(customerId);
  }

  async addItem(customerId: string, data: AddToCartData): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!customerId) {
        throw new ValidationError('Customer ID is required', 'customerId', 'REQUIRED');
      }
      if (!data.productId) {
        throw new ValidationError('Product ID is required', 'productId', 'REQUIRED');
      }
      if (!data.quantity || data.quantity <= 0) {
        throw new ValidationError('Quantity must be greater than 0', 'quantity', 'INVALID');
      }
      if (data.quantity > 100) {
        throw new ValidationError('Quantity cannot exceed 100', 'quantity', 'INVALID');
      }

      // Verify product exists and has sufficient stock
      const productResult = await productService.getProduct(data.productId);
      if (!productResult.success || !productResult.data) {
        throw new BusinessError('Product not found', 'PRODUCT_NOT_FOUND');
      }

      const product = productResult.data;
      if (product.stock < data.quantity) {
        throw new BusinessError(
          `Insufficient stock. Available: ${product.stock}, Requested: ${data.quantity}`,
          'INSUFFICIENT_STOCK'
        );
      }

      // Get or create cart
      const cartResult = await this.getOrCreateCart(customerId);
      if (!cartResult.success || !cartResult.data) {
        throw new BusinessError('Failed to get cart', 'CART_ACCESS_ERROR');
      }

      const cart = cartResult.data;
      const supabase = await createClientServer();

      // Check if item already exists in cart
      const { data: existingItem, error: existingError } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('product_id', data.productId)
        .single();

      if (existingError && existingError.code !== 'PGRST116') {
        logger.error('Failed to check existing cart item', existingError, {
          action: 'addItem',
          customerId,
          productId: data.productId,
        });
        throw new BusinessError('Failed to check cart item', 'CART_ITEM_CHECK_ERROR');
      }

      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + data.quantity;

        // Check total quantity against stock
        if (newQuantity > product.stock) {
          throw new BusinessError(
            `Total quantity would exceed stock. Available: ${product.stock}, Total requested: ${newQuantity}`,
            'INSUFFICIENT_STOCK'
          );
        }

        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (updateError) {
          logger.error('Failed to update cart item quantity', updateError, {
            action: 'addItem',
            customerId,
            itemId: existingItem.id,
          });
          throw new BusinessError('Failed to update cart item', 'CART_ITEM_UPDATE_ERROR');
        }
      } else {
        // Add new item
        const { error: insertError } = await supabase.from('cart_items').insert({
          cart_id: cart.id,
          product_id: data.productId,
          quantity: data.quantity,
        });

        if (insertError) {
          logger.error('Failed to add item to cart', insertError, {
            action: 'addItem',
            customerId,
            productId: data.productId,
          });
          throw new BusinessError('Failed to add item to cart', 'CART_ITEM_ADD_ERROR');
        }
      }

      // Update cart timestamp
      await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

      // Clear cache
      this.clearCustomerCache(customerId);

      logger.info('Item added to cart successfully', {
        action: 'addItem',
        customerId,
        productId: data.productId,
        quantity: data.quantity,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in addItem', error as Error, {
        action: 'addItem',
        customerId,
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
          message: 'An unexpected error occurred while adding item to cart',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async updateItem(customerId: string, data: UpdateCartItemData): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!customerId) {
        throw new ValidationError('Customer ID is required', 'customerId', 'REQUIRED');
      }
      if (!data.itemId) {
        throw new ValidationError('Item ID is required', 'itemId', 'REQUIRED');
      }
      if (!data.quantity || data.quantity <= 0) {
        throw new ValidationError('Quantity must be greater than 0', 'quantity', 'INVALID');
      }
      if (data.quantity > 100) {
        throw new ValidationError('Quantity cannot exceed 100', 'quantity', 'INVALID');
      }

      const supabase = await createClientServer();

      // Get cart item with product info
      const { data: cartItem, error: itemError } = await supabase
        .from('cart_items')
        .select(
          `
          *,
          carts!inner(customer_id),
          products(*)
        `
        )
        .eq('id', data.itemId)
        .single();

      if (itemError) {
        if (itemError.code === 'PGRST116') {
          throw new BusinessError('Cart item not found', 'CART_ITEM_NOT_FOUND');
        }
        logger.error('Failed to fetch cart item', itemError, {
          action: 'updateItem',
          customerId,
          itemId: data.itemId,
        });
        throw new BusinessError('Failed to fetch cart item', 'CART_ITEM_FETCH_ERROR');
      }

      // Verify ownership
      if (cartItem.carts.customer_id !== customerId) {
        throw new BusinessError('Unauthorized cart access', 'UNAUTHORIZED_CART_ACCESS');
      }

      // Check stock availability
      const product = cartItem.products;
      if (product && product.stock < data.quantity) {
        throw new BusinessError(
          `Insufficient stock. Available: ${product.stock}, Requested: ${data.quantity}`,
          'INSUFFICIENT_STOCK'
        );
      }

      // Update item quantity
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: data.quantity })
        .eq('id', data.itemId);

      if (updateError) {
        logger.error('Failed to update cart item', updateError, {
          action: 'updateItem',
          customerId,
          itemId: data.itemId,
        });
        throw new BusinessError('Failed to update cart item', 'CART_ITEM_UPDATE_ERROR');
      }

      // Update cart timestamp
      await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartItem.cart_id);

      // Clear cache
      this.clearCustomerCache(customerId);

      logger.info('Cart item updated successfully', {
        action: 'updateItem',
        customerId,
        itemId: data.itemId,
        newQuantity: data.quantity,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in updateItem', error as Error, {
        action: 'updateItem',
        customerId,
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
          message: 'An unexpected error occurred while updating cart item',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async removeItem(customerId: string, itemId: string): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!customerId) {
        throw new ValidationError('Customer ID is required', 'customerId', 'REQUIRED');
      }
      if (!itemId) {
        throw new ValidationError('Item ID is required', 'itemId', 'REQUIRED');
      }

      const supabase = await createClientServer();

      // Verify item exists and belongs to customer
      const { data: cartItem, error: itemError } = await supabase
        .from('cart_items')
        .select(
          `
          *,
          carts!inner(customer_id)
        `
        )
        .eq('id', itemId)
        .single();

      if (itemError) {
        if (itemError.code === 'PGRST116') {
          throw new BusinessError('Cart item not found', 'CART_ITEM_NOT_FOUND');
        }
        logger.error('Failed to fetch cart item', itemError, {
          action: 'removeItem',
          customerId,
          itemId,
        });
        throw new BusinessError('Failed to fetch cart item', 'CART_ITEM_FETCH_ERROR');
      }

      // Verify ownership
      if (cartItem.carts.customer_id !== customerId) {
        throw new BusinessError('Unauthorized cart access', 'UNAUTHORIZED_CART_ACCESS');
      }

      // Remove item
      const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', itemId);

      if (deleteError) {
        logger.error('Failed to remove cart item', deleteError, {
          action: 'removeItem',
          customerId,
          itemId,
        });
        throw new BusinessError('Failed to remove cart item', 'CART_ITEM_REMOVE_ERROR');
      }

      // Update cart timestamp
      await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cartItem.cart_id);

      // Clear cache
      this.clearCustomerCache(customerId);

      logger.info('Cart item removed successfully', {
        action: 'removeItem',
        customerId,
        itemId,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in removeItem', error as Error, {
        action: 'removeItem',
        customerId,
        itemId,
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
          message: 'An unexpected error occurred while removing cart item',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async clearCart(customerId: string): Promise<ServiceResult<void>> {
    const startTime = Date.now();

    try {
      if (!customerId) {
        throw new ValidationError('Customer ID is required', 'customerId', 'REQUIRED');
      }

      // Get cart
      const cartResult = await this.getOrCreateCart(customerId);
      if (!cartResult.success || !cartResult.data) {
        throw new BusinessError('Failed to get cart', 'CART_ACCESS_ERROR');
      }

      const cart = cartResult.data;
      const supabase = await createClientServer();

      // Remove all items from cart
      const { error: deleteError } = await supabase.from('cart_items').delete().eq('cart_id', cart.id);

      if (deleteError) {
        logger.error('Failed to clear cart items', deleteError, {
          action: 'clearCart',
          customerId,
          cartId: cart.id,
        });
        throw new BusinessError('Failed to clear cart', 'CART_CLEAR_ERROR');
      }

      // Update cart timestamp
      await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

      // Clear cache
      this.clearCustomerCache(customerId);

      logger.info('Cart cleared successfully', {
        action: 'clearCart',
        customerId,
        cartId: cart.id,
        duration: Date.now() - startTime,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error in clearCart', error as Error, {
        action: 'clearCart',
        customerId,
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
          message: 'An unexpected error occurred while clearing cart',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  async validateCart(customerId: string): Promise<ServiceResult<CartValidationResult>> {
    const startTime = Date.now();

    try {
      if (!customerId) {
        throw new ValidationError('Customer ID is required', 'customerId', 'REQUIRED');
      }

      // Get cart
      const cartResult = await this.getCart(customerId);
      if (!cartResult.success || !cartResult.data) {
        throw new BusinessError('Failed to get cart for validation', 'CART_ACCESS_ERROR');
      }

      const cart = cartResult.data;
      const errors: CartValidationError[] = [];
      const warnings: CartValidationWarning[] = [];

      // Validate each cart item
      for (const item of cart.items) {
        // Get current product data
        const productResult = await productService.getProduct(item.productId);
        if (!productResult.success || !productResult.data) {
          errors.push({
            itemId: item.id,
            productId: item.productId,
            type: 'product_unavailable',
            message: 'Product is no longer available',
          });
          continue;
        }

        const currentProduct = productResult.data;

        // Check stock availability
        if (currentProduct.stock === 0) {
          errors.push({
            itemId: item.id,
            productId: item.productId,
            type: 'out_of_stock',
            message: 'Product is out of stock',
            currentStock: 0,
            requestedQuantity: item.quantity,
          });
        } else if (currentProduct.stock < item.quantity) {
          errors.push({
            itemId: item.id,
            productId: item.productId,
            type: 'insufficient_stock',
            message: `Insufficient stock. Available: ${currentProduct.stock}, Requested: ${item.quantity}`,
            currentStock: currentProduct.stock,
            requestedQuantity: item.quantity,
          });
        } else if (currentProduct.stock <= 5 && currentProduct.stock >= item.quantity) {
          warnings.push({
            itemId: item.id,
            productId: item.productId,
            type: 'low_stock',
            message: `Low stock warning. Only ${currentProduct.stock} items remaining`,
            details: { currentStock: currentProduct.stock },
          });
        }

        // Check price changes
        if (currentProduct.price !== item.unitPrice) {
          if (currentProduct.price > item.unitPrice) {
            warnings.push({
              itemId: item.id,
              productId: item.productId,
              type: 'price_increase',
              message: `Price has increased from ${item.unitPrice} to ${currentProduct.price}`,
              details: {
                oldPrice: item.unitPrice,
                newPrice: currentProduct.price,
              },
            });
          } else {
            errors.push({
              itemId: item.id,
              productId: item.productId,
              type: 'price_changed',
              message: `Price has changed from ${item.unitPrice} to ${currentProduct.price}`,
            });
          }
        }
      }

      const validationResult: CartValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      logger.info('Cart validation completed', {
        action: 'validateCart',
        customerId,
        isValid: validationResult.isValid,
        errorCount: errors.length,
        warningCount: warnings.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: validationResult };
    } catch (error) {
      logger.error('Error in validateCart', error as Error, {
        action: 'validateCart',
        customerId,
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
          message: 'An unexpected error occurred while validating cart',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  // Additional method for searching carts (admin functionality)
  async searchCarts(filters?: any): Promise<ServiceResult<Cart[]>> {
    const startTime = Date.now();

    try {
      const supabase = await createClientServer('service_role');

      let query = supabase.from('carts').select(`
          *,
          cart_items (
            *,
            products (*)
          )
        `);

      // Apply filters if provided
      if (filters?.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to search carts', error, {
          action: 'searchCarts',
          filters,
        });
        throw new BusinessError('Failed to search carts', 'CARTS_SEARCH_ERROR');
      }

      const carts = await Promise.all((data || []).map(cartRow => this.mapCartRow(cartRow, cartRow.cart_items || [])));

      logger.info('Carts search completed', {
        action: 'searchCarts',
        count: carts.length,
        duration: Date.now() - startTime,
      });

      return { success: true, data: carts };
    } catch (error) {
      logger.error('Error in searchCarts', error as Error, {
        action: 'searchCarts',
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
          message: 'An unexpected error occurred while searching carts',
          code: 'UNKNOWN_ERROR',

        },
      };
    }
  }

  // Cache management methods
  async clearCache(key?: string): Promise<ServiceResult<void>> {
    try {
      if (key) {
        this.cache.delete(key);
        logger.info('Cart service cache key cleared', { action: 'clearCache', key });
      } else {
        this.cache.clear();
        logger.info('Cart service cache cleared', { action: 'clearCache' });
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Failed to clear cart service cache', error as Error, { key });
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
        logger.info('Cart service cache key refreshed', { action: 'refreshCache', key });
      } else {
        this.cache.clear();
        logger.info('Cart service cache refreshed', { action: 'refreshCache' });
      }
      
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('Failed to refresh cart service cache', error as Error, { key });
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

// Export singleton instance
export const cartService = new CartServiceImpl();
