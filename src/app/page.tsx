
"use client";

import Image from 'next/image';
import {
  motion,
  AnimatePresence
} from 'framer-motion';

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative rounded-xl overflow-hidden text-white shadow-lg"
      >
        <div className="absolute inset-0 bg-honey/30 z-10" />
        <Image
          src="https://via.placeholder.com/1200x400.png?text=Hero+Background" // Placeholder
          alt="Welcome to Nectar Hives"
          width={1200}
          height={400}
          className="absolute inset-0 object-cover w-full h-full"
        />
        <div className="relative z-20 p-12 flex flex-col items-center justify-center min-h-[400px]">
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-5xl font-bold text-center mb-6"
          >
            مناحل الرحيق
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-center mb-8 max-w-2xl"
          >
            عسل طبيعي 100% من أجود المناحل مع ضمان الجودة والطعم الأصيل
          </motion.p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-honey hover:bg-honey-dark text-white font-bold py-3 px-10 rounded-full text-lg shadow-md transition-all duration-300"
          >
            اكتشف منتجاتنا
          </motion.button>
        </div>
      </motion.section>

      {/* Featured Products */}
      <section className="mt-16">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-12 text-center"
        >
          منتجاتنا المميزة
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Product Card 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="rounded-xl overflow-hidden shadow-lg bg-white border border-honey/20"
          >
            <div className="relative h-48 bg-honey-light/20">
              <Image
                src="https://via.placeholder.com/400x300.png?text=Sidr+Honey" // Placeholder
                alt="عسل السدر"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-3 text-honey-dark">
                عسل السدر
              </h3>
              <p className="text-gray-700 mb-5">
                من أجود أنواع العسل، يتميز بفوائده الصحية ونكهته الغنية.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-honey">
                  150 د.ت
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-honey hover:bg-honey-dark text-white font-bold py-2 px-6 rounded-full transition-colors duration-300"
                >
                  أضف إلى السلة
                </motion.button>
              </div>
            </div>
          </motion.div>
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

      {/* About Section */}
      <section className="my-20 py-12 bg-honey-light/10 rounded-xl">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-bold mb-8 text-center"
          >
            عن مناحل الرحيق
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Image
                src="https://via.placeholder.com/600x400.png?text=About+Honey" // Placeholder
                alt="مناحل الرحيق"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </motion.div>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="my-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-4xl font-bold mb-12 text-center"
        >
          آراء عملائنا
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-xl shadow-md border border-honey/20"
            >
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
            </motion.div>
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

