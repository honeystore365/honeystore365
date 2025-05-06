'use client';

import { signIn } from '@/actions/authActions';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('message');

  return (
    <div className="py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        تسجيل الدخول
      </h1>

      <div className="max-w-md mx-auto px-4 py-8 bg-white rounded-xl shadow-lg">
        <form className="flex flex-col gap-4" action={signIn}>
          {error && <p className="text-red-500 text-center">{error}</p>}
          <label className="flex flex-col">
            البريد الإلكتروني:
            <input
              type="email"
              className="border rounded-md p-2"
              placeholder="البريد الإلكتروني"
              name="email"
              required
            />
          </label>
          <label className="flex flex-col">
            كلمة المرور:
            <input
              type="password"
              className="border rounded-md p-2"
              placeholder="كلمة المرور"
              name="password"
              required
            />
          </label>

          <button type="submit" className="bg-primary hover:bg-primary-foreground text-primary-foreground font-bold py-3 rounded-full transition-colors duration-300">
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-primary hover:underline">
            هل نسيت كلمة المرور؟
          </a>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            أو سجل الدخول باستخدام
          </p>
          <div className="flex justify-center space-x-4 mt-4">
            <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
              جوجل
            </button>
            <button className="bg-gray-100 hover:bg-gray-200 rounded-full p-2">
              فيسبوك
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
