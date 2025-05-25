import Image from 'next/image';
import { createClientServerReadOnly } from '@/lib/supabaseServerReadOnly';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Define Product type based on expected data
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

export default async function Home() {
  // Fetch products server-side
  const supabase = await createClientServerReadOnly();
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url')
    .order('created_at', { ascending: false }) // Example order
    .limit(6); // Limit to 6 products for the main page

  if (error) {
    console.error("Error fetching products for main page:", JSON.stringify(error, null, 2));
    // Optionally return an error state or fallback UI
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-4xl font-bold mb-12 text-center">
          منتجاتنا المميزة
        </h2>
        <p className="text-red-500">
          حدث خطأ أثناء تحميل المنتجات. يرجى المحاولة مرة أخرى لاحقاً.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Hero Section */}
      <section className="relative rounded-xl overflow-hidden text-white shadow-lg mb-16">
        <div className="absolute inset-0 bg-honey/30 z-10" />
        <Image
          src="/images/hero-background.png"
          alt="Welcome to Nectar Hives"
          width={1200}
          height={400}
          priority
          className="absolute inset-0 object-cover w-full"
          style={{ height: 'auto' }}
        />
        <div className="relative z-20 p-12 flex flex-col items-center justify-center min-h-[400px]">
          <h1 className="text-5xl font-bold text-center mb-6">
            مناحل الرحيق
          </h1>
          <p className="text-xl text-center mb-8 max-w-2xl">
            عسل طبيعي 100% من أجود المناحل مع ضمان الجودة والطعم الأصيل
          </p>
          <Link href="/products">
             <Button className="bg-honey hover:bg-honey-dark text-white font-bold py-3 px-10 rounded-full text-lg shadow-md transition-all duration-300">
                اكتشف منتجاتنا
             </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mt-16">
        <h2 className="text-4xl font-bold mb-12 text-center">
          منتجاتنا المميزة
        </h2>
        {error && <p className="text-center text-red-500">خطأ في تحميل المنتجات.</p>}
        {!error && products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => (
              <div key={product.id} className="rounded-xl overflow-hidden shadow-lg bg-white border border-honey/20 flex flex-col">
                <Link href={`/products/${product.id}`} className="block relative h-48 bg-gray-100">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name ?? 'Product image'}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">لا توجد صورة</div>
                  )}
                </Link>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-2xl font-bold mb-3 text-honey-dark">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                       {product.name}
                    </Link>
                  </h3>
                  <p className="text-gray-700 mb-5 flex-grow">
                    {product.description || 'لا يوجد وصف متاح.'}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-honey">
                      {product.price ? `${product.price.toFixed(2)} د.ت` : 'السعر غير متاح'}
                    </span>
                    <Button className="bg-honey hover:bg-honey-dark text-white font-bold py-2 px-6 rounded-full transition-colors duration-300">
                      أضف إلى السلة
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !error && <p className="text-center text-gray-500">لا توجد منتجات مميزة حالياً.</p>
        )}
      </section>

      {/* About Section */}
      <section className="my-20 py-12 bg-honey-light/10 rounded-xl">
         <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-8 text-center">
            عن مناحل الرحيق
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Image
                src="/images/about-honey.png"
                alt="مناحل الرحيق"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-honey-dark">
                عسل طبيعي 100% منذ 1985
              </h3>
              <p className="text-lg text-gray-700">
                نقدم لكم أجود أنواع العسل الطبيعي من مناحلنا الخاصة، حيث نحرص على الجودة والنقاء في كل منتج.
              </p>
              <p className="text-lg text-gray-700">
                نتبع أعلى معايير التربية والنحل للحفاظ على البيئة وجودة المنتج.
              </p>
              <button className="mt-4 bg-honey hover:bg-honey-dark text-white font-bold py-3 px-8 rounded-full transition-colors duration-300">
                المزيد عنا
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="my-20">
         <h2 className="text-4xl font-bold mb-12 text-center">
          آراء عملائنا
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white p-8 rounded-xl shadow-md border border-honey/20">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-honey/10 flex items-center justify-center">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-bold">محمد علي</h4>
                  <p className="text-sm text-gray-500">عميل منذ 2020</p>
                </div>
              </div>
              <p className="text-gray-700">
                "أفضل عسل جربته في حياتي! النكهة والجودة لا تضاهى. أوصي به بشدة."
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="my-20 py-16 bg-honey/5 rounded-xl">
         <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            جرب عسلنا اليوم!
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            اشترك في نشرتنا البريدية واحصل على خصم 10% على أول طلبية
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="بريدك الإلكتروني"
              className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-honey"
            />
            <button className="bg-honey hover:bg-honey-dark text-white font-bold py-3 px-8 rounded-full transition-colors duration-300">
              اشتراك
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
