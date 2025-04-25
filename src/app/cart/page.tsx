

export default function CartPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        السلة
      </h1>

      {/* Cart Items */}
      <div className="flex flex-col gap-4">
        {/* Cart Item 1 */}
        <div className="flex items-center border rounded-xl p-4 shadow-sm">
          <img
            src="https://picsum.photos/100/100"
            alt="Product 1"
            className="w-24 h-24 object-cover rounded-md mr-4"
          />
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">
              اسم المنتج
            </h3>
            <p className="text-gray-600">
              وصف المنتج باختصار
            </p>
          </div>
          <div className="flex items-center">
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-l">
              -
            </button>
            <input
              className="mx-2 border text-center w-16 rounded"
              type="text"
              value="1"
            />
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-r">
              +
            </button>
          </div>
          <span className="text-lg font-bold ml-4">
            150 د.ت
          </span>
        </div>
        {/* Cart Item 2 */}
        <div className="flex items-center border rounded-xl p-4 shadow-sm">
          <img
            src="https://picsum.photos/100/100"
            alt="Product 2"
            className="w-24 h-24 object-cover rounded-md mr-4"
          />
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">
              اسم المنتج
            </h3>
            <p className="text-gray-600">
              وصف المنتج باختصار
            </p>
          </div>
          <div className="flex items-center">
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-l">
              -
            </button>
            <input
              className="mx-2 border text-center w-16 rounded"
              type="text"
              value="2"
            />
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-r">
              +
            </button>
          </div>
          <span className="text-lg font-bold ml-4">
            80 د.ت
          </span>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="mt-8 flex justify-between items-center">
        <span className="text-xl font-bold">
          المجموع الكلي: 230 د.ت
        </span>
        <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-3 px-8 rounded-full transition-colors duration-300">
          إتمام الشراء
        </button>
      </div>
    </div>
  );
}

