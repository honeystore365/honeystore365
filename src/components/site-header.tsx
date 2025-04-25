
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {SidebarTrigger} from '@/components/ui/sidebar';

export function SiteHeader() {
  return (
    <header className="bg-card py-4 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-primary">
          منحلة الرحيق
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/products" className="hover:text-primary transition-colors duration-200">
            المنتجات
          </Link>
          <Link href="/cart" className="hover:text-primary transition-colors duration-200">
            السلة
          </Link>
          <Link href="/profile" className="hover:text-primary transition-colors duration-200">
            حسابي
          </Link>
          <Link href="/chatbot" className="hover:text-primary transition-colors duration-200">
            المحادثة الذكية
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="space-x-4">
          <Button variant="outline" asChild>
            <Link href="/auth/login">تسجيل الدخول</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">انشاء حساب</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </div>
    </header>
  );
}
