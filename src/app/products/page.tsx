
export default function ProductsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        منتجاتنا
      </h1>
      {/* Filters */}
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
            {/* Add more options here */}
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
            <option>أقل من 100 ر.س</option>
            <option>100 - 200 ر.س</option>
            <option>أكثر من 200 ر.س</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Product Card 1 */}
        <div className="rounded-xl overflow-hidden shadow-md">
          <img
            src="https://picsum.photos/400/300"
            alt="Product 1"
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
                150 ر.س
              </span>
              <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-2 px-4 rounded-full transition-colors duration-300">
                أضف إلى السلة
              </button>
            </div>
          </div>
        </div>
        {/* Product Card 2 */}
        <div className="rounded-xl overflow-hidden shadow-md">
          <img
            src="https://picsum.photos/400/300"
            alt="Product 2"
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
                80 ر.س
              </span>
              <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-2 px-4 rounded-full transition-colors duration-300">
                أضف إلى السلة
              </button>
            </div>
          </div>
        </div>
        {/* Product Card 3 */}
        <div className="rounded-xl overflow-hidden shadow-md">
          <img
            src="https://picsum.photos/400/300"
            alt="Product 3"
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
                250 ر.س
              </span>
              <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-2 px-4 rounded-full transition-colors duration-300">
                أضف إلى السلة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
