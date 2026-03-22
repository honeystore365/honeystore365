import Link from "next/link";

export default function VerifyEmailSentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📧</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">تحقق من بريدك الإلكتروني</h1>
        <p className="text-gray-600 mb-6">
          تم إرسال رابط تفعيل الحساب إلى عنوان بريدك الإلكتروني.
          يرجى النقر على الرابط لتفعيل حسابك.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
          <p>📬 تحقق من صندوق الرسائل غير المرغوب فيها إذا لم تجد الرسالة.</p>
        </div>
        <Link href="/login" className="inline-block bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors">
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
