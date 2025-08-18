'use client';

import Image from 'next/image';
import { AddToCartButton } from '@/components/ui/add-to-cart-button';

// Define Product type (should match definition in profile/page.tsx or a shared types file)
interface Product {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
}

export default function ProductCardClient({ product }: { product: Product }) {
  if (!product) return null;

  return (
    <div className="rounded-xl overflow-hidden shadow-lg bg-white flex flex-col">
      <div className="relative w-full h-56">
        <Image
          src={product.image_url || "https://picsum.photos/400/300"} // Fallback image
          alt={product.name || "Product Image"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="rounded-t-xl object-cover"
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
          <AddToCartButton
            productId={product.id}
            productName={product.name || "Product"}
            className="bg-honey hover:bg-honey-dark text-white rounded-full"
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}
