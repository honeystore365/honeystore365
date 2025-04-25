
export default function ProfilePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        حسابي
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order History */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            سجل الطلبات
          </h2>
          <div className="flex flex-col gap-4">
            {/* Order 1 */}
            <div className="border rounded-xl p-4 shadow-sm">
              <h3 className="text-xl font-semibold mb-2">
                طلب رقم: 12345
              </h3>
              <p className="text-gray-600">
                تاريخ الطلب: 2024/01/01
              </p>
              <p className="text-gray-600">
                المجموع الكلي: 150 ر.س
              </p>
            </div>
            {/* Order 2 */}
            <div className="border rounded-xl p-4 shadow-sm">
              <h3 className="text-xl font-semibold mb-2">
                طلب رقم: 67890
              </h3>
              <p className="text-gray-600">
                تاريخ الطلب: 2023/12/25
              </p>
              <p className="text-gray-600">
                المجموع الكلي: 80 ر.س
              </p>
            </div>
          </div>
        </div>

        {/* User Profile Management */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            إدارة الملف الشخصي
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
              البريد الإلكتروني:
              <input
                type="email"
                className="border rounded-md p-2"
                placeholder="البريد الإلكتروني"
              />
            </label>

            <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-3 rounded-full transition-colors duration-300">
              تحديث الملف الشخصي
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
