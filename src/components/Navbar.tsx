"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, User, Menu, X, LogOut } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("customerId");
    setUser(null);
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🍯</span>
            <span className="text-xl font-bold text-amber-700">HoneyStore</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/products" className="text-gray-700 hover:text-amber-600 font-medium">
              المنتجات
            </Link>
            <Link href="/cart" className="flex items-center gap-2 text-gray-700 hover:text-amber-600 font-medium">
              <ShoppingCart className="w-5 h-5" />
              السلة
            </Link>
            
            {user ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium">
                  <User className="w-5 h-5" />
                  ملفي
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  خروج
                </button>
              </>
            ) : (
              <Link href="/login" className="flex items-center gap-2 text-gray-700 hover:text-amber-600 font-medium">
                <User className="w-5 h-5" />
                تسجيل الدخول
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              <Link href="/products" className="text-gray-700 hover:text-amber-600 font-medium">
                المنتجات
              </Link>
              <Link href="/cart" className="flex items-center gap-2 text-gray-700 hover:text-amber-600 font-medium">
                <ShoppingCart className="w-5 h-5" />
                السلة
              </Link>
              
              {user ? (
                <>
                  <Link href="/profile" className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium">
                    <User className="w-5 h-5" />
                    ملفي
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-right"
                  >
                    <LogOut className="w-5 h-5" />
                    خروج
                  </button>
                </>
              ) : (
                <Link href="/login" className="flex items-center gap-2 text-gray-700 hover:text-amber-600 font-medium">
                  <User className="w-5 h-5" />
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
