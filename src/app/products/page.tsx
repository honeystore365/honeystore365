import { createClientServer } from "@/lib/supabase/server";
import ProductCardClient from "@/components/ProductCardClient";
import type { ProductRow } from "@/types/business/product";

export default async function ProductsPage() {
  const supabase = await createClientServer();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, stock, created_at");

  if (error) {
    console.error("Error fetching products:", error);
    return <p>Error loading products. Please try again later.</p>;
  }

  if (!products || products.length === 0) {
    return <p>No products found.</p>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        منتجاتنا
      </h1>
      {/* Filters - Kept for now, can be made functional later */}
      <div className="flex items-center justify-between mb-6">
        {/* Type Filter */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            النوع
          </label>
          <select
            id="type"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option>الكل</option>
            <option>عسل طبيعي</option>
            <option>منتجات النحل</option>
          </select>
        </div>

        {/* Price Filter */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            السعر
          </label>
          <select
            id="price"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          >
            <option>الكل</option>
            <option>أقل من 100 د.ت</option>
            <option>100 - 200 د.ت</option>
            <option>أكثر من 200 د.ت</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCardClient key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
