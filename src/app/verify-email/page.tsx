"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("جاري التحقق...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("الرمز غير صالح");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "حدث خطأ أثناء تفعيل الحساب");
          return;
        }

        setStatus("success");
        setMessage(data.message || "تم تفعيل حسابك بنجاح!");
      } catch (err) {
        setStatus("error");
        setMessage("حدث خطأ أثناء الاتصال بالخادم");
      }
    };

    verifyEmail();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
          <span className="text-3xl">🍯</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800">جاري تفعيل الحساب...</h1>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">تم تفعيل الحساب!</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link href="/login" className="inline-block bg-amber-600 text-white px-8 py-3 rounded-lg hover:bg-amber-700 transition-colors">
          تسجيل الدخول الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">❌</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">فشل التفعيل</h1>
      <p className="text-gray-600 mb-6">{message}</p>
      <Link href="/register" className="inline-block text-amber-600 hover:underline">
        إنشاء حساب جديد
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <Suspense fallback={
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="animate-pulse">
            <div className="h-16 w-16 bg-amber-100 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
          </div>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
