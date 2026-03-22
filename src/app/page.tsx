"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/db";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const prods = await getProducts();
        setProducts((prods || []) as unknown as Product[]);
      } catch (error) {
        console.error("Error:", error);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <Navbar />
      
      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <h1 className="text-5xl font-bold text-amber-800 mb-4">
          أفضل العسل والتمور في تونس
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          منتجات طبيعية 100% من المزارع التونسية
        </p>
        <Link href="#products" className="bg-amber-600 text-white px-8 py-3 rounded-full text-lg hover:bg-amber-700 transition">
          تسوق الآن
        </Link>
      </section>

      {/* Products */}
      <section id="products" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">منتجاتنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-6xl">🍯</span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description || "منتج طبيعي"}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-amber-600">{(product.price / 1000).toFixed(3)} د.ت</span>
                    <Link href="/cart" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition">
                      أضف للسلة
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
