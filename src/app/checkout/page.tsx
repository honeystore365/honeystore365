
export default function CheckoutPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        إتمام الشراء
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            ملخص الطلب
          </h2>
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
                  الكمية: 1
                </p>
              </div>
              <span className="text-lg font-bold">
                150 ر.س
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
                  الكمية: 2
                </p>
              </div>
              <span className="text-lg font-bold">
                80 ر.س
              </span>
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <span className="text-xl font-bold">
              المجموع الكلي:
            </span>
            <span className="text-xl font-bold">
              230 ر.س
            </span>
          </div>
        </div>

        {/* Delivery Information */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            معلومات التوصيل
          </h2>
          <form className="flex flex-col gap-4">
            <label className="flex flex-col">
              الاسم:
              <input
                type="text"
                className="border rounded-md p-2"
                placeholder="الاسم الكامل"
              />
            </label>
            <label className="flex flex-col">
              العنوان:
              <input
                type="text"
                className="border rounded-md p-2"
                placeholder="العنوان بالتفصيل"
              />
            </label>
            <label className="flex flex-col">
              رقم الهاتف:
              <input
                type="tel"
                className="border rounded-md p-2"
                placeholder="رقم الهاتف"
              />
            </label>
            <label className="flex flex-col">
              البريد الإلكتروني:
              <input
                type="email"
                className="border rounded-md p-2"
                placeholder="البريد الإلكتروني"
              />
            </label>

            <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-3 rounded-full transition-colors duration-300">
              تأكيد الطلب
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
