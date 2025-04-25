
import Image from 'next/image';

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      {/* Welcome Banner */}
      <section className="relative rounded-xl overflow-hidden text-white shadow-md">
        <Image
          src="https://picsum.photos/1200/400"
          alt="Welcome to our Honey Shop"
          width={1200}
          height={400}
          className="absolute inset-0 object-cover w-full h-full"
        />
        <div className="relative p-12 flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-center mb-4">
            مرحباً بكم في منحلة الرحيق
          </h1>
          <p className="text-lg text-center mb-6">
            اكتشف مجموعتنا المميزة من العسل الطبيعي ومنتجات النحل.
          </p>
          <button className="bg-accent hover:bg-accent-foreground text-primary-foreground font-bold py-2 px-8 rounded-full transition-colors duration-300">
            تسوق الآن
          </button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mt-16">
        <h2 className="text-3xl font-bold mb-8 text-center">
          منتجاتنا المميزة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Product Card 1 */}
          <div className="rounded-xl overflow-hidden shadow-md">
            <Image
              src="https://picsum.photos/400/300"
              alt="Product 1"
              width={400}
              height={300}
              className="object-cover w-full h-48"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">
                عسل السدر
              </h3>
              <p className="text-gray-600 mb-4">
                من أجود أنواع العسل، يتميز بفوائده الصحية ونكهته الغنية.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  150 د.ت
                </span>
                <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-2 px-4 rounded-full transition-colors duration-300">
                  أضف إلى السلة
                </button>
              </div>
            </div>
          </div>
          {/* Product Card 2 */}
          <div className="rounded-xl overflow-hidden shadow-md">
            <Image
              src="https://picsum.photos/400/300"
              alt="Product 2"
              width={400}
              height={300}
              className="object-cover w-full h-48"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">
                شمع العسل
              </h3>
              <p className="text-gray-600 mb-4">
                شمع طبيعي 100%، مثالي لصنع الشموع أو استخدامه في العلاجات الطبيعية.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  80 د.ت
                </span>
                <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-2 px-4 rounded-full transition-colors duration-300">
                  أضف إلى السلة
                </button>
              </div>
            </div>
          </div>
          {/* Product Card 3 */}
          <div className="rounded-xl overflow-hidden shadow-md">
            <Image
              src="https://picsum.photos/400/300"
              alt="Product 3"
              width={400}
              height={300}
              className="object-cover w-full h-48"
            />
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">
                مجموعة هدايا العسل
              </h3>
              <p className="text-gray-600 mb-4">
                مجموعة فاخرة تحتوي على تشكيلة من أجود أنواع العسل، مثالية كهدية لمحبي العسل.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  250 د.ت
                </span>
                <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-2 px-4 rounded-full transition-colors duration-300">
                  أضف إلى السلة
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

