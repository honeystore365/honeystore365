'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Assuming you have this client setup
import { useRouter } from 'next/navigation';

// Define types based on your Supabase schema and API response
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
  image_url: string | null; // Added image_url
}

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products: Product | null; // Link to the Product type
}

interface Cart {
  id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  cart_items: CartItem[]; // Link to the CartItem type
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/cart/view');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch cart.');
        setCart(null);
        setTotalAmount(0);
      } else {
        setCart(data.cart);
        setTotalAmount(data.totalAmount);
      }
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError('An unexpected error occurred while fetching the cart.');
      setCart(null);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setLoading(true); // Indicate loading while updating
    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart_item_id: cartItemId, quantity: newQuantity }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update cart item quantity.');
      } else {
        // Re-fetch the cart to get the updated state and total
        fetchCart();
      }
    } catch (err: any) {
      console.error('Error updating cart item quantity:', err);
      setError('An unexpected error occurred while updating the cart item.');
    } finally {
       // Loading will be set to false by fetchCart() if successful
       // If update fails, we still want to show the current cart state,
       // so we only set loading to false here if fetchCart wasn't called.
       if (error) setLoading(false);
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    setLoading(true); // Indicate loading while removing
    try {
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart_item_id: cartItemId }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to remove cart item.');
      } else {
        // Re-fetch the cart to get the updated state and total
        fetchCart();
      }
    } catch (err: any) {
      console.error('Error removing cart item:', err);
      setError('An unexpected error occurred while removing the cart item.');
    } finally {
       // Loading will be set to false by fetchCart() if successful
       // If remove fails, we still want to show the current cart state,
       // so we only set loading to false here if fetchCart wasn't called.
       if (error) setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-10 text-center">Loading cart...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        السلة
      </h1>

      {cart && cart.cart_items && cart.cart_items.length > 0 ? (
        <>
          {/* Cart Items */}
          <div className="flex flex-col gap-4">
            {cart.cart_items.map((item) => (
              <div key={item.id} className="flex items-center border rounded-xl p-4 shadow-sm">
                <img
                  src={item.products?.image_url || 'https://picsum.photos/100/100'} // Assuming product has image_url
                  alt={item.products?.name || 'Product image'}
                  className="w-24 h-24 object-cover rounded-md mr-4"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {item.products?.name || 'Unknown Product'}
                  </h3>
                  <p className="text-gray-600">
                    {item.products?.description || 'No description available.'}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-l"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                  >
                    -
                  </button>
                  <input
                    className="mx-2 border text-center w-16 rounded"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                    min="0"
                  />
                  <button
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-r"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <span className="text-lg font-bold ml-4">
                  {((item.products?.price ?? 0) * item.quantity).toFixed(2)} د.ت
                </span>
                 <button
                    className="ml-4 text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    Remove
                  </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="mt-8 flex justify-between items-center">
            <span className="text-xl font-bold">
              المجموع الكلي: {totalAmount.toFixed(2)} د.ت
            </span>
            <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-3 px-8 rounded-full transition-colors duration-300">
              إتمام الشراء
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-600">Your cart is empty.</div>
      )}
    </div>
  );
}
