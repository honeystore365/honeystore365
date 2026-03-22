'use client';

import { Cart, CartItem } from '@/types/business';
import { CartStatus, ProductStatus } from '@/types/enums';
import { createBrowserClient } from '@supabase/ssr';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useSession } from './SessionProvider';
import { isAdminEmail } from '@/lib/auth/admin-auth';

interface CartContextType {
  cart: Cart | null;
  cartItemCount: number;
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity: number) => Promise<boolean>;
  updateCartItem: (itemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

// Supabase nested response type
interface SupabaseCartItem {
  id: string;
  cart_id: string;
  product_id: string | null;
  quantity: number;
  created_at: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
    created_at: string;
    description: string | null;
  } | null;
}

interface SupabaseCartResponse {
  id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  cart_items: SupabaseCartItem[];
}

export function CartProvider({ children }: CartProviderProps) {
  const { session, loading: sessionLoading } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.email ? isAdminEmail(session.user.email) : false;
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadCart = async () => {
    if (!session?.user?.id || sessionLoading || isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select(`
          id,
          customer_id,
          created_at,
          updated_at,
          cart_items (
            id,
            cart_id,
            product_id,
            quantity,
            created_at,
            products (
              id,
              name,
              price,
              image_url,
              stock,
              created_at,
              description
            )
          )
        `)
        .eq('customer_id', session.user.id)
        .single();

      if (cartError && cartError.code !== 'PGRST116') {
        throw cartError;
      }

      if (cartData) {
        const cartRow = cartData as unknown as SupabaseCartResponse;
        
        const items: CartItem[] = (cartRow.cart_items ?? []).map((item): CartItem => {
          const product = item.products;
          const unitPrice = product?.price ?? 0;
          const productId = item.product_id ?? '';

          return {
            id: item.id,
            cartId: cartRow.id,
            productId,
            quantity: item.quantity,
            unitPrice,
            totalPrice: unitPrice * item.quantity,
            addedAt: new Date(item.created_at ?? Date.now()),
            createdAt: new Date(item.created_at ?? Date.now()),
            updatedAt: new Date(item.created_at ?? Date.now()),
            product: product
              ? {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: product.image_url ?? '/images/placeholder.svg',
                  stock: product.stock,
                  description: product.description ?? undefined,
                  status: ProductStatus.ACTIVE,
                  categories: [],
                  images: [],
                  isActive: true,
                  createdAt: new Date(product.created_at ?? Date.now()),
                  updatedAt: new Date(product.created_at ?? Date.now()),
                }
              : {
                  id: productId,
                  name: 'Unknown Product',
                  price: 0,
                  imageUrl: '/images/placeholder.svg',
                  stock: 0,
                  description: undefined,
                  status: ProductStatus.ACTIVE,
                  categories: [],
                  images: [],
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
          };
        });

        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

        const processedCart: Cart = {
          id: cartRow.id,
          customerId: cartRow.customer_id,
          items,
          totalAmount,
          totalItems,
          status: CartStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          finalAmount: totalAmount,
          createdAt: new Date(cartRow.created_at ?? Date.now()),
          updatedAt: new Date(cartRow.updated_at ?? Date.now()),
        };

        setCart(processedCart);
      } else {
        const { data: newCart, error: createError } = await supabase
          .from('carts')
          .insert([{ customer_id: session.user.id }])
          .select()
          .single();

        if (createError) throw createError;

        setCart({
          id: newCart.id,
          customerId: newCart.customer_id,
          items: [],
          totalItems: 0,
          totalAmount: 0,
          status: CartStatus.ACTIVE,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          finalAmount: 0,
          createdAt: new Date(newCart.created_at ?? Date.now()),
          updatedAt: new Date(newCart.updated_at ?? Date.now()),
        });
      }
    } catch (err) {
      console.error('Error loading cart:', err);
      setError('Error loading cart');
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    await loadCart();
  };

  const addToCart = async (productId: string, quantity: number): Promise<boolean> => {
    if (isAdmin) {
      setError('Cart not available for administrators');
      return false;
    }

    if (!session?.user?.id || !cart) {
      setError('You must be logged in');
      return false;
    }

    setError(null);
    setLoading(true);

    try {
      const existingItem = cart.items.find((item) => item.productId === productId);

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('cart_items').insert([
          {
            cart_id: cart.id,
            product_id: productId,
            quantity,
          },
        ]);

        if (insertError) throw insertError;
      }

      await loadCart();
      return true;
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Error adding to cart');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateCartItem = async (itemId: string, quantity: number): Promise<boolean> => {
    if (isAdmin) {
      setError('Cart not available for administrators');
      return false;
    }

    if (!session?.user?.id) {
      setError('You must be logged in');
      return false;
    }

    setError(null);

    try {
      if (quantity <= 0) {
        return await removeFromCart(itemId);
      }

      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (updateError) throw updateError;

      await loadCart();
      return true;
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError('Error updating item');
      return false;
    }
  };

  const removeFromCart = async (itemId: string): Promise<boolean> => {
    if (isAdmin) {
      setError('Cart not available for administrators');
      return false;
    }

    if (!session?.user?.id) {
      setError('You must be logged in');
      return false;
    }

    setError(null);

    try {
      const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', itemId);

      if (deleteError) throw deleteError;

      await loadCart();
      return true;
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Error removing item');
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!session?.user?.id || !cart) {
      setError('You must be logged in');
      return false;
    }

    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (deleteError) throw deleteError;

      await loadCart();
      return true;
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Error clearing cart');
      return false;
    }
  };

  useEffect(() => {
    if (session?.user?.id && !sessionLoading) {
      loadCart();
    } else if (!session && !sessionLoading) {
      setCart(null);
      setError(null);
    }
  }, [session?.user?.id, sessionLoading]);

  const value: CartContextType = {
    cart,
    cartItemCount,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('useCart must be used within a CartProvider. Returning default values.');
    }

    return {
      cart: null,
      cartItemCount: 0,
      loading: false,
      error: null,
      addToCart: async () => false,
      updateCartItem: async () => false,
      removeFromCart: async () => false,
      clearCart: async () => false,
      refreshCart: async () => {},
    };
  }
  return context;
}

export default CartProvider;
