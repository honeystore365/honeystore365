

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = params.id;

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="rounded-xl overflow-hidden shadow-md">
          <img
            src="https://picsum.photos/600/400"
            alt={`Product ${productId}`}
            className="object-cover w-full h-96"
          />
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-3xl font-bold mb-4">
            اسم المنتج
          </h1>
          <p className="text-gray-600 mb-6">
            وصف المنتج: منتج عالي الجودة بفوائد صحية ونكهة مميزة.
          </p>
          <div className="flex items-center justify-between mb-6">
            <span className="text-2xl font-bold">
              150 د.ت
            </span>
            <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-2 px-8 rounded-full transition-colors duration-300">
              أضف إلى السلة
            </button>
          </div>
          {/* Additional details or specifications can go here */}
        </div>
      </div>
    </div>
  );
}

