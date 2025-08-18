import Link from 'next/link';
import { AlertTriangle, Home, LogIn } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              غير مخول للوصول
            </h1>
            <p className="text-gray-600 mb-6">
              عذراً، ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              هذه المنطقة مخصصة للمديرين المعتمدين فقط.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/"
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Home className="w-4 h-4 mr-2" />
              العودة للصفحة الرئيسية
            </Link>
            
            <Link
              href="/auth/login"
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogIn className="w-4 h-4 mr-2" />
              تسجيل الدخول كعميل
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم الفني.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}