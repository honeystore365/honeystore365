
export default function RegisterPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        إنشاء حساب جديد
      </h1>

      <div className="max-w-md mx-auto">
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
          <label className="flex flex-col">
            كلمة المرور:
            <input
              type="password"
              className="border rounded-md p-2"
              placeholder="كلمة المرور"
            />
          </label>
          <label className="flex flex-col">
            تأكيد كلمة المرور:
            <input
              type="password"
              className="border rounded-md p-2"
              placeholder="تأكيد كلمة المرور"
            />
          </label>

          <button className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-3 rounded-full transition-colors duration-300">
            إنشاء حساب
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            لديك حساب بالفعل؟
            <a href="/auth/login" className="text-primary hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
