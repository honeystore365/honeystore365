'use client';

import { Cart } from '@/types/business';
import { createBrowserClient } from '@supabase/ssr';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useSession } from './SessionProvider';
import { isAdminEmail } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/logger';

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

export function CartProvider({ children }: CartProviderProps) {
  const { session, loading: sessionLoading } = useSession();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est admin
  const isAdmin = session?.user?.email ? isAdminEmail(session.user.email) : false;

  // Calculer le nombre total d'articles dans le panier
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    logger.debug('CartProvider - cartItemCount calculation:', {
      cart: cart?.id,
      itemsLength: cart?.items?.length,
      cartItemCount,
      items: cart?.items?.map(item => ({ id: item.id, quantity: item.quantity }))
    });
  }
  
  // Cart item count is automatically calculated from cart items

  // Créer le client Supabase pour le navigateur
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Charger le panier quand l'utilisateur est connecté (sauf pour les admins)
  const loadCart = async () => {
    if (!session?.user?.id || sessionLoading || isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      // Charger le panier de l'utilisateur
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select(
          `
          id,
          customer_id,
          created_at,
          updated_at,
          cart_items (
            id,
            product_id,
            quantity,
            created_at,
            products (
              id,
              name,
              price,
              image_url,
              stock
            )
          )
        `
        )
        .eq('customer_id', session.user.id)
        .single();

      if (cartError && cartError.code !== 'PGRST116') {
        throw cartError;
      }

      if (cartData) {
        // Calculer les totaux
        const items = cartData.cart_items || [];
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = items.reduce((sum, item) => {
          const price = (item.products as any)?.price || 0;
          return sum + price * item.quantity;
        }, 0);

        const processedCart = {
          id: cartData.id,
          customerId: cartData.customer_id,
          items: items.map(item => {
            const unitPrice = (item.products as any)?.price || 0;
            return {
              id: item.id,
              cartId: cartData.id,
              productId: item.product_id,
              quantity: item.quantity,
              unitPrice,
              totalPrice: unitPrice * item.quantity,
              addedAt: new Date(item.created_at || Date.now()),
              createdAt: new Date(item.created_at || Date.now()),
              updatedAt: new Date(item.created_at || Date.now()),
              product: item.products
                ? {
                    id: (item.products as any).id,
                    name: (item.products as any).name,
                    price: (item.products as any).price,
                    image_url: (item.products as any).image_url,
                    stock: (item.products as any).stock,
                  }
                : {
                    id: item.product_id,
                    name: 'Unknown Product',
                    price: 0,
                    image_url: '/images/placeholder.svg',
                    stock: 0,
                  },
            };
          }),
          totalItems,
          totalAmount,
          status: 'active' as any, // TODO: Get from database
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          finalAmount: totalAmount, // TODO: Calculate with discounts and shipping
          createdAt: cartData.created_at,
          updatedAt: cartData.updated_at,
        };

        setCart(processedCart as any);
      } else {
        // Créer un nouveau panier si aucun n'existe
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
          status: 'active' as any,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          finalAmount: 0,
          createdAt: newCart.created_at,
          updatedAt: newCart.updated_at,
        } as any);
      }
    } catch (err) {
      logger.error('Error loading cart:', err as Error, { userId: session?.user?.id });
      setError('Erreur lors du chargement du panier');
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir le panier
  const refreshCart = async () => {
    await loadCart();
  };

  // Ajouter un article au panier
  const addToCart = async (productId: string, quantity: number): Promise<boolean> => {
    // Bloquer l'ajout au panier pour les admins
    if (isAdmin) {
      setError('Fonctionnalité panier non disponible pour les administrateurs');
      return false;
    }

    if (!session?.user?.id || !cart) {
      setError('Vous devez être connecté');
      return false;
    }

    setError(null);
    setLoading(true);

    try {
      // Vérifier si l'article existe déjà
      const existingItem = cart.items.find(item => item.productId === productId);

      if (existingItem) {
        // Mettre à jour la quantité
        const newQuantity = existingItem.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Ajouter un nouvel article
        const { error: insertError } = await supabase.from('cart_items').insert([
          {
            cart_id: cart.id,
            product_id: productId,
            quantity: quantity,
          },
        ]);

        if (insertError) throw insertError;
      }

      // Recharger le panier pour mettre à jour l'état
      await loadCart();
      return true;
    } catch (err) {
      logger.error('Error adding to cart:', err as Error, { userId: session?.user?.id, productId, quantity });
      setError("Erreur lors de l'ajout au panier");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour la quantité d'un article
  const updateCartItem = async (itemId: string, quantity: number): Promise<boolean> => {
    // Bloquer la mise à jour du panier pour les admins
    if (isAdmin) {
      setError('Fonctionnalité panier non disponible pour les administrateurs');
      return false;
    }

    if (!session?.user?.id) {
      setError('Vous devez être connecté');
      return false;
    }

    setError(null);

    try {
      if (quantity <= 0) {
        // Supprimer l'article si la quantité est 0
        return await removeFromCart(itemId);
      }

      const { error: updateError } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);

      if (updateError) throw updateError;

      await loadCart();
      return true;
    } catch (err) {
      logger.error('Error updating cart item:', err as Error, { userId: session?.user?.id, itemId, quantity });
      setError('Erreur lors de la mise à jour');
      return false;
    }
  };

  // Supprimer un article du panier
  const removeFromCart = async (itemId: string): Promise<boolean> => {
    // Bloquer la suppression du panier pour les admins
    if (isAdmin) {
      setError('Fonctionnalité panier non disponible pour les administrateurs');
      return false;
    }

    if (!session?.user?.id) {
      setError('Vous devez être connecté');
      return false;
    }

    setError(null);

    try {
      const { error: deleteError } = await supabase.from('cart_items').delete().eq('id', itemId);

      if (deleteError) throw deleteError;

      await loadCart();
      return true;
    } catch (err) {
      logger.error('Error removing from cart:', err as Error, { userId: session?.user?.id, itemId });
      setError('Erreur lors de la suppression');
      return false;
    }
  };

  // Vider le panier
  const clearCart = async (): Promise<boolean> => {
    if (!session?.user?.id || !cart) {
      setError('Vous devez être connecté');
      return false;
    }

    setError(null);

    try {
      const { error: deleteError } = await supabase.from('cart_items').delete().eq('cart_id', cart.id);

      if (deleteError) throw deleteError;

      await loadCart();
      return true;
    } catch (err) {
      logger.error('Error clearing cart:', err as Error, { userId: session?.user?.id, cartId: cart?.id });
      setError('Erreur lors du vidage du panier');
      return false;
    }
  };

  // Charger le panier quand la session change
  useEffect(() => {
    if (session?.user?.id && !sessionLoading) {
      loadCart();
    } else if (!session && !sessionLoading) {
      // Réinitialiser le panier si l'utilisateur se déconnecte
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
    // En mode développement, afficher un warning au lieu de lancer une erreur
    if (process.env.NODE_ENV === 'development') {
      logger.warn('useCart must be used within a CartProvider. Returning default values.');
    }

    // Retourner des valeurs par défaut au lieu de lancer une erreur
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
