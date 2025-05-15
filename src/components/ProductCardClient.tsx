'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { addItemToCart } from '@/actions/cartActions'; // Import server action
import { useToast } from '@/hooks/use-toast'; // Assuming a toast hook exists

// Define Product type (should match definition in profile/page.tsx or a shared types file)
interface Product {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
}

export default function ProductCardClient({ product }: { product: Product }) {
  const { toast } = useToast(); // For user feedback

  const handleAddToCart = async () => {
    console.log('ProductCardClient: Adding to cart, product:', JSON.stringify(product, null, 2)); // Log product details
    if (!product.id) {
      console.error('ProductCardClient: Product ID is missing for product:', product.name);
      toast({
        title: "Error",
        description: "Product ID is missing.",
        variant: "destructive",
      });
      return;
    }
    try {
      const result = await addItemToCart(product.id, 1); // Add 1 quantity
      if (result.success) {
        toast({
          title: "Success!",
          description: `${product.name || 'Product'} added to cart.`,
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Could not add item to cart.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (!product) return null;

  return (
    <div className="rounded-xl overflow-hidden shadow-lg bg-white flex flex-col">
      <div className="relative w-full h-56">
        <Image
          src={product.image_url || "https://picsum.photos/400/300"} // Fallback image
          alt={product.name || "Product Image"}
          layout="fill"
          objectFit="cover"
          className="rounded-t-xl"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold mb-2 text-honey-dark">
          {product.name || "Unnamed Product"}
        </h3>
        <p className="text-gray-700 text-sm mb-3 h-20 overflow-hidden flex-grow">
          {product.description || "No description available."}
        </p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-2xl font-bold text-honey">
            {product.price ? `${product.price} د.ت` : "Price not set"}
          </span>
          <Button 
            variant="default" 
            size="lg" 
            className="bg-honey hover:bg-honey-dark text-white rounded-full group"
            onClick={handleAddToCart}
            disabled={!product.id} // Disable if no product ID
          >
            <ShoppingCart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            أضف إلى السلة
          </Button>
        </div>
      </div>
    </div>
  );
}
