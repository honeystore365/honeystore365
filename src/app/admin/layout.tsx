import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  Tag,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { getSettings } from "@/lib/db";

const navItems = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { href: "/admin/categories", label: "الفئات", icon: Tag },
  { href: "/admin/customers", label: "العملاء", icon: Users },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const storeName = settings?.store_name ? String(settings.store_name) : 'متجر العسل التونسي';

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top Header */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">ه</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">متجر العسل</h1>
            <p className="text-xs text-gray-500">{storeName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">لوحة الإدارة</span>
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="text-amber-700 font-semibold">م</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed top-16 right-0 bottom-0 w-64 bg-white border-l border-gray-200 pt-6 pb-4 z-40 overflow-y-auto">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${item.href === '/admin' ? 'sidebar-link-active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-3 right-3">
          <button className="sidebar-link w-full text-red-600 hover:bg-red-50">
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mr-64 pt-16 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
